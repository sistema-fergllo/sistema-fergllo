-- Faragello: normalize branch PINs at creation and verification.
-- Run in the SAME Supabase project used by the app: flrtvxxtlbpjhydtlrwd.
create or replace function public.create_client_branch(p_client_id uuid,p_name text,p_pin text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $branch_fn$
declare v_branch public.client_branches;
begin
 if not exists(select 1 from public.user_profiles p where p.user_id=auth.uid() and p.role='admin') then
   raise exception 'غير مسموح إلا للمشرف بإضافة الفروع';
 end if;
 if p_name is null or length(trim(p_name))=0 then raise exception 'اسم الفرع مطلوب'; end if;
 if p_pin is null or length(trim(p_pin))<6 then raise exception 'الرقم السري يجب أن يكون 6 أحرف على الأقل'; end if;
 insert into public.client_branches(client_id,name) values(p_client_id,trim(p_name)) returning * into v_branch;
 insert into public.client_branch_secrets(branch_id,pin_hash)
 values(v_branch.id,extensions.crypt(trim(p_pin),extensions.gen_salt('bf')));
 insert into public.client_branch_inventory(branch_id,client_id,code,name,price,qty,sold,updated_at)
 select v_branch.id,ci.client_id,ci.code,ci.name,ci.price,ci.qty,ci.sold,now()
 from public.client_inventory ci where ci.client_id=p_client_id
 on conflict(branch_id,code) do nothing;
 return jsonb_build_object('id',v_branch.id,'client_id',v_branch.client_id,'name',v_branch.name,'status',v_branch.status,'created_at',v_branch.created_at);
end $branch_fn$;
revoke all on function public.create_client_branch(uuid,text,text) from public;
grant execute on function public.create_client_branch(uuid,text,text) to authenticated;

create or replace function public.verify_client_branch(p_branch_id uuid,p_pin text)
returns boolean
language plpgsql
security definer
set search_path=public,extensions
as $branch_fn$
declare v_client_id uuid; v_hash text; v_profile_client uuid;
begin
 select p.client_id into v_profile_client
 from public.user_profiles p
 where p.user_id=auth.uid() and p.role='client'
 limit 1;
 if v_profile_client is null then return false; end if;

 select b.client_id,s.pin_hash into v_client_id,v_hash
 from public.client_branches b
 join public.client_branch_secrets s on s.branch_id=b.id
 where b.id=p_branch_id and b.status='نشط' and b.client_id=v_profile_client
 limit 1;

 if v_client_id is null or v_hash is null then return false; end if;
 if extensions.crypt(trim(coalesce(p_pin,'')),v_hash) is distinct from v_hash then return false; end if;

 update public.user_profiles set branch_id=p_branch_id
 where user_id=auth.uid() and role='client' and client_id=v_client_id;
 return found;
end $branch_fn$;
revoke all on function public.verify_client_branch(uuid,text) from public;
grant execute on function public.verify_client_branch(uuid,text) to authenticated;
