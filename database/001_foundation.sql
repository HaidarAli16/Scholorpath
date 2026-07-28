-- ScholarPath foundation schema for Supabase/Postgres.
-- Apply through a reviewed migration after the Supabase project is connected.

create extension if not exists "pgcrypto";

create type public.profile_country as enum ('Pakistan', 'India', 'Bangladesh');
create type public.assessment_status as enum ('draft', 'completed', 'archived');
create type public.source_status as enum ('unverified', 'verified', 'stale', 'disputed', 'archived');

create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  nationality public.profile_country not null,
  current_country text not null,
  timezone text,
  preferred_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  status public.assessment_status not null default 'draft',
  answers jsonb not null default '{}'::jsonb,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.pathway_reports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  engine_version text not null,
  rule_snapshot_version text not null,
  report jsonb not null,
  generated_at timestamptz not null default now()
);

create table public.source_records (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null unique,
  source_type text not null,
  owner_name text not null,
  country_code text,
  status public.source_status not null default 'unverified',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  content_hash text,
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.pathway_reports enable row level security;
alter table public.source_records enable row level security;

create policy "students own their profile"
on public.student_profiles for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "students own their assessments"
on public.assessments for all
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "students read their reports"
on public.pathway_reports for select
using ((select auth.uid()) = user_id);

create policy "verified sources are publicly readable"
on public.source_records for select
using (status = 'verified');

create index assessments_user_updated_idx
on public.assessments (user_id, updated_at desc);

create index pathway_reports_user_generated_idx
on public.pathway_reports (user_id, generated_at desc);

create index source_records_review_idx
on public.source_records (status, next_review_at);

