-- Faragello multi-branch foundation
-- Run this file in Supabase SQL Editor before using the new branch controls.
create extension if not exists pgcrypto;

create table if not exists public.client_branches (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_accounts(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  status text not null default 'نشط' check (status in ('نشط','موقوف')),
  created_at timestamptz not null default now()
);
create index if not exists client_branches_client_id_idx on public.client_branches(client_id);

-- Keep PIN hashes in a separate table that clients cannot read directly.
create table if not exists public.client_branch_secrets (
  branch_id uuid primary key references public.client_branches(id) on delete cascade,
  pin_hash text not null
);
alter table public.client_branch_secrets enable row level security;

create table if not exists public.client_branch_inventory (
  branch_id uuid not null references public.client_branches(id) on delete cascade,
  client_id uuid not null references public.client_accounts(id) on delete cascade,
  code text not null,
  name text not null,
  price numeric not null default 0,
  qty numeric not null default 0,
  sold numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key(branch_id,code)
);
create index if not exists client_branch_inventory_client_idx on public.client_branch_inventory(client_id,branch_id);

create table if not exists public.client_branch_sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.client_accounts(id) on delete cascade,
  branch_id uuid not null references public.client_branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  shift text,
  pay text,
  total numeric not null default 0,
  items_summary text not null default '[]'
);
create index if not exists client_branch_sales_branch_date_idx on public.client_branch_sales(branch_id,created_at desc);

alter table public.client_branches enable row level security;
alter table public.client_branch_inventory enable row level security;
alter table public.client_branch_sales enable row level security;

drop policy if exists "branch admin manage" on public.client_branches;
create policy "branch admin manage" on public.client_branches for all to authenticated
using (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='admin'))
with check (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='admin'));

drop policy if exists "client read own branches" on public.client_branches;
create policy "client read own branches" on public.client_branches for select to authenticated
using (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='client' and p.client_id=client_branches.client_id));

drop policy if exists "client read active branch inventory" on public.client_branch_inventory;
create policy "client read active branch inventory" on public.client_branch_inventory for select to authenticated
using (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='client' and p.client_id=client_branch_inventory.client_id and p.branch_id=client_branch_inventory.branch_id));

drop policy if exists "client manage active branch inventory" on public.client_branch_inventory;
create policy "client manage active branch inventory" on public.client_branch_inventory for all to authenticated
using (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='client' and p.client_id=client_branch_inventory.client_id and p.branch_id=client_branch_inventory.branch_id))
with check (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='client' and p.client_id=client_branch_inventory.client_id and p.branch_id=client_branch_inventory.branch_id));

drop policy if exists "client read active branch sales" on public.client_branch_sales;
create policy "client read active branch sales" on public.client_branch_sales for select to authenticated
using (exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='client' and p.client_id=client_branch_sales.client_id and p.branch_id=client_branch_sales.branch_id));

create or replace function public.create_client_branch(p_client_id uuid,p_name text,p_pin text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare v_branch public.client_branches;
begin
 if not exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='admin') then
   raise exception 'غير مسموح إلا للمشرف بإضافة الفروع';
 end if;
 if p_name is null or length(trim(p_name))=0 then raise exception 'اسم الفرع مطلوب'; end if;
 if p_pin is null or length(p_pin)<6 then raise exception 'الرقم السري يجب أن يكون 6 أحرف على الأقل'; end if;
 insert into public.client_branches(client_id,name) values(p_client_id,trim(p_name)) returning * into v_branch;
 insert into public.client_branch_secrets(branch_id,pin_hash) values(v_branch.id,extensions.crypt(p_pin,extensions.gen_salt('bf')));
 insert into public.client_branch_inventory(branch_id,client_id,code,name,price,qty,sold,updated_at)
 select v_branch.id,ci.client_id,ci.code,ci.name,ci.price,ci.qty,ci.sold,now()
 from public.client_inventory ci where ci.client_id=p_client_id
 on conflict(branch_id,code) do nothing;
 return jsonb_build_object('id',v_branch.id,'client_id',v_branch.client_id,'name',v_branch.name,'status',v_branch.status,'created_at',v_branch.created_at);
end $;
revoke all on function public.create_client_branch(uuid,text,text) from public;
grant execute on function public.create_client_branch(uuid,text,text) to authenticated;

create or replace function public.verify_client_branch(p_branch_id uuid,p_pin text)
returns boolean
language plpgsql
security definer
set search_path=public,extensions
as $$
declare v_client_id uuid; v_hash text;
begin
 select b.client_id,s.pin_hash into v_client_id,v_hash
 from public.client_branches b
 join public.client_branch_secrets s on s.branch_id=b.id
 join public.user_profiles p on p.client_id=b.client_id
 where b.id=p_branch_id and b.status='نشط' and p.user_id=auth.uid() and p.role='client'
 limit 1;
 if v_client_id is null or v_hash is null or extensions.crypt(coalesce(p_pin,''),v_hash)<>v_hash then return false; end if;
 update public.user_profiles set branch_id=p_branch_id where user_id=auth.uid() and role='client' and client_id=v_client_id;
 return true;
end $$;
revoke all on function public.verify_client_branch(uuid,text) from public;
grant execute on function public.verify_client_branch(uuid,text) to authenticated;

create or replace function public.complete_client_branch_sale(p_shift text,p_pay text,p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare v_client uuid; v_branch uuid; v_total numeric:=0; v_item jsonb; v_sale public.client_branch_sales;
begin
 select client_id,branch_id into v_client,v_branch from public.user_profiles where user_id=auth.uid() and role='client';
 if v_client is null or v_branch is null then raise exception 'اختار الفرع أولًا'; end if;
 if not exists(select 1 from public.client_branches where id=v_branch and client_id=v_client and status='نشط') then raise exception 'الفرع غير متاح'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'الفاتورة فارغة'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
   if coalesce((v_item->>'qty')::numeric,0)<=0 then raise exception 'كمية غير صحيحة'; end if;
   update public.client_branch_inventory
     set qty=qty-(v_item->>'qty')::numeric,
         sold=sold+(v_item->>'qty')::numeric,updated_at=now()
     where branch_id=v_branch and client_id=v_client and code=v_item->>'code'
       and qty >= (v_item->>'qty')::numeric;
   if not found then raise exception 'الصنف غير موجود أو الكمية غير كافية في مخزون الفرع: %',v_item->>'name'; end if;
   v_total:=v_total+coalesce((v_item->>'line_total')::numeric,((v_item->>'qty')::numeric*(v_item->>'unit_price')::numeric));
 end loop;
 insert into public.client_branch_sales(client_id,branch_id,shift,pay,total,items_summary)
 values(v_client,v_branch,p_shift,p_pay,v_total,p_items::text) returning * into v_sale;
 return jsonb_build_object('id',v_sale.id,'total',v_total);
end $$;
revoke all on function public.complete_client_branch_sale(text,text,jsonb) from public;
grant execute on function public.complete_client_branch_sale(text,text,jsonb) to authenticated;
