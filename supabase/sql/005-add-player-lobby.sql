-- Ticket 05: anonymous student lobby joining and host roster updates.
-- Run after 003-create-demo-sessions.sql and 004-read-host-lobby.sql.

create table public.players (
  player_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(session_id) on delete cascade,
  player_name text not null check (char_length(trim(player_name)) between 1 and 32),
  normalized_name text generated always as (lower(trim(player_name))) stored,
  reconnect_token_hash text,
  total_score integer not null default 0 check (total_score >= 0),
  last_seen_at timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  unique (session_id, normalized_name)
);

create index players_session_idx on public.players (session_id, joined_at);

alter table public.players enable row level security;

-- Only the host can directly read the roster. Students join through the
-- controlled function below, so the browser cannot insert arbitrary rows.
create policy "hosts can read their session players"
  on public.players for select to authenticated
  using (exists (
    select 1 from public.game_sessions s
    where s.session_id = players.session_id
      and s.host_user_id = (select auth.uid())
  ));

create function public.join_lobby(requested_pin text, requested_name text)
returns table (player_id uuid, session_id uuid, session_title text, player_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  lobby_session public.game_sessions%rowtype;
  clean_name text := trim(regexp_replace(coalesce(requested_name, ''), '\s+', ' ', 'g'));
  new_player_id uuid;
begin
  if requested_pin !~ '^[0-9]{6}$' then
    raise exception 'Enter a six-digit Game PIN.';
  end if;

  if char_length(clean_name) < 1 or char_length(clean_name) > 32 then
    raise exception 'Choose a display name between 1 and 32 characters.';
  end if;

  select * into lobby_session
  from public.game_sessions
  where game_pin = requested_pin
    and status = 'LOBBY';

  if lobby_session.session_id is null then
    raise exception 'This Game PIN is not accepting players.';
  end if;

  begin
    insert into public.players (session_id, player_name)
    values (lobby_session.session_id, clean_name)
    returning players.player_id into new_player_id;
  exception when unique_violation then
    raise exception 'That display name is already in this game. Choose another one.';
  end;

  return query
  select new_player_id, lobby_session.session_id, q.title, clean_name
  from public.quizzes q
  where q.quiz_id = lobby_session.quiz_id;
end;
$$;

revoke all on function public.join_lobby(text, text) from public;
grant execute on function public.join_lobby(text, text) to anon, authenticated;

-- Realtime sends the host a notification of committed roster changes. The host
-- still reads the authorized roster from the table, so missed events are safe.
alter publication supabase_realtime add table public.players;
