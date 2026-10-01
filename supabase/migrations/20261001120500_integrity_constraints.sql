-- QA-020: no CHECK constraints on activity numbers, and favorites /
-- chat_messages had no foreign keys, so deleting an activity (or user)
-- left orphan rows behind.

-- 1. Remove rows that already point to deleted activities/users,
--    otherwise the foreign keys below can't be created.
delete from public.favorites f
 where not exists (select 1 from public.activities a where a.id = f.activity_id)
    or not exists (select 1 from auth.users u where u.id = f.user_id);

delete from public.chat_messages m
 where not exists (select 1 from public.activities a where a.id = m.activity_id)
    or not exists (select 1 from auth.users u where u.id = m.user_id);

-- 2. Foreign keys with cascade.
alter table public.favorites
  add constraint favorites_activity_id_fkey
    foreign key (activity_id) references public.activities(id) on delete cascade,
  add constraint favorites_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.chat_messages
  add constraint chat_messages_activity_id_fkey
    foreign key (activity_id) references public.activities(id) on delete cascade,
  add constraint chat_messages_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- 3. Sanity checks on activity numbers. Added NOT VALID so the migration
--    never fails on legacy rows; new and updated rows are always checked.
alter table public.activities
  add constraint activities_max_participants_check
    check (max_participants between 1 and 1000) not valid,
  add constraint activities_duration_min_check
    check (duration_min between 1 and 1440) not valid,
  add constraint activities_price_cents_check
    check (price_cents >= 0) not valid,
  add constraint activities_participant_count_check
    check (participant_count >= 0) not valid;

-- Validate existing rows where possible (just a notice if legacy data is off).
do $$
declare
  c text;
begin
  foreach c in array array[
    'activities_max_participants_check',
    'activities_duration_min_check',
    'activities_price_cents_check',
    'activities_participant_count_check'
  ] loop
    begin
      execute format('alter table public.activities validate constraint %I', c);
    exception when check_violation then
      raise notice 'Existing rows violate %, left NOT VALID', c;
    end;
  end loop;
end;
$$;
