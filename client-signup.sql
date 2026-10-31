-- Faragello: self-service customer account creation
begin;

alter table public.client_accounts add column if not exists username text;
alter table public.client_accounts add column if not exists phone text;

drop function if exists public.create_customer_account(text,text);
create unique index if not exists client_accounts_username_lower_uidx on public.client_accounts (lower(username)) where username is not null;

create or replace function public.create_customer_account(
  p_name text,
  p_username text,
  p_phone text
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
  v_phone text := regexp_replace(coalesce(p_phone,''), '[[:space:]()-]', '', 'g');
  v_id text := 'client-' || replace(gen_random_uuid()::text,'-','');
begin
  if v_name = '' then raise exception 'اكتب اسم العميل.'; end if;
  if v_phone !~ '^\\+?[0-9]{10,15}
    raise exception 'اسم المستخدم يجب أن يكون بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.';
  end if;
  v_email := v_username || '@fergllo.local';

  if exists (select 1 from public.client_accounts where lower(username)=v_username or lower(email)=v_email) then
    raise exception 'اسم المستخدم مستخدم بالفعل.';
  end if;

  insert into public.client_accounts(id,name,project,email,username,phone,status,created_at)
  values(v_id,v_name,v_name,v_email,v_username,v_phone,'نشط',now());

  return jsonb_build_object('id',v_id,'name',v_name,'username',v_username,'email',v_email,'phone',v_phone);
end;
$$;

revoke all on function public.create_customer_account(text,text,text) from public, authenticated;
grant execute on function public.create_customer_account(text,text,text) to anon;

commit;
 then
    raise exception 'اكتب رقم هاتف صحيحًا من 10 إلى 15 رقمًا.';
  end if;
  if v_username !~ '^[A-Za-z0-9._-]{3,40}
    raise exception 'اسم المستخدم يجب أن يكون بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.';
  end if;
  v_email := v_username || '@fergllo.local';

  if exists (select 1 from public.client_accounts where lower(username)=v_username or lower(email)=v_email) then
    raise exception 'اسم المستخدم مستخدم بالفعل.';
  end if;

  insert into public.client_accounts(id,name,project,email,username,status,created_at)
  values(v_id,v_name,v_name,v_email,v_username,'نشط',now());

  return jsonb_build_object('id',v_id,'name',v_name,'username',v_username,'email',v_email);
end;
$$;

revoke all on function public.create_customer_account(text,text) from public, authenticated;
grant execute on function public.create_customer_account(text,text) to anon;

commit;
 then
    raise exception 'اسم المستخدم يجب أن يكون بالإنجليزية والأرقام فقط، من 3 إلى 40 حرفًا.';
  end if;
  v_email := v_username || '@fergllo.local';

  if exists (select 1 from public.client_accounts where lower(username)=v_username or lower(email)=v_email) then
    raise exception 'اسم المستخدم مستخدم بالفعل.';
  end if;

  insert into public.client_accounts(id,name,project,email,username,status,created_at)
  values(v_id,v_name,v_name,v_email,v_username,'نشط',now());

  return jsonb_build_object('id',v_id,'name',v_name,'username',v_username,'email',v_email);
end;
$$;

revoke all on function public.create_customer_account(text,text) from public, authenticated;
grant execute on function public.create_customer_account(text,text) to anon;

commit;
