-- Ticket 02: instructor identity for Kazing!.
--
-- Run this in Supabase Dashboard -> SQL Editor -> New query.
-- It is safe to run once in a new project. Do not run it against a
-- production project that already has a conflicting profiles table.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "instructors can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "instructors can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- This trigger creates the profile without giving browser users broad
-- insert access to profiles. The fixed search_path prevents object-name
-- spoofing inside the security-definer function.
create function public.handle_new_instructor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

revoke all on function public.handle_new_instructor() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_instructor();
