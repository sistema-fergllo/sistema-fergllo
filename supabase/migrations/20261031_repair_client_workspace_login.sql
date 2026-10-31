-- Repair legacy customer logins whose auth user exists but user_profiles.client_id is empty.
-- The mapping is allowed only when the authenticated user's internal email matches
-- exactly one active client account by email or username.
begin;

create or replace function public.resolve_current_client_workspace()
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
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

  if v_role <> 'client' then
    raise exception 'هذه الوظيفة مخصصة لحساب العميل فقط.';
  end if;

  select lower(email) into v_email
  from auth.users
  where id = v_uid;

  select count(distinct ca.id), min(ca.id)
    into v_match_count, v_client_id
  from public.client_accounts ca
  where ca.status = 'نشط'
    and (
      lower(ca.email) = v_email
      or (
        ca.username is not null
        and lower(ca.username) || '@fergllo.local' = v_email
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
$$;

revoke all on function public.resolve_current_client_workspace() from public, anon;
grant execute on function public.resolve_current_client_workspace() to authenticated;

commit;
