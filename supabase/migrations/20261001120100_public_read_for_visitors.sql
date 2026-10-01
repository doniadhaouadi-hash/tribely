-- QA-006: logged-out visitors (anon role) got 0 rows for activities, profiles
-- and participants, so the feed was empty and shared ?activity= links opened
-- nothing. Let visitors browse; joining/chatting still requires login.

create policy "Activities are viewable by visitors"
  on public.activities for select to anon
  using (true);

create policy "Participants are viewable by visitors"
  on public.activity_participants for select to anon
  using (true);

-- Visitors only get the public card fields of a profile (no home location,
-- bio, sports, etc.). Column grants restrict what the policy exposes.
revoke select on public.profiles from anon;
grant select (id, display_name, avatar_url, rating) on public.profiles to anon;

create policy "Public profile fields are viewable by visitors"
  on public.profiles for select to anon
  using (true);
