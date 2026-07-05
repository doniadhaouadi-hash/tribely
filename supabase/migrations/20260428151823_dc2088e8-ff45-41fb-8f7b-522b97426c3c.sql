revoke execute on function public.is_activity_member(uuid, uuid) from anon, authenticated, public;
revoke execute on function public.update_activity_participant_count() from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;