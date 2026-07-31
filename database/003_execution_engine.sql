-- ScholarPath execution engine: tasks, dependencies, evidence, impact and readiness.
-- Run after 002_complete_product.sql in the Supabase SQL editor.

alter type public.task_state add value if not exists 'ready_for_review';
alter type public.task_state add value if not exists 'not_applicable';

alter table public.tasks
  add column if not exists impact_type text not null default 'application_readiness'
    check (impact_type in ('eligibility','application_readiness','scholarship','funding','deadline','document','offer','visa','profile','research')),
  add column if not exists impact_level text not null default 'medium'
    check (impact_level in ('critical','high','medium','low')),
  add column if not exists impact_score smallint not null default 50 check (impact_score between 0 and 100),
  add column if not exists source_type text not null default 'personal'
    check (source_type in ('profile_gap','requirement','deadline','document','offer','personal','system')),
  add column if not exists source_id uuid,
  add column if not exists dedupe_key text,
  add column if not exists due_timezone text not null default 'Asia/Karachi',
  add column if not exists due_source text,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null,
  add column if not exists assigned_name text,
  add column if not exists assigned_email text,
  add column if not exists evidence_required jsonb not null default '[]'::jsonb,
  add column if not exists completion_evidence_document_id uuid references public.documents(id) on delete set null,
  add column if not exists completion_note text,
  add column if not exists position numeric(12,4) not null default 1000,
  add column if not exists reminder_config jsonb not null default '{}'::jsonb,
  add column if not exists dismissed_reason text,
  add column if not exists reopened_count integer not null default 0,
  add column if not exists last_recalculated_at timestamptz;

create unique index if not exists tasks_active_dedupe_idx
  on public.tasks(user_id, dedupe_key)
  where dedupe_key is not null and state not in ('cancelled','not_applicable');
create index if not exists tasks_execution_order_idx on public.tasks(user_id, state, impact_score desc, due_at, position);

create table if not exists public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  relation text not null default 'blocks' check (relation in ('blocks','enables')),
  created_at timestamptz not null default now(),
  unique(task_id, depends_on_task_id),
  check(task_id <> depends_on_task_id)
);

create table if not exists public.task_impacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  entity_type text not null check (entity_type in ('programme','scholarship','application','profile','funding','offer')),
  entity_id uuid,
  impact_label text not null,
  readiness_delta numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(task_id, application_id, entity_type, entity_id)
);

create table if not exists public.task_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_state public.task_state,
  to_state public.task_state,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.task_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app','email')),
  preset text not null check (preset in ('at_time','one_day','three_days','one_week','custom')),
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  unique(task_id, channel, scheduled_for)
);

create table if not exists public.application_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  confirmed_count integer not null default 0,
  total_count integer not null default 0,
  blocking_count integer not null default 0,
  missing_count integer not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);
create index if not exists readiness_latest_idx on public.application_readiness_snapshots(user_id, application_id, generated_at desc);

alter table public.task_dependencies enable row level security;
alter table public.task_impacts enable row level security;
alter table public.task_events enable row level security;
alter table public.task_reminders enable row level security;
alter table public.application_readiness_snapshots enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['task_dependencies','task_impacts','task_events','task_reminders','application_readiness_snapshots'] loop
    execute format('drop policy if exists owner_all on public.%I', table_name);
    execute format('create policy owner_all on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name);
  end loop;
end $$;
