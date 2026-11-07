-- سيستم حلاوة: إضافة مجموعة الصنف ووحدة القياس للمخزون
-- شغّل هذا الملف مرة واحدة من Supabase SQL Editor.
alter table if exists public.shared_inventory
  add column if not exists group_name text not null default 'عام',
  add column if not exists unit text not null default 'قطعة';

alter table if exists public.client_inventory
  add column if not exists group_name text not null default 'عام',
  add column if not exists unit text not null default 'قطعة';

update public.shared_inventory set group_name='عام' where group_name is null or btrim(group_name)='';
update public.shared_inventory set unit='قطعة' where unit is null or unit not in ('قطعة','كيلو');

update public.client_inventory set group_name='عام' where group_name is null or btrim(group_name)='';
update public.client_inventory set unit='قطعة' where unit is null or unit not in ('قطعة','كيلو');
