begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'student-a@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'student-b@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb);

insert into public.student_profiles (user_id, first_name, nationality, current_country)
values
  ('10000000-0000-0000-0000-000000000001', 'Student A', 'Pakistan', 'Pakistan'),
  ('20000000-0000-0000-0000-000000000002', 'Student B', 'India', 'India');

insert into public.assessments (user_id, status, answers, completion_percent)
values
  ('10000000-0000-0000-0000-000000000001', 'completed', '{"owner":"a"}', 100),
  ('20000000-0000-0000-0000-000000000002', 'completed', '{"owner":"b"}', 100);

insert into public.tasks (user_id, title)
values
  ('10000000-0000-0000-0000-000000000001', 'A private task'),
  ('20000000-0000-0000-0000-000000000002', 'B private task');

insert into public.documents (user_id, name, category, storage_path, mime_type, size_bytes)
values
  ('10000000-0000-0000-0000-000000000001', 'a.pdf', 'Academic', '10000000-0000-0000-0000-000000000001/a.pdf', 'application/pdf', 100),
  ('20000000-0000-0000-0000-000000000002', 'b.pdf', 'Academic', '20000000-0000-0000-0000-000000000002/b.pdf', 'application/pdf', 100);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is((select count(*) from public.student_profiles), 1::bigint, 'student sees exactly one profile');
select is((select first_name from public.student_profiles), 'Student A', 'student sees only their own profile');
select is((select count(*) from public.assessments), 1::bigint, 'student sees only their own assessment');
select is((select count(*) from public.tasks), 1::bigint, 'student sees only their own task');
select is((select count(*) from public.documents), 1::bigint, 'student sees only their own document');

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select ok((select count(*) from public.programmes) >= 2, 'anonymous catalogue exposes published programmes');
select is((select count(*) from public.programmes where state = 'stale'), 0::bigint, 'anonymous catalogue hides stale programmes');

select * from finish();
rollback;
