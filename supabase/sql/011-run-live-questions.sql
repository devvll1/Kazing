-- Ticket 06: host-controlled question progression and one safe player answer.
-- Run after 010-use-python-programming-questions.sql.

create table public.player_answers (
  answer_id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(player_id) on delete cascade,
  session_question_id uuid not null references public.session_questions(session_question_id) on delete cascade,
  selected_answer public.answer_option not null,
  is_correct boolean not null,
  response_time_ms integer not null check (response_time_ms >= 0),
  points_earned integer not null default 0 check (points_earned >= 0),
  submitted_at timestamptz not null default now(),
  unique (player_id, session_question_id)
);

create index player_answers_question_idx on public.player_answers (session_question_id);
alter table public.player_answers enable row level security;

create function public.advance_host_question(requested_session_id uuid)
returns table (
  session_status public.session_status,
  session_question_id uuid,
  question_number integer,
  total_questions integer,
  question_deadline timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  locked_session public.game_sessions%rowtype;
  next_question public.session_questions%rowtype;
  question_count integer;
  next_position integer := 1;
begin
  if caller_id is null then raise exception 'Authentication is required'; end if;
  select * into locked_session from public.game_sessions
  where session_id = requested_session_id and host_user_id = caller_id for update;
  if locked_session.session_id is null then raise exception 'You cannot control this game.'; end if;
  if locked_session.status = 'FINISHED' then raise exception 'This game has already finished.'; end if;

  if locked_session.current_question_id is not null then
    select position + 1 into next_position from public.session_questions
    where session_question_id = locked_session.current_question_id;
  end if;

  select * into next_question from public.session_questions
  where session_id = requested_session_id and position = next_position;
  select count(*) into question_count from public.session_questions where session_id = requested_session_id;

  if next_question.session_question_id is null then
    update public.game_sessions set status = 'FINISHED', finished_at = now(), question_deadline = null
    where session_id = requested_session_id;
    return query select 'FINISHED'::public.session_status, null::uuid, question_count, question_count, null::timestamptz;
    return;
  end if;

  update public.game_sessions
  set status = 'ACTIVE', current_question_id = next_question.session_question_id,
      question_started_at = now(),
      question_deadline = now() + make_interval(secs => next_question.time_limit_seconds),
      started_at = coalesce(started_at, now())
  where session_id = requested_session_id;

  return query select 'ACTIVE'::public.session_status, next_question.session_question_id,
    next_question.position, question_count, now() + make_interval(secs => next_question.time_limit_seconds);
end;
$$;

create function public.get_host_game_state(requested_session_id uuid)
returns table (
  session_status public.session_status,
  question_number integer,
  total_questions integer,
  question_text text,
  question_deadline timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare caller_id uuid := auth.uid();
begin
  if caller_id is null then raise exception 'Authentication is required'; end if;
  if not exists (select 1 from public.game_sessions where session_id = requested_session_id and host_user_id = caller_id) then
    raise exception 'You cannot view this game.';
  end if;
  return query
  select s.status, coalesce(q.position, 0),
    (select count(*)::integer from public.session_questions where session_id = s.session_id),
    q.question_text, s.question_deadline
  from public.game_sessions s
  left join public.session_questions q on q.session_question_id = s.current_question_id
  where s.session_id = requested_session_id;
end;
$$;

create function public.get_player_game_state(requested_session_id uuid, supplied_reconnect_token text)
returns table (
  session_status public.session_status,
  session_question_id uuid,
  question_number integer,
  total_questions integer,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  question_deadline timestamptz,
  has_answered boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare player_record public.players%rowtype;
begin
  select * into player_record from public.players
  where session_id = requested_session_id
    and reconnect_token_hash = encode(extensions.digest(supplied_reconnect_token, 'sha256'), 'hex');
  if player_record.player_id is null then raise exception 'This player session could not be found.'; end if;

  return query
  select s.status, q.session_question_id, coalesce(q.position, 0),
    (select count(*)::integer from public.session_questions where session_id = s.session_id),
    q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, s.question_deadline,
    exists (select 1 from public.player_answers a where a.player_id = player_record.player_id and a.session_question_id = q.session_question_id)
  from public.game_sessions s
  left join public.session_questions q on q.session_question_id = s.current_question_id
  where s.session_id = requested_session_id;
end;
$$;

create function public.submit_player_answer(
  requested_session_id uuid,
  supplied_reconnect_token text,
  requested_answer public.answer_option
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  player_record public.players%rowtype;
  locked_session public.game_sessions%rowtype;
  current_question public.session_questions%rowtype;
  elapsed_ms integer;
begin
  select * into player_record from public.players
  where session_id = requested_session_id
    and reconnect_token_hash = encode(extensions.digest(supplied_reconnect_token, 'sha256'), 'hex');
  if player_record.player_id is null then raise exception 'This player session could not be found.'; end if;

  select * into locked_session from public.game_sessions where session_id = requested_session_id for share;
  if locked_session.status <> 'ACTIVE' or locked_session.current_question_id is null then raise exception 'There is no open question.'; end if;
  if locked_session.question_deadline <= now() then raise exception 'Time is up for this question.'; end if;

  select * into current_question from public.session_questions where session_question_id = locked_session.current_question_id;
  elapsed_ms := greatest(0, floor(extract(epoch from (now() - locked_session.question_started_at)) * 1000)::integer);
  begin
    insert into public.player_answers (player_id, session_question_id, selected_answer, is_correct, response_time_ms, points_earned)
    values (player_record.player_id, current_question.session_question_id, requested_answer,
      requested_answer = current_question.correct_answer, elapsed_ms, 0);
  exception when unique_violation then
    raise exception 'You already answered this question.';
  end;
end;
$$;

revoke all on function public.advance_host_question(uuid) from public;
revoke all on function public.get_host_game_state(uuid) from public;
revoke all on function public.get_player_game_state(uuid, text) from public;
revoke all on function public.submit_player_answer(uuid, text, public.answer_option) from public;
grant execute on function public.advance_host_question(uuid) to authenticated;
grant execute on function public.get_host_game_state(uuid) to authenticated;
grant execute on function public.get_player_game_state(uuid, text) to anon, authenticated;
grant execute on function public.submit_player_answer(uuid, text, public.answer_option) to anon, authenticated;
