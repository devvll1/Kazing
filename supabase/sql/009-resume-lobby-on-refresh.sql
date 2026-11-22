-- Ticket 05 repair: refreshing a valid student lobby restores active presence.
-- Run after 008-track-lobby-presence.sql.

create or replace function public.get_player_lobby(
  requested_session_id uuid,
  supplied_reconnect_token text
)
returns table (player_id uuid, player_name text, session_title text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.players
  set is_in_lobby = true,
      last_seen_at = now()
  where session_id = requested_session_id
    and reconnect_token_hash = encode(extensions.digest(supplied_reconnect_token, 'sha256'), 'hex');

  return query
  select p.player_id, p.player_name, q.title
  from public.players p
  join public.game_sessions s on s.session_id = p.session_id
  join public.quizzes q on q.quiz_id = s.quiz_id
  where p.session_id = requested_session_id
    and p.reconnect_token_hash = encode(extensions.digest(supplied_reconnect_token, 'sha256'), 'hex');
end;
$$;
