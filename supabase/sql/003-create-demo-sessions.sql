-- Ticket 04: prepared demo quiz and host-created live sessions.
-- Run after 002-create-instructor-profiles.sql in Supabase SQL Editor.

create type public.session_status as enum ('LOBBY', 'ACTIVE', 'FINISHED');
create type public.answer_option as enum ('A', 'B', 'C', 'D');

create table public.quizzes (
  quiz_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.questions (
  question_id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(quiz_id) on delete cascade,
  question_text text not null check (char_length(trim(question_text)) between 1 and 500),
  option_a text not null check (char_length(trim(option_a)) between 1 and 200),
  option_b text not null check (char_length(trim(option_b)) between 1 and 200),
  option_c text not null check (char_length(trim(option_c)) between 1 and 200),
  option_d text not null check (char_length(trim(option_d)) between 1 and 200),
  correct_answer public.answer_option not null,
  time_limit_seconds integer not null check (time_limit_seconds between 5 and 120),
  points integer not null check (points between 1 and 1000),
  position integer not null check (position > 0),
  unique (quiz_id, position)
);

create table public.game_sessions (
  session_id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(quiz_id) on delete restrict,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  game_pin char(6) not null check (game_pin ~ '^[0-9]{6}$'),
  status public.session_status not null default 'LOBBY',
  current_question_id uuid,
  question_started_at timestamptz,
  question_deadline timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index active_session_game_pin_key
  on public.game_sessions (game_pin)
  where status in ('LOBBY', 'ACTIVE');

create index quizzes_owner_idx on public.quizzes (user_id);
create index questions_quiz_position_idx on public.questions (quiz_id, position);
create index sessions_host_idx on public.game_sessions (host_user_id, created_at desc);

create table public.session_questions (
  session_question_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(session_id) on delete cascade,
  source_question_id uuid references public.questions(question_id) on delete set null,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer public.answer_option not null,
  time_limit_seconds integer not null check (time_limit_seconds between 5 and 120),
  points integer not null check (points between 1 and 1000),
  position integer not null check (position > 0),
  unique (session_id, position)
);

alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_questions enable row level security;

create policy "hosts can read their quizzes" on public.quizzes for select to authenticated using ((select auth.uid()) = user_id);
create policy "hosts can read their questions" on public.questions for select to authenticated using (exists (select 1 from public.quizzes where quizzes.quiz_id = questions.quiz_id and quizzes.user_id = (select auth.uid())));
create policy "hosts can read their sessions" on public.game_sessions for select to authenticated using ((select auth.uid()) = host_user_id);
-- Session question snapshots contain answer keys. No browser role reads them directly.

create function public.create_demo_session()
returns table (session_id uuid, game_pin text, quiz_title text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  demo_quiz_id uuid;
  new_session_id uuid;
  next_pin char(6);
  attempts integer := 0;
begin
  if caller_id is null then
    raise exception 'Authentication is required';
  end if;

  select q.quiz_id into demo_quiz_id
  from public.quizzes q
  where q.user_id = caller_id and q.title = 'Kazing! Space Challenge'
  order by q.created_at
  limit 1;

  if demo_quiz_id is null then
    insert into public.quizzes (user_id, title, description)
    values (caller_id, 'Kazing! Space Challenge', 'A short prepared quiz for your first Kazing! live game.')
    returning quiz_id into demo_quiz_id;

    insert into public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit_seconds, points, position)
    values
      (demo_quiz_id, 'Which planet is known as the Red Planet?', 'Earth', 'Mars', 'Jupiter', 'Venus', 'B', 20, 100, 1),
      (demo_quiz_id, 'What is the name of Earth''s natural satellite?', 'Europa', 'Titan', 'The Moon', 'Phobos', 'C', 20, 100, 2),
      (demo_quiz_id, 'Which force keeps planets in orbit around the Sun?', 'Gravity', 'Magnetism', 'Friction', 'Electricity', 'A', 20, 100, 3);
  end if;

  loop
    attempts := attempts + 1;
    -- gen_random_uuid is generated from a cryptographically secure source in Supabase PostgreSQL.
    next_pin := lpad((((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) & 2147483647) % 1000000)::text, 6, '0');
    begin
      insert into public.game_sessions (quiz_id, host_user_id, game_pin)
      values (demo_quiz_id, caller_id, next_pin)
      returning game_sessions.session_id into new_session_id;
      exit;
    exception when unique_violation then
      if attempts >= 10 then
        raise exception 'Could not create a unique Game PIN. Please try again.';
      end if;
    end;
  end loop;

  insert into public.session_questions (session_id, source_question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit_seconds, points, position)
  select new_session_id, question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit_seconds, points, position
  from public.questions
  where quiz_id = demo_quiz_id
  order by position;

  return query select new_session_id, next_pin::text, 'Kazing! Space Challenge'::text;
end;
$$;

revoke all on function public.create_demo_session() from public;
grant execute on function public.create_demo_session() to authenticated;
