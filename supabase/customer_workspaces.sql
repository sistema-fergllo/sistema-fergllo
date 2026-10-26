-- Sistema Fergllo: isolated customer workspaces
-- Run this migration in Supabase SQL Editor before enabling customer logins.
begin;

create table if not exists public.client_accounts (
  id text primary key,
  name text not null,
  project text,
  email text not null unique,
  status text not null default 'نشط' check (status in ('نشط','موقوف')),
  created_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists client_id text references public.client_accounts(id) on delete set null;

create table if not exists public.client_inventory (
  client_id text not null references public.client_accounts(id) on delete cascade,
  code text not null,
  name text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  qty numeric(12,3) not null default 0,
  sold numeric(12,3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (client_id, code)
);

create table if not exists public.client_sales (
  id bigint generated always as identity primary key,
  client_id text not null references public.client_accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  shift text not null,
  pay text not null,
  total numeric(12,2) not null check (total >= 0),
  items_summary text not null default ''
);

create index if not exists client_sales_client_created_idx
  on public.client_sales (client_id, created_at desc);

alter table public.client_accounts enable row level security;
alter table public.client_inventory enable row level security;
alter table public.client_sales enable row level security;

-- Helper: a signed-in user's client ID, if they are a customer.
create or replace function public.current_client_id()
returns text
language sql stable security definer
set search_path = public
as $$
  select up.client_id
  from public.user_profiles up
  where up.user_id = auth.uid()
    and up.role = 'client'
  limit 1;
$$;

-- Only administrators manage customer accounts; clients can read their own active account.
drop policy if exists "admins manage client accounts" on public.client_accounts;
create policy "admins manage client accounts" on public.client_accounts
  for all to authenticated
  using (exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ));

drop policy if exists "clients read own account" on public.client_accounts;
create policy "clients read own account" on public.client_accounts
  for select to authenticated
  using (id = public.current_client_id() and status = 'نشط');

drop policy if exists "admins manage client inventory" on public.client_inventory;
create policy "admins manage client inventory" on public.client_inventory
  for all to authenticated
  using (exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ));

drop policy if exists "clients access own inventory" on public.client_inventory;
create policy "clients access own inventory" on public.client_inventory
  for all to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

drop policy if exists "admins manage client sales" on public.client_sales;
create policy "admins manage client sales" on public.client_sales
  for all to authenticated
  using (exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ));

drop policy if exists "clients access own sales" on public.client_sales;
drop policy if exists "clients read own sales" on public.client_sales;
create policy "clients read own sales" on public.client_sales
  for select to authenticated
  using (client_id = public.current_client_id());

-- New customer sign-ups are matched to a customer record by email.
-- No customer is granted access unless an administrator created the record first.
create or replace function public.handle_customer_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_client public.client_accounts%rowtype;
begin
  if coalesce(new.raw_user_meta_data->>'account_type','') <> 'client' then
    return new;
  end if;

  select * into matched_client
  from public.client_accounts
  where lower(email) = lower(new.email)
    and status = 'نشط'
  limit 1;

  if matched_client.id is null then
    raise exception 'لا يوجد حساب عميل نشط بهذا البريد. تواصل مع مدير النظام.';
  end if;

  insert into public.user_profiles (user_id, full_name, role, client_id)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), matched_client.name),
    'client',
    matched_client.id
  )
  on conflict (user_id) do update
    set full_name = excluded.full_name,
        role = 'client',
        client_id = excluded.client_id;

  return new;
end;
$$;

drop trigger if exists on_customer_auth_created on auth.users;
create trigger on_customer_auth_created
  after insert on auth.users
  for each row execute procedure public.handle_customer_signup();

