-- QA-002: chat_messages SELECT/INSERT policies call is_activity_member(), and
-- policy functions run as the calling role. Migration 20260428151823 revoked
-- EXECUTE from authenticated, so every chat read/post failed with
-- "permission denied for function is_activity_member". Same pattern as has_role.
grant execute on function public.is_activity_member(uuid, uuid) to authenticated;
