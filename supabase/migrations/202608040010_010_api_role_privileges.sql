-- PostgREST roles need table privileges before row-level policies are evaluated.
-- RLS remains the authorization boundary for every exposed table.

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all privileges on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to authenticated;
grant all privileges on all sequences in schema public to service_role;

grant execute on all functions in schema public to authenticated, service_role;

-- Keep future migrations usable through the API without bypassing RLS.
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant execute on functions to authenticated, service_role;
