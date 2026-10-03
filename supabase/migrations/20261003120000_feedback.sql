-- FR-008: in-app feedback for testers.
-- Anyone (logged in or not) can send feedback; only admins (has_role 'admin')
-- read everything, logged-in testers read their own. Screenshots go to a
-- private bucket with the same image rules as tribely-media (QA-021).

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  -- random id kept in the browser's localStorage, for the rate limit of
  -- logged-out testers and to group reports from one device
  device_id text not null check (char_length(device_id) between 8 and 64),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  page text check (char_length(page) <= 500),
  app_version text check (char_length(app_version) <= 64),
  user_agent text check (char_length(user_agent) <= 500),
  screenshot_path text check (char_length(screenshot_path) <= 300),
  status text not null default 'new' check (status in ('new', 'seen', 'done'))
);

create index feedback_created_at_idx on public.feedback (created_at desc);
create index feedback_device_idx on public.feedback (device_id, created_at);
create index feedback_user_idx on public.feedback (user_id, created_at);

alter table public.feedback enable row level security;

-- Send: logged-out testers must leave user_id empty, logged-in ones may only
-- use their own id. New rows always start as 'new'.
create policy "Anyone can send feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (user_id is not distinct from auth.uid() and status = 'new');

create policy "Testers read their own feedback"
  on public.feedback for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins read all feedback"
  on public.feedback for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update feedback"
  on public.feedback for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete feedback"
  on public.feedback for delete
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Only the columns the app sends may be written by clients.
revoke insert, update on public.feedback from anon, authenticated;
grant insert (user_id, device_id, message, page, app_version, user_agent, screenshot_path)
  on public.feedback to anon, authenticated;
grant update (status) on public.feedback to authenticated;

-- Rate limit: max 10 per hour per user (or per device when logged out),
-- plus a global safety cap against floods.
create or replace function public.enforce_feedback_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  select count(*) into recent
    from public.feedback f
   where f.created_at > now() - interval '1 hour'
     and (
       (new.user_id is not null and f.user_id = new.user_id)
       or f.device_id = new.device_id
     );
  if recent >= 10 then
    raise exception 'Too much feedback in a short time - please try again in an hour'
      using errcode = 'P0001';
  end if;

  select count(*) into recent
    from public.feedback f
   where f.created_at > now() - interval '1 hour';
  if recent >= 300 then
    raise exception 'Feedback is paused for a moment - please try again later'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_feedback_rate_limit() from public, anon, authenticated;

create trigger feedback_rate_limit
  before insert on public.feedback
  for each row execute function public.enforce_feedback_rate_limit();

-- Screenshots: private bucket, images only, max 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feedback-screenshots', 'feedback-screenshots', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Logged-in testers upload into <auth.uid()>/…, logged-out ones into anon/…
create policy "Testers upload feedback screenshots"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'feedback-screenshots'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Visitors upload feedback screenshots"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'feedback-screenshots'
    and (storage.foldername(name))[1] = 'anon'
  );

create policy "Admins read feedback screenshots"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'feedback-screenshots' and public.has_role(auth.uid(), 'admin'));

create policy "Admins delete feedback screenshots"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'feedback-screenshots' and public.has_role(auth.uid(), 'admin'));
