-- سيستم حلاوة: مخزون مستقل لكل فرع + تحويل ذري بين الفروع
-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor بعد التأكد من وجود فرع باسم "المصنع"
-- لكل عميل. يحتفظ client_inventory كسجل أصناف قديم ولا يحذف أي بيانات منه.

create table if not exists public.branch_inventory (
  client_id uuid not null references public.client_accounts(id) on delete cascade,
  branch_id uuid not null references public.client_branches(id) on delete cascade,
  code text not null,
  name text not null,
  price numeric(14,2) not null default 0,
  qty numeric(14,3) not null default 0,
  sold numeric(14,3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (client_id, branch_id, code)
);

create table if not exists public.branch_stock_movements (
  id bigint generated always as identity primary key,
  client_id uuid not null references public.client_accounts(id) on delete cascade,
  transfer_id text not null,
  from_branch_id uuid not null references public.client_branches(id),
  to_branch_id uuid not null references public.client_branches(id),
  code text not null,
  name text not null,
  qty numeric(14,3) not null check (qty > 0),
  created_at timestamptz not null default now(),
  unique (client_id, transfer_id, code)
);

alter table public.branch_inventory enable row level security;
alter table public.branch_stock_movements enable row level security;

grant select, insert, update on public.branch_inventory to authenticated;
grant select on public.branch_stock_movements to authenticated;

drop policy if exists branch_inventory_client_read on public.branch_inventory;
create policy branch_inventory_client_read on public.branch_inventory
for select to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and (p.role = 'admin' or (p.role = 'client' and p.client_id = branch_inventory.client_id))
  )
);

drop policy if exists branch_inventory_client_write on public.branch_inventory;
create policy branch_inventory_client_write on public.branch_inventory
for all to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and (p.role = 'admin' or (p.role = 'client' and p.client_id = branch_inventory.client_id))
  )
)
with check (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and (p.role = 'admin' or (p.role = 'client' and p.client_id = branch_inventory.client_id))
  )
);

drop policy if exists branch_stock_movements_read on public.branch_stock_movements;
create policy branch_stock_movements_read on public.branch_stock_movements
for select to authenticated
using (
  exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid()
      and (p.role = 'admin' or (p.role = 'client' and p.client_id = branch_stock_movements.client_id))
  )
);

-- ترحيل الرصيد الحالي إلى المصنع فقط، بشرط ألا يكون للعميل مخزون فروع مهيأ سابقًا.
do $$
declare c record; b record;
begin
  for c in select id from public.client_accounts loop
    select id into b
    from public.client_branches
    where client_id = c.id
      and lower(trim(name)) in ('المصنع','مصنع','factory')
    order by created_at
    limit 1;

    if b.id is not null
       and not exists (select 1 from public.branch_inventory bi where bi.client_id = c.id) then
      insert into public.branch_inventory(client_id, branch_id, code, name, price, qty, sold, updated_at)
      select ci.client_id, b.id, ci.code, ci.name, coalesce(ci.price,0),
             coalesce(ci.qty,0), coalesce(ci.sold,0), now()
      from public.client_inventory ci
      where ci.client_id = c.id
      on conflict (client_id, branch_id, code) do nothing;
    end if;
  end loop;
end $$;

create or replace function public.apply_branch_transfer(
  p_client_id uuid,
  p_transfer_id text,
  p_from_branch_id uuid,
  p_to_branch_id uuid,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_profile_client uuid;
  v_item jsonb;
  v_code text;
  v_name text;
  v_qty numeric(14,3);
  v_source public.branch_inventory%rowtype;
begin
  select role, client_id into v_role, v_profile_client
  from public.user_profiles where user_id = auth.uid();

  if v_role is null or not (v_role = 'admin' or (v_role = 'client' and v_profile_client = p_client_id)) then
    raise exception 'غير مصرح بتنفيذ التحويل لهذا العميل';
  end if;
  if p_transfer_id is null or length(trim(p_transfer_id)) = 0 then
    raise exception 'رقم إذن التحويل غير صالح';
  end if;
  if p_from_branch_id = p_to_branch_id then
    raise exception 'فرع الإرسال والاستلام يجب أن يكونا مختلفين';
  end if;
  if not exists(select 1 from public.client_branches where id=p_from_branch_id and client_id=p_client_id)
     or not exists(select 1 from public.client_branches where id=p_to_branch_id and client_id=p_client_id) then
    raise exception 'أحد الفرعين لا يتبع هذا العميل';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'لا توجد أصناف في إذن التحويل';
  end if;

  -- يمنع إعادة تطبيق الإذن حتى لو أعيد الضغط أو أعيد إرسال الطلب.
  if exists(select 1 from public.branch_stock_movements where client_id=p_client_id and transfer_id=p_transfer_id) then
    raise exception 'تم تطبيق هذا الإذن على المخزون من قبل';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_code := trim(coalesce(v_item->>'code',''));
    v_name := trim(coalesce(v_item->>'name',''));
    v_qty := (v_item->>'qty')::numeric;
    if v_code = '' or v_name = '' or v_qty is null or v_qty <= 0 then
      raise exception 'بيانات صنف غير صحيحة في إذن التحويل';
    end if;

    select * into v_source
    from public.branch_inventory
    where client_id=p_client_id and branch_id=p_from_branch_id and code=v_code
    for update;

    if not found or v_source.qty < v_qty then
      raise exception 'الرصيد غير كافٍ للصنف % في فرع الإرسال', v_name;
    end if;

    update public.branch_inventory
    set qty = qty - v_qty, updated_at=now()
    where client_id=p_client_id and branch_id=p_from_branch_id and code=v_code;

    insert into public.branch_inventory(client_id,branch_id,code,name,price,qty,sold,updated_at)
    values(p_client_id,p_to_branch_id,v_code,v_name,coalesce((v_item->>'price')::numeric, v_source.price),v_qty,0,now())
    on conflict(client_id,branch_id,code)
    do update set name=excluded.name, price=excluded.price,
                  qty=public.branch_inventory.qty+excluded.qty, updated_at=now();

    insert into public.branch_stock_movements(client_id,transfer_id,from_branch_id,to_branch_id,code,name,qty)
    values(p_client_id,p_transfer_id,p_from_branch_id,p_to_branch_id,v_code,v_name,v_qty);
  end loop;

  return jsonb_build_object('success',true,'transfer_id',p_transfer_id);
end;
$$;

revoke all on function public.apply_branch_transfer(uuid,text,uuid,uuid,jsonb) from public;
grant execute on function public.apply_branch_transfer(uuid,text,uuid,uuid,jsonb) to authenticated;

select 'تم تجهيز مخزون الفروع وترحيل الرصيد الحالي إلى المصنع بنجاح' as result;
