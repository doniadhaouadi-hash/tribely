-- =========================
-- FAVORITES
-- =========================
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  activity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_id)
);

create index idx_favorites_user on public.favorites(user_id);
create index idx_favorites_activity on public.favorites(activity_id);

alter table public.favorites enable row level security;

create policy "Users view their own favorites"
  on public.favorites for select to authenticated
  using (auth.uid() = user_id);

create policy "Users add their own favorites"
  on public.favorites for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users remove their own favorites"
  on public.favorites for delete to authenticated
  using (auth.uid() = user_id);

-- =========================
-- CHAT MESSAGES
-- =========================
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  user_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index idx_chat_activity_created on public.chat_messages(activity_id, created_at);

alter table public.chat_messages enable row level security;

-- Helper: is the user a participant of this activity (going) OR the host
create or replace function public.is_activity_member(_activity_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.activities a where a.id = _activity_id and a.host_id = _user_id
  ) or exists (
    select 1 from public.activity_participants p
    where p.activity_id = _activity_id and p.user_id = _user_id and p.status = 'going'
  );
$$;

create policy "Members can read chat"
  on public.chat_messages for select to authenticated
  using (public.is_activity_member(activity_id, auth.uid()));

create policy "Members can post chat"
  on public.chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and public.is_activity_member(activity_id, auth.uid())
  );

create policy "Authors can delete own messages"
  on public.chat_messages for delete to authenticated
  using (auth.uid() = user_id);

create policy "Hosts can delete any message in their activity"
  on public.chat_messages for delete to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = chat_messages.activity_id and a.host_id = auth.uid()
    )
  );

-- =========================
-- REALTIME
-- =========================
alter table public.chat_messages replica identity full;
alter table public.favorites replica identity full;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.favorites;
alter publication supabase_realtime add table public.activity_participants;