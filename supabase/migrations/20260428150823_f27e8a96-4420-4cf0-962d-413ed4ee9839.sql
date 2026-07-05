-- Enums
create type public.activity_category as enum (
  'running','football','gym','yoga','cycling','walking',
  'tennis','basketball','swimming','climbing','dance','other'
);
create type public.activity_status as enum ('open','full','cancelled','completed');
create type public.participant_status as enum ('going','waitlist','cancelled');

-- Activities
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category public.activity_category not null,
  level_required public.user_level not null default 'beginner',
  location_name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  start_at timestamptz not null,
  duration_min integer not null default 60,
  max_participants integer not null default 10,
  participant_count integer not null default 0,
  price_cents integer not null default 0,
  currency text not null default 'EUR',
  language text not null default 'en',
  spontaneous boolean not null default false,
  status public.activity_status not null default 'open',
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index activities_start_at_idx on public.activities (start_at);
create index activities_category_idx on public.activities (category);
create index activities_host_idx on public.activities (host_id);

alter table public.activities enable row level security;

create policy "Activities are viewable by authenticated users"
  on public.activities for select to authenticated using (true);

create policy "Hosts can create activities"
  on public.activities for insert to authenticated
  with check (auth.uid() = host_id);

create policy "Hosts can update their own activities"
  on public.activities for update to authenticated
  using (auth.uid() = host_id);

create policy "Hosts can delete their own activities"
  on public.activities for delete to authenticated
  using (auth.uid() = host_id);

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- Participants
create table public.activity_participants (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.participant_status not null default 'going',
  joined_at timestamptz not null default now(),
  unique (activity_id, user_id)
);

create index activity_participants_user_idx on public.activity_participants (user_id);
create index activity_participants_activity_idx on public.activity_participants (activity_id);

alter table public.activity_participants enable row level security;

create policy "Participants visible to authenticated"
  on public.activity_participants for select to authenticated using (true);

create policy "Users can join activities"
  on public.activity_participants for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own RSVP"
  on public.activity_participants for update to authenticated
  using (auth.uid() = user_id);

create policy "Users can leave activities"
  on public.activity_participants for delete to authenticated
  using (auth.uid() = user_id);

-- Auto-update participant_count on the activity
create or replace function public.update_activity_participant_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.activity_id, old.activity_id);
  update public.activities a
    set participant_count = (
      select count(*) from public.activity_participants p
      where p.activity_id = target and p.status = 'going'
    )
  where a.id = target;
  return null;
end;
$$;

revoke execute on function public.update_activity_participant_count() from public, anon, authenticated;

create trigger activity_participants_count_ins
  after insert on public.activity_participants
  for each row execute function public.update_activity_participant_count();

create trigger activity_participants_count_upd
  after update on public.activity_participants
  for each row execute function public.update_activity_participant_count();

create trigger activity_participants_count_del
  after delete on public.activity_participants
  for each row execute function public.update_activity_participant_count();