-- Repair the customer cashier RPC used by Faragello.
-- This replaces only the sale function; it does not delete sales or inventory rows.
begin;

drop function if exists public.complete_client_sale(text, text, jsonb);

create function public.complete_client_sale(
  p_shift text,
  p_pay text,
  p_items jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
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

    if v_qty > (
      select qty from public.client_inventory
      where client_id = v_client_id and code = v_code
    ) then
      raise exception 'الكمية غير كافية للصنف: %', v_name;
    end if;

    v_total := v_total + (v_qty * v_price);
    v_summary := concat_ws('، ', nullif(v_summary,''), v_name || ' × ' || v_qty::text);
  end loop;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.client_inventory
      set qty = qty - (v_item->>'qty')::numeric,
          sold = coalesce(sold,0) + (v_item->>'qty')::numeric,
          updated_at = now()
      where client_id = v_client_id and code = v_item->>'code';
  end loop;

  insert into public.client_sales (client_id, shift, pay, total, items_summary)
  values (v_client_id, coalesce(p_shift,'صباحي'), coalesce(p_pay,'كاش'), v_total, v_summary)
  returning id into v_sale_id;

  return v_sale_id;
end;
$$;

grant execute on function public.complete_client_sale(text, text, jsonb) to authenticated;
revoke execute on function public.complete_client_sale(text, text, jsonb) from anon;

notify pgrst, 'reload schema';
commit;
