-- Return the authenticated client's active workspace directly, avoiding client_accounts RLS read failures.
begin;

create or replace function public.get_current_client_workspace()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_role text;
  v_profile_client_id text;
  v_client_id text;
  v_match_count integer;
  v_account public.client_accounts%rowtype;
begin
  if v_uid is null then
    raise exception 'يجب تسجيل الدخول أولاً.';
  end if;

  select role, client_id
    into v_role, v_profile_client_id
  from public.user_profiles
  where user_id = v_uid;

  if v_role is distinct from 'client' then
    raise exception 'الحساب الحالي ليس حساب عميل.';
  end if;

  select lower(email) into v_email
  from auth.users
  where id = v_uid;

  select count(distinct ca.id), (array_agg(distinct ca.id))[1]::text
    into v_match_count, v_client_id
  from public.client_accounts ca
  where ca.status = 'نشط'
    and (
      (v_email is not null and lower(coalesce(ca.email,'')) = v_email)
      or (
        v_email is not null
        and lower(coalesce(ca.username,'')) =
            regexp_replace(split_part(v_email,'@',1), '[^a-z0-9._-]', '', 'g')
        and split_part(v_email,'@',2) = 'fergllo.local'
      )
    );

  if v_match_count > 1 then
    raise exception 'يوجد أكثر من حساب عميل مرتبط ببيانات الدخول. راجع مدير النظام.';
  elsif v_match_count = 0 and v_profile_client_id is not null then
    select id into v_client_id
    from public.client_accounts
    where id = v_profile_client_id and status = 'نشط';
  end if;

  if v_client_id is null then
    return null;
  end if;

  update public.user_profiles
     set client_id = v_client_id
   where user_id = v_uid and role = 'client'
     and client_id is distinct from v_client_id;

  select * into v_account
  from public.client_accounts
  where id = v_client_id and status = 'نشط';

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_account.id,
    'name', v_account.name,
    'project', v_account.project,
    'email', v_account.email,
    'phone', v_account.phone,
    'status', v_account.status
  );
end;
$$;

revoke all on function public.get_current_client_workspace() from public, anon;
grant execute on function public.get_current_client_workspace() to authenticated;


-- Also repair the legacy resolver: older login/database paths may still invoke it.
create or replace function public.resolve_current_client_workspace()
returns text
language plpgsql
security definer
set search_path = public, auth
as $
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_role text;
  v_client_id text;
  v_match_count integer;
begin
  if v_uid is null then
    raise exception 'يجب تسجيل الدخول أولاً.';
  end if;

  select role into v_role
  from public.user_profiles
  where user_id = v_uid;

  if v_role is distinct from 'client' then
    raise exception 'هذه الوظيفة مخصصة لحساب العميل فقط.';
  end if;

  select lower(email) into v_email
  from auth.users
  where id = v_uid;

  select count(distinct ca.id), (array_agg(distinct ca.id))[1]::text
    into v_match_count, v_client_id
  from public.client_accounts ca
  where ca.status = 'نشط'
    and (
      (v_email is not null and lower(coalesce(ca.email,'')) = v_email)
      or (
        v_email is not null
        and lower(coalesce(ca.username,'')) =
            regexp_replace(split_part(v_email,'@',1), '[^a-z0-9._-]', '', 'g')
        and split_part(v_email,'@',2) = 'fergllo.local'
      )
    );

  if coalesce(v_match_count, 0) = 0 then
    return null;
  end if;

  if v_match_count > 1 then
    raise exception 'بيانات الدخول تطابق أكثر من حساب عميل. راجع مدير النظام.';
  end if;

  update public.user_profiles
     set client_id = v_client_id
   where user_id = v_uid
     and role = 'client';

  return v_client_id;
end;
$;

revoke all on function public.resolve_current_client_workspace() from public, anon;
grant execute on function public.resolve_current_client_workspace() to authenticated;

commit;
