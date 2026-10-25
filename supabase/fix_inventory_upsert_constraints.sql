-- Fix Faragello inventory upsert conflict targets.
-- Safe/idempotent: checks for duplicate keys first and never deletes or rewrites stock rows.
begin;

do $$
begin
  if to_regclass('public.shared_inventory') is null then
    raise exception 'Table public.shared_inventory does not exist';
  end if;

  if exists (
    select 1
    from public.shared_inventory
    group by code
    having count(*) > 1
  ) then
    raise exception 'Cannot add unique index: duplicate codes exist in public.shared_inventory. No data was changed; inspect duplicate codes first.';
  end if;

  if to_regclass('public.client_inventory') is not null and exists (
    select 1
    from public.client_inventory
    group by client_id, code
    having count(*) > 1
  ) then
    raise exception 'Cannot add unique index: duplicate (client_id, code) pairs exist in public.client_inventory. No data was changed; inspect duplicates first.';
  end if;
end
$$;

create unique index if not exists shared_inventory_code_upsert_uidx
  on public.shared_inventory (code);

create unique index if not exists client_inventory_client_code_upsert_uidx
  on public.client_inventory (client_id, code);

commit;
