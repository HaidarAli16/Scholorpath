-- ScholarPath complete beta product schema for Supabase/Postgres.
-- Apply after 001_foundation.sql through the Supabase migration workflow.

create type public.app_role as enum ('student', 'research_operator', 'research_reviewer', 'support', 'admin');
create type public.record_state as enum ('draft', 'in_review', 'published', 'stale', 'conflict', 'archived');
create type public.match_state as enum ('confirmed', 'conditional', 'failed', 'unknown', 'stale');
create type public.task_state as enum ('todo', 'in_progress', 'blocked', 'waiting', 'ready_for_review', 'completed', 'cancelled', 'not_applicable');
create type public.application_state as enum ('considering', 'preparing', 'ready', 'submitted', 'decision', 'withdrawn', 'archived');

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('research_operator', 'research_reviewer', 'support', 'admin')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_records(id) on delete cascade,
  captured_by uuid references auth.users(id),
  captured_at timestamptz not null default now(),
  effective_cycle text,
  content_hash text not null,
  storage_path text,
  extracted_text text,
  metadata jsonb not null default '{}'::jsonb,
  unique (source_id, content_hash)
);

create table public.fact_records (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_records(id),
  snapshot_id uuid references public.source_snapshots(id),
  entity_type text not null check (entity_type in ('programme', 'scholarship', 'institution', 'country', 'visa')),
  entity_key text not null,
  field_key text not null,
  value jsonb not null,
  normalized_value jsonb,
  state public.record_state not null default 'draft',
  effective_from date,
  effective_to date,
  confidence smallint not null default 50 check (confidence between 0 and 100),
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_key, field_key, version)
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  institution_name text not null,
  title text not null,
  country_code text not null,
  level text not null,
  field_family text not null,
  intake_label text,
  deadline_at timestamptz,
  deadline_timezone text,
  tuition_amount numeric(14,2),
  tuition_currency text,
  application_url text,
  state public.record_state not null default 'draft',
  source_id uuid references public.source_records(id),
  last_verified_at timestamptz,
  next_review_at timestamptz,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scholarships (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  provider_name text not null,
  title text not null,
  country_code text,
  cycle_label text,
  opens_at timestamptz,
  deadline_at timestamptz,
  deadline_timezone text,
  award_type text,
  award_value jsonb not null default '{}'::jsonb,
  application_url text,
  state public.record_state not null default 'draft',
  source_id uuid references public.source_records(id),
  last_verified_at timestamptz,
  next_review_at timestamptz,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.atomic_rules (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('programme', 'scholarship')),
  entity_id uuid not null,
  rule_key text not null,
  rule_group text not null,
  operator text not null check (operator in ('eq', 'neq', 'in', 'not_in', 'gte', 'lte', 'contains_any', 'contains_all', 'exists')),
  profile_field text not null,
  expected_value jsonb not null,
  severity text not null check (severity in ('hard', 'soft', 'information')),
  explanation text not null,
  source_fact_id uuid references public.fact_records(id),
  state public.record_state not null default 'draft',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, rule_key, version)
);

create table public.match_evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  entity_type text not null check (entity_type in ('programme', 'scholarship')),
  entity_id uuid not null,
  state public.match_state not null,
  score numeric(5,2) check (score between 0 and 100),
  reason_codes jsonb not null default '[]'::jsonb,
  open_checks jsonb not null default '[]'::jsonb,
  rule_versions jsonb not null default '[]'::jsonb,
  engine_version text not null,
  evaluated_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id, engine_version)
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My portfolio',
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('programme', 'scholarship')),
  entity_id uuid not null,
  notes text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (portfolio_id, entity_type, entity_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid references public.programmes(id),
  scholarship_id uuid references public.scholarships(id),
  title text not null,
  provider_name text not null,
  state public.application_state not null default 'considering',
  deadline_at timestamptz,
  official_portal_url text,
  external_reference text,
  submitted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(programme_id, scholarship_id) <= 1)
);

