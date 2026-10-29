-- إصلاح مباشر لخطأ column client_branches.pin_hash does not exist
alter table public.client_branches
  add column if not exists pin_hash text;