-- Transactional sale function: can only affect the signed-in customer's own workspace.
create or replace function public.complete_client_sale(
  p_shift text,
  p_pay text,
  p_items jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $
declare
  v_client_id text := public.current_client_id();
  v_total numeric(12,2) := 0;
  v_summary text := '';
  v_item jsonb;
  v_code text;
  v_qty numeric(12,3);
  v_price numeric(12,2);
  v_name text;
  v_sale_id bigint;
begin
  if v_client_id is null then
    raise exception 'حساب العميل غير مربوط بمساحة عمل.';
  end if;
  if not exists (
    select 1 from public.client_accounts
    where id = v_client_id and status = 'نشط'
  ) then
    raise exception 'حساب العميل موقوف.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'الفاتورة فارغة.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_code := v_item->>'code';
    v_qty := (v_item->>'qty')::numeric;
    if v_qty <= 0 then raise exception 'كمية غير صحيحة.'; end if;

    select name, price into v_name, v_price
      from public.client_inventory
      where client_id = v_client_id and code = v_code
      for update;

    if not found then raise exception 'صنف غير موجود: %', v_code; end if;

v_total := v_total + (v_qty * v_price);
    v_summary := concat_ws('، ', nullif(v_summary,''), v_name || ' × ' || v_qty::text);
  end loop;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.client_inventory
      set qty = qty - (v_item->>'qty')::numeric,
          sold = sold + (v_item->>'qty')::numeric,
          updated_at = now()
      where client_id = v_client_id and code = v_item->>'code';
  end loop;

  insert into public.client_sales (client_id, shift, pay, total, items_summary)
  values (v_client_id, coalesce(p_shift,'الشيفت الأول'), coalesce(p_pay,'كاش'), v_total, v_summary)
  returning id into v_sale_id;

  return v_sale_id;
end;
$$;


-- Lock the legacy shared workspace to administrators only. Replace any older
-- permissive policies so customer sessions cannot read or mutate shared rows.
create or replace function public.is_system_admin()
returns boolean
language sql stable security definer
set search_path = public
as $
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  );
$;

alter table public.shared_inventory enable row level security;
alter table public.shared_sales enable row level security;

do $
declare p record;
begin
  for p in select policyname from pg_policies
    where schemaname='public' and tablename='shared_inventory'
  loop
    execute format('drop policy if exists %I on public.shared_inventory', p.policyname);
  end loop;
  for p in select policyname from pg_policies
    where schemaname='public' and tablename='shared_sales'
  loop
    execute format('drop policy if exists %I on public.shared_sales', p.policyname);
  end loop;
end $;

create policy "admins only shared inventory" on public.shared_inventory
  for all to authenticated using (public.is_system_admin())
  with check (public.is_system_admin());
create policy "admins only shared sales" on public.shared_sales
  for all to authenticated using (public.is_system_admin())
  with check (public.is_system_admin());

-- Replacement for the legacy sale RPC: explicit administrator check and atomic stock deduction.
create or replace function public.complete_admin_shared_sale(
  p_shift text,
  p_pay text,
  p_items jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $
declare
  v_total numeric(12,2) := 0;
  v_summary text := '';
  v_item jsonb;
  v_code text;
  v_qty numeric(12,3);
  v_price numeric(12,2);
  v_name text;
  v_sale_id text;
begin
  if not public.is_system_admin() then
    raise exception 'غير مصرح: العملية متاحة لمدير النظام فقط.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'الفاتورة فارغة.';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_code := v_item->>'code';
    v_qty := (v_item->>'qty')::numeric;
    if v_qty <= 0 then raise exception 'كمية غير صحيحة.'; end if;
    select name, price, qty into v_name, v_price, v_qty
      from public.shared_inventory where code = v_code for update;
    if not found then raise exception 'صنف غير موجود: %', v_code; end if;
v_total := v_total + ((v_item->>'qty')::numeric * v_price);
    v_summary := concat_ws('، ', nullif(v_summary,''), v_name || ' × ' || (v_item->>'qty'));
  end loop;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.shared_inventory
      set qty = qty - (v_item->>'qty')::numeric,
          sold = coalesce(sold,0) + (v_item->>'qty')::numeric,
          updated_at = now()
      where code = v_item->>'code';
  end loop;

  insert into public.shared_sales (shift, pay, total, items_summary)
  values (coalesce(p_shift,'الشيفت الأول'), coalesce(p_pay,'كاش'), v_total, v_summary)
  returning id::text into v_sale_id;
  return v_sale_id;
end;
$;

revoke execute on function public.complete_shared_sale(text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.complete_admin_shared_sale(text,text,jsonb) from public, anon;
revoke execute on function public.complete_client_sale(text,text,jsonb) from public, anon;
grant execute on function public.complete_admin_shared_sale(text,text,jsonb) to authenticated;
grant execute on function public.complete_client_sale(text,text,jsonb) to authenticated;

grant execute on function public.current_client_id() to authenticated;
grant execute on function public.complete_client_sale(text,text,jsonb) to authenticated;

commit;
