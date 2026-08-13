-- Internal rule generation is invoked by trusted publication code only.
-- PostgreSQL grants function execution to PUBLIC by default, so revoke it explicitly.
revoke all on function public.generate_rules_for_published_entity(text, uuid, jsonb) from public;
revoke all on function public.generate_rules_for_published_entity(text, uuid, jsonb) from anon;
revoke all on function public.generate_rules_for_published_entity(text, uuid, jsonb) from authenticated;
grant execute on function public.generate_rules_for_published_entity(text, uuid, jsonb) to service_role;
