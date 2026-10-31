-- Faragello: self-service customer account creation
begin;

create or replace function public.create_customer_account(
  p_name text,
  p_username text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(p_username));
  v_name text := trim(p_name);
  v_email text;
  v_id text := 'client-' || replace(gen_random_uuid()::text,'-','');
begin
  if v_name = '' then raise exception 'اكتب اسم العميل.'; end if;
  if v_username !~ '^[A-Za-z0-9._-]{3,40}$' then
    raise exception 'اسم المستخدم يجب أن يكون بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.';
  end if;
  v_email := v_username || '@fergllo.local';

  if exists (select 1 from public.client_accounts where lower(username)=v_username or lower(email)=v_email) then
    raise exception 'اسم المستخدم مستخدم بالفعل.';
  end if;

  insert into public.client_accounts(id,name,project,email,status,created_at)
  values(v_id,v_name,v_name,v_email,'نشط',now());

  return jsonb_build_object('id',v_id,'name',v_name,'username',v_username,'email',v_email);
end;
$$;

revoke all on function public.create_customer_account(text,text) from public, authenticated;
grant execute on function public.create_customer_account(text,text) to anon;

commit;
