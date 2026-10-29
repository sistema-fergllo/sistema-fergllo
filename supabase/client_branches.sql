-- Faragello: client branches with per-branch PIN hashes
create extension if not exists pgcrypto;

create table if not exists public.client_branches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_accounts(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  pin_hash text not null check (pin_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

-- Upgrade an existing client_branches table created before PIN support.
-- Existing rows will have a NULL PIN hash and should be deleted/re-added from the admin screen.
alter table public.client_branches
  add column if not exists pin_hash text;

create index if not exists client_branches_client_id_idx
  on public.client_branches(client_id);

alter table public.client_branches enable row level security;

drop policy if exists "Admins manage client branches" on public.client_branches;
create policy "Admins manage client branches"
on public.client_branches
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "Clients read their own branches" on public.client_branches;
create policy "Clients read their own branches"
on public.client_branches
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role = 'client'
      and p.client_id = client_branches.client_id
  )
);
