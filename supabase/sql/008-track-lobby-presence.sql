-- Ticket 05 repair: preserve player records while tracking lobby presence.
-- Run after 007-secure-student-reconnect.sql.

alter table public.players
  add column if not exists is_in_lobby boolean not null default true;

drop function if exists public.get_host_roster(uuid);

create function public.get_host_roster(requested_session_id uuid)
returns table (player_id uuid, player_name text, joined_at timestamptz, is_in_lobby boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication is required';
  end if;

  if not exists (
    select 1 from public.game_sessions s
    where s.session_id = requested_session_id
      and s.host_user_id = caller_id
  ) then
    raise exception 'You cannot view this roster';
  end if;

  return query
  select p.player_id, p.player_name, p.joined_at, p.is_in_lobby
  from public.players p
  where p.session_id = requested_session_id
  order by p.is_in_lobby desc, p.joined_at;
end;
$$;

create function public.leave_lobby(requested_session_id uuid, supplied_reconnect_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.players
  set is_in_lobby = false,
      last_seen_at = now()
  where session_id = requested_session_id
    and reconnect_token_hash = encode(extensions.digest(supplied_reconnect_token, 'sha256'), 'hex');

  if not found then
    raise exception 'This player session could not be found';
  end if;
end;
$$;

revoke all on function public.leave_lobby(uuid, text) from public;
grant execute on function public.leave_lobby(uuid, text) to anon, authenticated;

-- Recreate the join function so reconnecting returns the player to the lobby.
create or replace function public.join_lobby(
  requested_pin text,
  requested_name text,
  supplied_reconnect_token text default null
)
returns table (player_id uuid, session_id uuid, session_title text, player_name text, reconnect_token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  lobby_session public.game_sessions%rowtype;
  clean_name text := trim(regexp_replace(coalesce(requested_name, ''), '\s+', ' ', 'g'));
  existing_player public.players%rowtype;
  new_token text;
  token_hash text;
begin
  if requested_pin !~ '^[0-9]{6}$' then raise exception 'Enter a six-digit Game PIN.'; end if;
  if char_length(clean_name) < 1 or char_length(clean_name) > 32 then raise exception 'Choose a display name between 1 and 32 characters.'; end if;

  select * into lobby_session from public.game_sessions where game_pin = requested_pin and status = 'LOBBY';
  if lobby_session.session_id is null then raise exception 'This Game PIN is not accepting players.'; end if;

  select * into existing_player from public.players where players.session_id = lobby_session.session_id and players.normalized_name = lower(clean_name);
  if existing_player.player_id is not null then
    if supplied_reconnect_token is not null and existing_player.reconnect_token_hash = encode(extensions.digest(supplied_reconnect_token, 'sha256'), 'hex') then
      update public.players set is_in_lobby = true, last_seen_at = now() where players.player_id = existing_player.player_id;
      return query select existing_player.player_id, lobby_session.session_id, q.title, existing_player.player_name, supplied_reconnect_token from public.quizzes q where q.quiz_id = lobby_session.quiz_id;
      return;
    end if;
    raise exception 'That display name is already in this game. Choose another one.';
  end if;

  new_token := encode(extensions.gen_random_bytes(32), 'hex');
  token_hash := encode(extensions.digest(new_token, 'sha256'), 'hex');
  begin
    insert into public.players (session_id, player_name, reconnect_token_hash, is_in_lobby) values (lobby_session.session_id, clean_name, token_hash, true) returning players.player_id into existing_player.player_id;
  exception when unique_violation then raise exception 'That display name is already in this game. Choose another one.'; end;
  return query select existing_player.player_id, lobby_session.session_id, q.title, clean_name, new_token from public.quizzes q where q.quiz_id = lobby_session.quiz_id;
end;
$$;
