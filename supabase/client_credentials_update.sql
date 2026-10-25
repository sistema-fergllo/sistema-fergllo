-- Faragello: admin-controlled client username/password updates
-- Run this migration in Supabase SQL Editor.
begin;

create or replace function public.admin_update_client_credentials(
  p_client_id text,
  p_username text,
  p_password text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_email text;
begin
  if not exists (
    select 1 from public.user_profiles up
    where up.user_id = auth.uid() and up.role = 'admin'
  ) then
    raise exception 'غير مصرح: مدير النظام فقط يمكنه تغيير بيانات دخول العميل.';
  end if;

  if p_client_id is null or trim(p_client_id) = '' then
    raise exception 'معرف العميل غير صحيح.';
  end if;

  if p_username is null or trim(p_username) = '' or p_username !~ '^[A-Za-z0-9._-]+$' then
    raise exception 'اسم المستخدم يجب أن يكون بالإنجليزية والأرقام فقط.';
  end if;

  if exists (
    select 1 from public.client_accounts
    where lower(username) = lower(trim(p_username))
      and id <> p_client_id
  ) then
    raise exception 'اسم المستخدم مستخدم بالفعل.';
  end if;

  select up.user_id
    into v_user_id
    from public.user_profiles up
   where up.client_id = p_client_id
     and up.role = 'client'
   limit 1;

  if v_user_id is null then
    raise exception 'لم يتم العثور على حساب الدخول الخاص بالعميل.';
  end if;

  v_email := lower(trim(p_username)) || '@fergllo.local';

  if exists (
    select 1 from auth.users u
    where lower(u.email) = lower(v_email)
      and u.id <> v_user_id
  ) then
    raise exception 'اسم المستخدم مستخدم بالفعل في حساب دخول آخر.';
  end if;

  update public.client_accounts
     set username = lower(trim(p_username))
   where id = p_client_id;

  if p_password is not null and length(p_password) > 0 then
    if length(p_password) < 6 then
      raise exception 'كلمة المرور الجديدة يجب أن تكون 6 أحرف أو أكثر.';
    end if;

    update auth.users
       set email = v_email,
           encrypted_password = crypt(p_password, gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_user_id;
  else
    update auth.users
       set email = v_email,
           updated_at = now()
     where id = v_user_id;
  end if;

  update auth.identities
     set identity_data = jsonb_set(
       coalesce(identity_data, '{}'::jsonb),
       '{email}',
       to_jsonb(v_email),
       true
     )
   where user_id = v_user_id
     and provider = 'email';
end;
$$;

revoke all on function public.admin_update_client_credentials(text,text,text) from public, anon;
grant execute on function public.admin_update_client_credentials(text,text,text) to authenticated;

commit;
