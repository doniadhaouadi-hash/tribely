-- QA-004: the "Users can update their own profile" policy allowed every
-- column, so users could set their own rating, streak_count and hosted_count.
-- Restrict writes to the user-editable columns; reputation fields are only
-- changed server-side (security definer functions / service role).

revoke update on public.profiles from authenticated, anon;
grant update (
  display_name, username, avatar_url, bio, sports, level, city, lat, lng, onboarded
) on public.profiles to authenticated;

-- Same for inserts (profiles are normally created by handle_new_user()).
revoke insert on public.profiles from authenticated, anon;
grant insert (
  id, display_name, username, avatar_url, bio, sports, level, city, lat, lng, onboarded
) on public.profiles to authenticated;
