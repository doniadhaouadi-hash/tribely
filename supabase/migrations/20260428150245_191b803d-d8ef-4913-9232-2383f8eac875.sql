-- handle_new_user runs only as a trigger from auth.users; revoke API access.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- set_updated_at runs only as a trigger; revoke API access.
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- has_role is intended for RLS; only authenticated users need to evaluate it via policies.
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
-- keep authenticated EXECUTE so RLS policies referencing it work for signed-in users