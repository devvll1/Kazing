-- Ticket 04 fix: read one host-owned lobby through a narrow, authenticated RPC.
-- Run after 003-create-demo-sessions.sql in Supabase SQL Editor.

create function public.get_host_lobby(requested_session_id uuid)
returns table (session_id uuid, game_pin text, status public.session_status, quiz_title text)
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

  return query
  select s.session_id, s.game_pin::text, s.status, q.title
  from public.game_sessions s
  join public.quizzes q on q.quiz_id = s.quiz_id
  where s.session_id = requested_session_id
    and s.host_user_id = caller_id;
end;
$$;

revoke all on function public.get_host_lobby(uuid) from public;
grant execute on function public.get_host_lobby(uuid) to authenticated;
