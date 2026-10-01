-- QA-005: capacity was only checked in the browser (with stale data), so two
-- simultaneous joins or a direct API call could overbook an activity.
-- This trigger locks the activity row, so concurrent joins are serialized,
-- and rejects joins to full, cancelled, completed or already started activities.

create or replace function public.enforce_activity_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  act record;
  going_count integer;
begin
  if new.status <> 'going' then
    return new;
  end if;

  -- Re-saving an existing "going" RSVP (e.g. upsert) doesn't take a new spot.
  if tg_op = 'UPDATE' and old.status = 'going' and old.activity_id = new.activity_id then
    return new;
  end if;

  select id, max_participants, status, start_at
    into act
    from public.activities
   where id = new.activity_id
   for update;

  if not found then
    raise exception 'Activity not found' using errcode = 'P0002';
  end if;

  if act.status in ('cancelled', 'completed') then
    raise exception 'This activity is no longer open' using errcode = 'P0001';
  end if;

  if act.start_at < now() then
    raise exception 'This activity has already started' using errcode = 'P0001';
  end if;

  select count(*) into going_count
    from public.activity_participants p
   where p.activity_id = new.activity_id
     and p.status = 'going'
     and p.user_id <> new.user_id;

  if going_count >= act.max_participants then
    raise exception 'This activity is full' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_activity_capacity() from public, anon, authenticated;

create trigger activity_participants_enforce_capacity
  before insert or update on public.activity_participants
  for each row execute function public.enforce_activity_capacity();
