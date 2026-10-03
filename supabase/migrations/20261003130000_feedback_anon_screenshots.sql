-- QA-039: logged-out testers could upload any number of screenshots into
-- feedback-screenshots/anon/. Now a visitor can only attach ONE screenshot
-- to a feedback entry they just created (same rate limit as feedback):
--   1. insert feedback with a client-generated id (no screenshot yet)
--   2. upload to anon/<feedback id>/<file>  (allowed once, within 10 minutes)
--   3. call attach_feedback_screenshot(id, path) to link it

drop policy if exists "Visitors upload feedback screenshots" on storage.objects;

-- The app generates the feedback id so a visitor can refer to it later
-- (visitors can't read feedback back).
grant insert (id) on public.feedback to anon, authenticated;

-- Is this upload path for a fresh visitor feedback that has no screenshot yet?
create or replace function public.can_attach_feedback_screenshot(_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (storage.foldername(_name))[1] = 'anon'
    and exists (
      select 1 from public.feedback f
       where f.id::text = (storage.foldername(_name))[2]
         and f.user_id is null
         and f.screenshot_path is null
         and f.created_at > now() - interval '10 minutes'
    )
    and not exists (
      select 1 from storage.objects o
       where o.bucket_id = 'feedback-screenshots'
         and (storage.foldername(o.name))[1] = 'anon'
         and (storage.foldername(o.name))[2] = (storage.foldername(_name))[2]
    );
$$;

revoke execute on function public.can_attach_feedback_screenshot(text) from public, authenticated;
grant execute on function public.can_attach_feedback_screenshot(text) to anon;

create policy "Visitors attach one screenshot to their fresh feedback"
  on storage.objects for insert
  to anon
  with check (
    bucket_id = 'feedback-screenshots'
    and public.can_attach_feedback_screenshot(name)
  );

-- Links the uploaded file to the feedback (visitors have no UPDATE right).
create or replace function public.attach_feedback_screenshot(_feedback_id uuid, _path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (storage.foldername(_path))[1] is distinct from 'anon'
     or (storage.foldername(_path))[2] is distinct from _feedback_id::text then
    raise exception 'Invalid screenshot path' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from storage.objects o
     where o.bucket_id = 'feedback-screenshots' and o.name = _path
  ) then
    raise exception 'Screenshot not found' using errcode = 'P0001';
  end if;

  update public.feedback
     set screenshot_path = _path
   where id = _feedback_id
     and user_id is null
     and screenshot_path is null
     and created_at > now() - interval '10 minutes';

  if not found then
    raise exception 'Feedback not found' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.attach_feedback_screenshot(uuid, text) from public, authenticated;
grant execute on function public.attach_feedback_screenshot(uuid, text) to anon;
