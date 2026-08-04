-- Keep internal role helpers out of the anonymous RPC surface.
-- Authenticated execution is required by RLS policies that call these helpers.

revoke all on function public.has_role(public.app_role) from public, anon;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_staff() to authenticated;

