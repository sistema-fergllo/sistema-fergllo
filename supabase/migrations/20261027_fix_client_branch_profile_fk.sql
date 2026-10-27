-- Faragello: repair client branch profile foreign key.
-- Run this AFTER 20261027_multi_branch.sql in Supabase SQL Editor.
-- The previous branch selector stores client_branches.id in user_profiles.branch_id,
-- so this FK must point to client_branches, not an older branch table.
alter table public.user_profiles
  drop constraint if exists user_profiles_branch_id_fkey;

alter table public.user_profiles
  add constraint user_profiles_branch_id_fkey
  foreign key (branch_id)
  references public.client_branches(id)
  on delete set null
  not valid;

-- NOT VALID preserves any legacy profile values already present, while enforcing
-- the correct target for new branch selections going forward.
