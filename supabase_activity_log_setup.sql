-- Faragello activity feed setup
-- Run this script once in Supabase SQL Editor for activity messages to sync across devices.

create table if not exists public.system_activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  client_id uuid null references public.client_accounts(id) on delete set null,
  event_type text not null default 'activity',
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists system_activity_log_created_at_idx
  on public.system_activity_log (created_at desc);
create index if not exists system_activity_log_client_created_at_idx
  on public.system_activity_log (client_id, created_at desc);

alter table public.system_activity_log enable row level security;
grant select, insert on public.system_activity_log to authenticated;

drop policy if exists "activity_log_select_admin_or_own_client" on public.system_activity_log;
create policy "activity_log_select_admin_or_own_client"
on public.system_activity_log
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles me
    where me.user_id = auth.uid() and me.role = 'admin'
  )
  or (
    client_id is not null
    and exists (
      select 1 from public.user_profiles me
      where me.user_id = auth.uid()
        and me.role = 'client'
        and me.client_id = system_activity_log.client_id
    )
  )
);

drop policy if exists "activity_log_insert_self_role" on public.system_activity_log;
create policy "activity_log_insert_self_role"
on public.system_activity_log
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    (
      role = 'admin'
      and exists (
        select 1 from public.user_profiles me
        where me.user_id = auth.uid() and me.role = 'admin'
      )
    )
    or (
      role = 'client'
      and client_id is not null
      and exists (
        select 1 from public.user_profiles me
        where me.user_id = auth.uid()
          and me.role = 'client'
          and me.client_id = system_activity_log.client_id
      )
    )
  )
);