create table public.application_requirements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  requirement_type text not null,
  state text not null default 'missing' check (state in ('confirmed', 'missing', 'needs_review', 'blocked', 'waived')),
  blocking boolean not null default false,
  due_at timestamptz,
  source_fact_id uuid references public.fact_records(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  requirement_id uuid references public.application_requirements(id) on delete set null,
  title text not null,
  description text,
  state public.task_state not null default 'todo',
  priority smallint not null default 2 check (priority between 1 and 4),
  due_at timestamptz,
  estimated_minutes integer check (estimated_minutes > 0),
  system_generated boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  status text not null default 'uploaded' check (status in ('uploading', 'uploaded', 'needs_review', 'accepted', 'rejected', 'deleted')),
  version integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_links (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  requirement_id uuid references public.application_requirements(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'linked' check (state in ('linked', 'submitted', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (document_id, application_id, requirement_id)
);

create table public.writing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  prompt text,
  word_limit integer,
  outline jsonb not null default '[]'::jsonb,
  draft text not null default '',
  evidence_links jsonb not null default '[]'::jsonb,
  state text not null default 'prompt' check (state in ('prompt', 'outline', 'draft', 'review', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recommenders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  name text not null,
  email text not null,
  status text not null default 'invited' check (status in ('draft', 'invited', 'opened', 'submitted', 'expired', 'declined')),
  access_token_hash text,
  token_expires_at timestamptz,
  invited_at timestamptz,
  submitted_at timestamptz,
  confidential_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funding_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  currency text not null,
  costs jsonb not null default '{}'::jsonb,
  confirmed_funding jsonb not null default '{}'::jsonb,
  conditional_funding jsonb not null default '{}'::jsonb,
  exchange_rates jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  offer_type text not null check (offer_type in ('conditional', 'unconditional', 'waitlist', 'rejected')),
  issued_at date,
  response_due_at timestamptz,
  deposit_due_at timestamptz,
  deposit_amount numeric(14,2),
  deposit_currency text,
  conditions jsonb not null default '[]'::jsonb,
  status text not null default 'received' check (status in ('received', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  action_url text,
  event_key text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'critical')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.correction_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  field_key text,
  description text not null,
  evidence_url text,
  status text not null default 'open' check (status in ('open', 'triaged', 'researching', 'resolved', 'rejected')),
  assigned_to uuid references auth.users(id),
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  reason text,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- Update timestamps on mutable records.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'student_profiles','assessments','source_records','fact_records','programmes','scholarships',
    'atomic_rules','portfolios','applications','application_requirements','tasks','documents',
    'writing_items','recommenders','funding_scenarios','offers','correction_tickets'
  ] loop
    execute format('create trigger %I_touch_updated before update on public.%I for each row execute function public.touch_updated_at()', table_name, table_name);
  end loop;
end $$;

-- Public catalogue visibility; only staff can mutate research records.
alter table public.user_roles enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.fact_records enable row level security;
alter table public.programmes enable row level security;
alter table public.scholarships enable row level security;
alter table public.atomic_rules enable row level security;
alter table public.match_evaluations enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.applications enable row level security;
alter table public.application_requirements enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.document_links enable row level security;
alter table public.writing_items enable row level security;
alter table public.recommenders enable row level security;
alter table public.funding_scenarios enable row level security;
alter table public.offers enable row level security;
alter table public.notifications enable row level security;
alter table public.correction_tickets enable row level security;
alter table public.audit_events enable row level security;

create policy "users read own roles" on public.user_roles for select using (user_id = (select auth.uid()) or public.has_role('admin'));
create policy "admins manage roles" on public.user_roles for all using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "published programmes readable" on public.programmes for select using (state = 'published' or public.is_staff());
create policy "published scholarships readable" on public.scholarships for select using (state = 'published' or public.is_staff());
create policy "published rules readable" on public.atomic_rules for select using (state = 'published' or public.is_staff());
create policy "staff manage programmes" on public.programmes for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage scholarships" on public.scholarships for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage rules" on public.atomic_rules for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage snapshots" on public.source_snapshots for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage facts" on public.fact_records for all using (public.is_staff()) with check (public.is_staff());

-- User-owned tables follow a uniform ownership policy.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'match_evaluations','portfolios','portfolio_items','applications','application_requirements','tasks',
    'documents','document_links','writing_items','recommenders','funding_scenarios','offers','notifications'
  ] loop
    execute format('create policy "owners manage %1$s" on public.%1$I for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', table_name);
  end loop;
end $$;

create policy "users create correction tickets" on public.correction_tickets for insert with check (user_id = (select auth.uid()));
create policy "users read own correction tickets" on public.correction_tickets for select using (user_id = (select auth.uid()) or public.is_staff());
create policy "staff update correction tickets" on public.correction_tickets for update using (public.is_staff()) with check (public.is_staff());
create policy "staff read audit" on public.audit_events for select using (public.is_staff());
create policy "authenticated append audit" on public.audit_events for insert with check (actor_user_id = (select auth.uid()) or public.is_staff());

create index fact_records_lookup_idx on public.fact_records (entity_type, entity_key, field_key, state);
create index programmes_catalogue_idx on public.programmes (state, country_code, field_family, deadline_at);
create index scholarships_catalogue_idx on public.scholarships (state, country_code, deadline_at);
create index atomic_rules_entity_idx on public.atomic_rules (entity_type, entity_id, state);
create index match_evaluations_user_idx on public.match_evaluations (user_id, evaluated_at desc);
create index tasks_user_due_idx on public.tasks (user_id, state, due_at);
create index applications_user_idx on public.applications (user_id, state, deadline_at);
create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);
create index correction_tickets_queue_idx on public.correction_tickets (status, created_at);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, created_at desc);

-- Private student files. The first path segment is always auth.uid().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-documents', 'student-documents', false, 15728640, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "students read own document objects" on storage.objects for select
using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "students upload own document objects" on storage.objects for insert
with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "students update own document objects" on storage.objects for update
using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "students delete own document objects" on storage.objects for delete
using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- Policies added after the core declarations.
create policy "published facts readable" on public.fact_records for select using (state = 'published' or public.is_staff());
create policy "staff manage source records" on public.source_records for all using (public.is_staff()) with check (public.is_staff());
create policy "students insert own reports" on public.pathway_reports for insert with check (user_id = (select auth.uid()));

-- Confidential recommendation content is written only through a token-validated
-- server route using the service role. Students can see delivery state but never
-- receive a storage select policy for this bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('confidential-references', 'confidential-references', false, 15728640, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
