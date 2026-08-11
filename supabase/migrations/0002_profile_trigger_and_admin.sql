-- ============================================================
-- Migration: Profile trigger + Admin RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Function: auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Trigger: fires after every new auth user is inserted
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Backfill: create profile rows for any users who registered before the trigger
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'customer'
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- 4. Promote aryanwaheednew@gmail.com to admin
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'aryanwaheednew@gmail.com'
);

-- 5. Add RLS policy so server-side (service role / security definer) can read all profiles
-- The profiles table currently only allows users to read their OWN row.
-- We need an update policy so users can update their own profile too.
create policy "profiles update own row"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- 6. Verify the result
select u.email, p.full_name, p.role
from auth.users u
join public.profiles p on p.id = u.id
order by p.created_at desc;
