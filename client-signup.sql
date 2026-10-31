-- Faragello: single-step public customer signup.
-- Run once in Supabase SQL Editor. New Auth signup creates the customer row and profile atomically.
begin;

alter table public.client_accounts add column if not exists username text;
alter table public.client_accounts add column if not exists phone text;

create unique index if not exists client_accounts_username_lower_uidx
  on public.client_accounts (lower(username)) where username is not null;

-- Remove the old two-request registration RPC; the Auth trigger below now owns creation.
drop function if exists public.create_customer_account(text,text);
drop function if exists public.create_customer_account(text,text,text);

-- Customer accounts use an internal username-based email, so confirm these accounts
-- automatically instead of waiting for a mailbox that does not exist.
create or replace function public.auto_confirm_faragello_customer()
returns trigger
language plpgsql
security definer
set search_path = auth
as $$
begin
  if coalesce(new.raw_user_meta_data->>'account_type','') = 'client' then
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists faragello_auto_confirm_customer on auth.users;
create trigger faragello_auto_confirm_customer
  before insert on auth.users
  for each row execute procedure public.auto_confirm_faragello_customer();

create or replace function public.handle_customer_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(coalesce(new.raw_user_meta_data->>'username','')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'full_name',''));
  v_phone text := regexp_replace(coalesce(new.raw_user_meta_data->>'phone',''), '[[:space:]()-]', '', 'g');
  v_client_id text;
begin
  if coalesce(new.raw_user_meta_data->>'account_type','') <> 'client' then
    return new;
  end if;

  if v_name = '' then raise exception 'اكتب اسم العميل.'; end if;
  if v_username !~ '^[A-Za-z0-9._-]{3,40}$' then
    raise exception 'اسم المستخدم يجب أن يكون بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.';
  end if;
  if v_phone !~ '^\\+?[0-9]{10,15}$' then
    raise exception 'اكتب رقم هاتف صحيحًا من 10 إلى 15 رقمًا.';
  end if;
  if lower(coalesce(new.email,'')) <> v_username || '@fergllo.local' then
    raise exception 'بيانات اسم المستخدم غير متطابقة. حاول مرة أخرى.';
  end if;
  if exists(select 1 from public.client_accounts where lower(username)=v_username or lower(email)=lower(new.email)) then
    raise exception 'اسم المستخدم مستخدم بالفعل. اختار اسم مستخدم مختلف.';
  end if;

  v_client_id := 'client-' || replace(gen_random_uuid()::text,'-','');

  insert into public.client_accounts(id,name,project,email,username,phone,status,created_at)
  values(v_client_id,v_name,v_name,lower(new.email),v_username,v_phone,'نشط',now());

  insert into public.user_profiles(user_id,full_name,role,client_id)
  values(new.id,v_name,'client',v_client_id)
  on conflict(user_id) do update
    set full_name=excluded.full_name, role='client', client_id=excluded.client_id;

  return new;
end;
$$;

drop trigger if exists on_customer_auth_created on auth.users;
create trigger on_customer_auth_created
  after insert on auth.users
  for each row execute procedure public.handle_customer_signup();

commit;
