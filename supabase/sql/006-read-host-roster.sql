-- Ticket 05 fix: retrieve the roster through a host-authorized RPC.
-- Run after 005-add-player-lobby.sql.

create function public.get_host_roster(requested_session_id uuid)
returns table (player_id uuid, player_name text, joined_at timestamptz)
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
  select p.player_id, p.player_name, p.joined_at
  from public.players p
  where p.session_id = requested_session_id
  order by p.joined_at;
end;
$$;

revoke all on function public.get_host_roster(uuid) from public;
grant execute on function public.get_host_roster(uuid) to authenticated;
