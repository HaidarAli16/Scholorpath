-- ScholarPath production backend hardening.
-- Apply after 003_execution_engine.sql. All student-facing commands use auth.uid()
-- and execute atomically so partial reports/tasks cannot be persisted.

create extension if not exists pg_trgm with schema extensions;

alter table public.assessments
  add column if not exists content_hash text,
  add column if not exists idempotency_key text,
  add column if not exists supersedes_id uuid references public.assessments(id) on delete set null;

create unique index if not exists assessments_user_idempotency_idx
  on public.assessments(user_id, idempotency_key) where idempotency_key is not null;

create table if not exists public.profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  snapshot jsonb not null,
  evidence_completeness smallint not null default 0 check (evidence_completeness between 0 and 100),
  content_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid references public.assessments(id) on delete set null,
  engine_version text not null,
  catalogue_version text not null,
  profile_hash text not null,
  profile_snapshot jsonb not null,
  weights jsonb not null default '{}'::jsonb,
  result_count integer not null default 0 check (result_count >= 0),
  generated_at timestamptz not null default now()
);

create table if not exists public.recommendation_components (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.recommendation_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('programme','scholarship')),
  entity_id uuid not null,
  state public.match_state not null,
  final_score numeric(5,2) not null check (final_score between 0 and 100),
  score_components jsonb not null default '{}'::jsonb,
  reasons jsonb not null default '[]'::jsonb,
  failed_gates jsonb not null default '[]'::jsonb,
  open_checks jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  rule_versions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_id, entity_type, entity_id)
);

create table if not exists public.consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  granted boolean not null,
  locale text,
  created_at timestamptz not null default now()
);

create table if not exists public.request_idempotency (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  idempotency_key text not null,
  request_hash text not null,
  response jsonb,
  status text not null default 'processing' check (status in ('processing','completed','failed')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, route, idempotency_key)
);

create table if not exists public.outbox_events (
  id bigint generated always as identity primary key,
  aggregate_type text not null,
  aggregate_id uuid,
  event_type text not null,
  user_id uuid references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  available_at timestamptz not null default now(),
  attempts smallint not null default 0,
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists public.api_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  source_id uuid references public.source_records(id),
  entity_type text not null check (entity_type in ('programme','scholarship','fact')),
  filename text not null,
  content_hash text not null,
  status text not null default 'validating' check (status in ('validating','needs_review','approved','importing','completed','failed','cancelled')),
  totals jsonb not null default '{}'::jsonb,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_type, content_hash)
);

create table if not exists public.import_rows (
  id bigint generated always as identity primary key,
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null,
  normalized_data jsonb,
  validation_errors jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','valid','invalid','imported','skipped')),
  entity_id uuid,
  unique(batch_id, row_number)
);

create index if not exists profile_snapshots_user_idx on public.profile_snapshots(user_id, created_at desc);
create index if not exists recommendation_runs_user_idx on public.recommendation_runs(user_id, generated_at desc);
create unique index if not exists recommendation_runs_replay_idx on public.recommendation_runs(user_id,assessment_id,engine_version,catalogue_version,profile_hash) nulls not distinct;
create index if not exists recommendation_components_user_idx on public.recommendation_components(user_id, state, final_score desc);
create index if not exists consent_events_user_idx on public.consent_events(user_id, consent_type, created_at desc);
create index if not exists outbox_pending_idx on public.outbox_events(available_at, id) where processed_at is null;
create index if not exists import_batches_queue_idx on public.import_batches(status, created_at);
create index if not exists programmes_title_trgm_idx on public.programmes using gin (title extensions.gin_trgm_ops);
create index if not exists programmes_institution_trgm_idx on public.programmes using gin (institution_name extensions.gin_trgm_ops);
create index if not exists scholarships_title_trgm_idx on public.scholarships using gin (title extensions.gin_trgm_ops);

-- Foreign-key indexes used by ownership checks, cascades and joins.
create index if not exists pathway_reports_assessment_fk_idx on public.pathway_reports(assessment_id);
create index if not exists source_snapshots_source_fk_idx on public.source_snapshots(source_id);
create index if not exists atomic_rules_fact_fk_idx on public.atomic_rules(source_fact_id);
create index if not exists portfolio_items_portfolio_fk_idx on public.portfolio_items(portfolio_id);
create index if not exists requirements_application_fk_idx on public.application_requirements(application_id);
create index if not exists document_links_document_fk_idx on public.document_links(document_id);
create index if not exists task_dependencies_dependency_fk_idx on public.task_dependencies(depends_on_task_id);
create index if not exists task_impacts_application_fk_idx on public.task_impacts(application_id);

-- Tenant ownership is enforced relationally, not only by API filters or RLS.
create unique index if not exists assessments_id_user_uniq on public.assessments(id,user_id);
create unique index if not exists portfolios_id_user_uniq on public.portfolios(id,user_id);
create unique index if not exists applications_id_user_uniq on public.applications(id,user_id);
create unique index if not exists requirements_id_user_uniq on public.application_requirements(id,user_id);
create unique index if not exists tasks_id_user_uniq on public.tasks(id,user_id);
create unique index if not exists documents_id_user_uniq on public.documents(id,user_id);

alter table public.pathway_reports add constraint pathway_reports_assessment_owner_fk foreign key(assessment_id,user_id) references public.assessments(id,user_id) on delete cascade;
alter table public.match_evaluations add constraint match_evaluations_assessment_owner_fk foreign key(assessment_id,user_id) references public.assessments(id,user_id) on delete set null (assessment_id);
alter table public.profile_snapshots add constraint profile_snapshots_assessment_owner_fk foreign key(assessment_id,user_id) references public.assessments(id,user_id) on delete cascade;
alter table public.recommendation_runs add constraint recommendation_runs_assessment_owner_fk foreign key(assessment_id,user_id) references public.assessments(id,user_id) on delete set null (assessment_id);
alter table public.portfolio_items add constraint portfolio_items_portfolio_owner_fk foreign key(portfolio_id,user_id) references public.portfolios(id,user_id) on delete cascade;
alter table public.application_requirements add constraint requirements_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.tasks add constraint tasks_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.document_links add constraint document_links_document_owner_fk foreign key(document_id,user_id) references public.documents(id,user_id) on delete cascade;
alter table public.document_links add constraint document_links_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.document_links add constraint document_links_requirement_owner_fk foreign key(requirement_id,user_id) references public.application_requirements(id,user_id) on delete set null (requirement_id);
alter table public.writing_items add constraint writing_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.recommenders add constraint recommenders_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.funding_scenarios add constraint funding_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.offers add constraint offers_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.task_dependencies add constraint task_dependencies_task_owner_fk foreign key(task_id,user_id) references public.tasks(id,user_id) on delete cascade;
alter table public.task_dependencies add constraint task_dependencies_blocker_owner_fk foreign key(depends_on_task_id,user_id) references public.tasks(id,user_id) on delete cascade;
alter table public.task_impacts add constraint task_impacts_task_owner_fk foreign key(task_id,user_id) references public.tasks(id,user_id) on delete cascade;
alter table public.task_impacts add constraint task_impacts_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;
alter table public.task_events add constraint task_events_task_owner_fk foreign key(task_id,user_id) references public.tasks(id,user_id) on delete cascade;
alter table public.task_reminders add constraint task_reminders_task_owner_fk foreign key(task_id,user_id) references public.tasks(id,user_id) on delete cascade;
alter table public.application_readiness_snapshots add constraint readiness_application_owner_fk foreign key(application_id,user_id) references public.applications(id,user_id) on delete cascade;

create or replace function public.can_research_write()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('research_operator','research_reviewer','admin')
  );
$$;

create or replace function public.can_research_review()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
      and role in ('research_reviewer','admin')
  );
$$;

create or replace function public.consume_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  current_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_bucket_key) > 180 then
    raise exception 'invalid rate limit parameters';
  end if;
  insert into public.api_rate_limits(bucket_key, window_started_at, request_count)
  values (p_bucket_key, now(), 1)
  on conflict (bucket_key) do update set
    window_started_at = case when public.api_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now() else public.api_rate_limits.window_started_at end,
    request_count = case when public.api_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1 else public.api_rate_limits.request_count + 1 end,
    updated_at = now()
  returning request_count into current_count;
  return current_count <= p_limit;
end;
$$;

create or replace function public.submit_assessment(
  p_profile jsonb,
  p_answers jsonb,
  p_report jsonb,
  p_tasks jsonb,
  p_engine_version text,
  p_rule_snapshot_version text,
  p_request_hash text,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  assessment_id uuid;
  previous_id uuid;
  next_version integer;
  task jsonb;
  cached jsonb;
  result jsonb;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if length(p_idempotency_key) < 8 or length(p_idempotency_key) > 120 then raise exception 'invalid idempotency key'; end if;

  select response into cached from public.request_idempotency
  where user_id = uid and route = 'assessment.submit' and idempotency_key = p_idempotency_key and status = 'completed';
  if cached is not null then return cached; end if;

  insert into public.request_idempotency(user_id, route, idempotency_key, request_hash)
  values(uid, 'assessment.submit', p_idempotency_key, p_request_hash)
  on conflict (user_id, route, idempotency_key) do update set updated_at = now()
  returning response into cached;
  if cached is not null then return cached; end if;

  insert into public.student_profiles(user_id, first_name, nationality, current_country, preferred_currency)
  values(uid, p_profile->>'first_name', (p_profile->>'nationality')::public.profile_country, p_profile->>'current_country', coalesce(p_profile->>'preferred_currency','USD'))
  on conflict (user_id) do update set first_name=excluded.first_name, nationality=excluded.nationality,
    current_country=excluded.current_country, preferred_currency=excluded.preferred_currency, updated_at=now();

  select id, version into previous_id, next_version from public.assessments
  where user_id = uid order by version desc limit 1;
  next_version := coalesce(next_version, 0) + 1;

  insert into public.assessments(user_id, version, status, answers, completion_percent, completed_at, content_hash, idempotency_key, supersedes_id)
  values(uid, next_version, 'completed', p_answers, 100, now(), p_request_hash, p_idempotency_key, previous_id)
  returning id into assessment_id;

  insert into public.profile_snapshots(user_id, assessment_id, snapshot, evidence_completeness, content_hash)
  values(uid, assessment_id, p_answers, coalesce((p_report->>'profileCompleteness')::smallint,0), p_request_hash);

  insert into public.pathway_reports(assessment_id, user_id, engine_version, rule_snapshot_version, report)
  values(assessment_id, uid, p_engine_version, p_rule_snapshot_version, p_report);

  for task in select value from jsonb_array_elements(coalesce(p_tasks,'[]'::jsonb)) loop
    insert into public.tasks(user_id,title,description,state,priority,system_generated,estimated_minutes,impact_type,impact_level,impact_score,source_type,source_id,dedupe_key,evidence_required)
    values(uid, task->>'title', task->>'description', 'todo', coalesce((task->>'priority')::smallint,3), true,
      nullif(task->>'estimated_minutes','')::integer, coalesce(task->>'impact_type','profile'),
      coalesce(task->>'impact_level','medium'), coalesce((task->>'impact_score')::smallint,50),
      'profile_gap', assessment_id, 'assessment:'||assessment_id::text||':'||coalesce(task->>'key',md5(task::text)),
      coalesce(task->'evidence_required','[]'::jsonb))
    on conflict do nothing;
  end loop;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, after_data)
  values(uid, 'assessment_submitted', 'assessment', assessment_id, jsonb_build_object('version',next_version,'engine_version',p_engine_version));
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, user_id, payload)
  values('assessment', assessment_id, 'assessment.completed', uid, jsonb_build_object('assessment_id',assessment_id));

  result := jsonb_build_object('assessment_id',assessment_id,'version',next_version,'report',p_report);
  update public.request_idempotency set response=result,status='completed',updated_at=now()
  where user_id=uid and route='assessment.submit' and idempotency_key=p_idempotency_key;
  return result;
exception when others then
  update public.request_idempotency set status='failed',updated_at=now()
  where user_id=uid and route='assessment.submit' and idempotency_key=p_idempotency_key;
  raise;
end;
$$;

create or replace function public.store_recommendation_run(
  p_user_id uuid,
  p_assessment_id uuid,
  p_engine_version text,
  p_catalogue_version text,
  p_profile_snapshot jsonb,
  p_weights jsonb,
  p_results jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := p_user_id;
  v_run_id uuid;
  item jsonb;
  expected_profile jsonb;
  entity_kind text;
  entity_uuid uuid;
  entity_score numeric;
begin
  if uid is null then raise exception 'user required' using errcode='22023'; end if;
  if p_assessment_id is null then raise exception 'completed assessment required' using errcode='22023'; end if;
  select answers into expected_profile from public.assessments where id=p_assessment_id and user_id=uid and status='completed';
  if expected_profile is null then raise exception 'assessment not found' using errcode='P0002'; end if;
  if expected_profile <> p_profile_snapshot then raise exception 'profile snapshot does not match assessment' using errcode='22023'; end if;
  if jsonb_typeof(p_results) <> 'array' or jsonb_array_length(p_results) > 500 then raise exception 'invalid recommendation results' using errcode='22023'; end if;
  insert into public.recommendation_runs(user_id,assessment_id,engine_version,catalogue_version,profile_hash,profile_snapshot,weights,result_count)
  values(uid,p_assessment_id,p_engine_version,p_catalogue_version,md5(p_profile_snapshot::text),p_profile_snapshot,p_weights,jsonb_array_length(coalesce(p_results,'[]'::jsonb)))
  on conflict(user_id,assessment_id,engine_version,catalogue_version,profile_hash) do update set generated_at=now(),profile_snapshot=excluded.profile_snapshot,
    weights=excluded.weights,result_count=excluded.result_count returning id into v_run_id;
  delete from public.recommendation_components c where c.run_id=v_run_id;
  delete from public.match_evaluations m where m.user_id=uid and m.engine_version=p_engine_version;
  for item in select value from jsonb_array_elements(coalesce(p_results,'[]'::jsonb)) loop
    entity_kind := item->>'entityType';
    entity_uuid := (item->>'entityId')::uuid;
    entity_score := (item->>'score')::numeric;
    if entity_kind not in ('programme','scholarship') or entity_score < 0 or entity_score > 100 then
      raise exception 'invalid recommendation component' using errcode='22023';
    end if;
    if entity_kind='programme' and not exists(select 1 from public.programmes where id=entity_uuid and state='published') then
      raise exception 'programme is not published' using errcode='22023';
    end if;
    if entity_kind='scholarship' and not exists(select 1 from public.scholarships where id=entity_uuid and state='published') then
      raise exception 'scholarship is not published' using errcode='22023';
    end if;
    insert into public.recommendation_components(run_id,user_id,entity_type,entity_id,state,final_score,score_components,reasons,failed_gates,open_checks,next_actions,rule_versions)
    values(v_run_id,uid,entity_kind,entity_uuid,(item->>'state')::public.match_state,
      entity_score,coalesce(item->'scoreComponents','{}'::jsonb),coalesce(item->'reasons','[]'::jsonb),
      coalesce(item->'failedGates','[]'::jsonb),coalesce(item->'openChecks','[]'::jsonb),coalesce(item->'nextActions','[]'::jsonb),coalesce(item->'ruleVersions','[]'::jsonb));
    insert into public.match_evaluations(user_id,assessment_id,entity_type,entity_id,state,score,reason_codes,open_checks,rule_versions,engine_version)
    values(uid,p_assessment_id,entity_kind,entity_uuid,(item->>'state')::public.match_state,entity_score,
      coalesce(item->'reasonCodes','[]'::jsonb),coalesce(item->'openChecks','[]'::jsonb),coalesce(item->'ruleVersions','[]'::jsonb),p_engine_version)
    on conflict(user_id,entity_type,entity_id,engine_version) do update set assessment_id=excluded.assessment_id,state=excluded.state,
      score=excluded.score,reason_codes=excluded.reason_codes,open_checks=excluded.open_checks,rule_versions=excluded.rule_versions,evaluated_at=now();
  end loop;
  return v_run_id;
end;
$$;

create or replace function public.refresh_application_readiness(p_user_id uuid, p_application_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  snapshot_id uuid;
  total_count integer;
  confirmed_count integer;
  blocking_count integer;
  overdue_count integer;
  calculated_score integer;
  next_task uuid;
begin
  if not exists(select 1 from public.applications where id=p_application_id and user_id=p_user_id) then return null; end if;
  select count(*), count(*) filter(where state in ('confirmed','waived')),
    count(*) filter(where blocking and state not in ('confirmed','waived'))
  into total_count, confirmed_count, blocking_count
  from public.application_requirements where application_id=p_application_id and user_id=p_user_id;
  select count(*) filter(where impact_level='critical' and due_at < now() and state not in ('completed','cancelled','not_applicable'))
  into overdue_count from public.tasks
  where user_id=p_user_id and (application_id=p_application_id or exists(select 1 from public.task_impacts i where i.task_id=tasks.id and i.application_id=p_application_id));
  calculated_score := greatest(0,least(100,case when total_count=0 then 0 else round(confirmed_count::numeric/total_count*100)::integer end - blocking_count*6 - overdue_count*4));
  select t.id into next_task from public.tasks t
  where t.user_id=p_user_id and t.state not in ('completed','cancelled','not_applicable','blocked')
    and (t.application_id=p_application_id or exists(select 1 from public.task_impacts i where i.task_id=t.id and i.application_id=p_application_id))
  order by (t.due_at < now()) desc,t.impact_score desc,t.due_at nulls last,t.position limit 1;
  insert into public.application_readiness_snapshots(user_id,application_id,score,confirmed_count,total_count,blocking_count,missing_count,breakdown)
  values(p_user_id,p_application_id,calculated_score,confirmed_count,total_count,blocking_count,greatest(0,total_count-confirmed_count),jsonb_build_object('overdue_critical_count',overdue_count,'next_task_id',next_task))
  returning id into snapshot_id;
  return snapshot_id;
end;
$$;

create or replace function public.transition_task(
  p_task_id uuid,
  p_to_state public.task_state,
  p_position numeric default null,
  p_note text default null,
  p_evidence_document_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  current_task public.tasks%rowtype;
  valid boolean := false;
  app_id uuid;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into current_task from public.tasks where id=p_task_id and user_id=uid for update;
  if not found then raise exception 'task not found' using errcode='P0002'; end if;
  valid := current_task.state=p_to_state or
    (current_task.state in ('todo','in_progress') and p_to_state in ('todo','in_progress','waiting','blocked','ready_for_review','completed','not_applicable','cancelled')) or
    (current_task.state='waiting' and p_to_state in ('todo','in_progress','blocked','completed','not_applicable','cancelled')) or
    (current_task.state='blocked' and p_to_state in ('todo','in_progress','waiting','not_applicable','cancelled')) or
    (current_task.state='ready_for_review' and p_to_state in ('in_progress','completed','not_applicable','cancelled')) or
    (current_task.state in ('completed','not_applicable','cancelled') and p_to_state='todo');
  if not valid then raise exception 'invalid task transition from % to %',current_task.state,p_to_state using errcode='23514'; end if;
  if p_evidence_document_id is not null and not exists(select 1 from public.documents where id=p_evidence_document_id and user_id=uid and status <> 'deleted') then
    raise exception 'completion evidence not found' using errcode='P0002';
  end if;
  update public.tasks set state=p_to_state,position=coalesce(p_position,position),completion_note=coalesce(p_note,completion_note),
    completion_evidence_document_id=coalesce(p_evidence_document_id,completion_evidence_document_id),
    completed_at=case when p_to_state='completed' then now() else null end,
    reopened_count=case when current_task.state='completed' and p_to_state='todo' then reopened_count+1 else reopened_count end
  where id=p_task_id;
  insert into public.task_events(user_id,task_id,actor_user_id,event_type,from_state,to_state,metadata)
  values(uid,p_task_id,uid,case when p_position is not null and current_task.state=p_to_state then 'moved' else 'state_changed' end,current_task.state,p_to_state,
    jsonb_strip_nulls(jsonb_build_object('note',p_note,'position',p_position,'evidence_document_id',p_evidence_document_id)));
  if p_to_state='completed' and current_task.source_type='requirement' and current_task.source_id is not null then
    update public.application_requirements set state='confirmed' where id=current_task.source_id and user_id=uid;
  end if;
  if p_to_state='completed' then
    update public.tasks dependent set state='todo'
    where dependent.user_id=uid and dependent.state='blocked'
      and exists(select 1 from public.task_dependencies d where d.task_id=dependent.id and d.depends_on_task_id=p_task_id and d.relation='blocks')
      and not exists(select 1 from public.task_dependencies d join public.tasks blocker on blocker.id=d.depends_on_task_id where d.task_id=dependent.id and d.relation='blocks' and blocker.state<>'completed');
  end if;
  for app_id in select distinct application_id from (
    select current_task.application_id application_id union all select application_id from public.task_impacts where task_id=p_task_id
  ) affected where application_id is not null loop
    perform public.refresh_application_readiness(uid,app_id);
  end loop;
  return (select to_jsonb(t) from public.tasks t where t.id=p_task_id);
end;
$$;

create or replace function public.refresh_my_application_readiness(p_application_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  return public.refresh_application_readiness(uid,p_application_id);
end;
$$;

create or replace function public.create_personal_task(
  p_title text,
  p_description text default null,
  p_due_at timestamptz default null,
  p_impact_level text default 'medium',
  p_impact_type text default 'application_readiness',
  p_application_id uuid default null,
  p_estimated_minutes integer default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); created public.tasks%rowtype;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_application_id is not null and not exists(select 1 from public.applications where id=p_application_id and user_id=uid) then raise exception 'application not found' using errcode='P0002'; end if;
  insert into public.tasks(user_id,title,description,due_at,impact_level,impact_type,impact_score,application_id,estimated_minutes,state,source_type,system_generated)
  values(uid,p_title,p_description,p_due_at,p_impact_level,p_impact_type,case p_impact_level when 'critical' then 90 when 'high' then 70 when 'low' then 20 else 45 end,p_application_id,p_estimated_minutes,'todo','personal',false)
  returning * into created;
  insert into public.task_events(user_id,task_id,actor_user_id,event_type,to_state) values(uid,created.id,uid,'created','todo');
  if p_application_id is not null then perform public.refresh_application_readiness(uid,p_application_id); end if;
  return to_jsonb(created);
end;
$$;

create or replace function public.update_task_metadata(
  p_task_id uuid,
  p_title text default null,
  p_description text default null,
  p_due_at timestamptz default null,
  p_due_at_set boolean default false,
  p_assigned_name text default null,
  p_assigned_email text default null,
  p_impact_level text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); current_task public.tasks%rowtype; updated_task public.tasks%rowtype;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  select * into current_task from public.tasks where id=p_task_id and user_id=uid for update;
  if not found then raise exception 'task not found' using errcode='P0002'; end if;
  update public.tasks set title=coalesce(p_title,title),description=case when p_description is not null then p_description else description end,
    due_at=case when p_due_at_set then p_due_at else due_at end,assigned_name=case when p_assigned_name is not null then p_assigned_name else assigned_name end,
    assigned_email=case when p_assigned_email is not null then p_assigned_email else assigned_email end,impact_level=coalesce(p_impact_level,impact_level),
    impact_score=case coalesce(p_impact_level,impact_level) when 'critical' then greatest(impact_score,90) when 'high' then greatest(impact_score,70) when 'low' then least(impact_score,35) else impact_score end
  where id=p_task_id returning * into updated_task;
  insert into public.task_events(user_id,task_id,actor_user_id,event_type,metadata) values(uid,p_task_id,uid,'updated',jsonb_strip_nulls(jsonb_build_object('title',p_title,'due_at',p_due_at,'impact_level',p_impact_level)));
  if current_task.application_id is not null then perform public.refresh_application_readiness(uid,current_task.application_id); end if;
  return to_jsonb(updated_task);
end;
$$;

create or replace function public.register_document(
  p_storage_path text,p_name text,p_category text,p_mime_type text,p_size_bytes bigint
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); created public.documents%rowtype;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  if split_part(p_storage_path,'/',1) <> uid::text then raise exception 'invalid storage ownership' using errcode='42501'; end if;
  insert into public.documents(user_id,storage_path,name,category,mime_type,size_bytes,status)
  values(uid,p_storage_path,p_name,p_category,p_mime_type,p_size_bytes,'uploaded') returning * into created;
  insert into public.audit_events(actor_user_id,action,entity_type,entity_id,after_data)
  values(uid,'document_registered','document',created.id,jsonb_build_object('category',p_category,'mime_type',p_mime_type,'size_bytes',p_size_bytes));
  return to_jsonb(created);
end;
$$;

create or replace function public.ingest_generated_tasks(p_tasks jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); item jsonb; impact jsonb; task_id uuid; created integer := 0;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  for item in select value from jsonb_array_elements(coalesce(p_tasks,'[]'::jsonb)) loop
    task_id := null;
    insert into public.tasks(user_id,title,description,state,priority,due_at,due_timezone,due_source,estimated_minutes,system_generated,
      impact_type,impact_level,impact_score,source_type,source_id,dedupe_key,application_id,assigned_name,assigned_email,evidence_required,position)
    values(uid,item->>'title',item->>'description',coalesce((item->>'state')::public.task_state,'todo'),coalesce((item->>'priority')::smallint,3),
      nullif(item->>'due_at','')::timestamptz,coalesce(item->>'due_timezone','Asia/Karachi'),item->>'due_source',nullif(item->>'estimated_minutes','')::integer,true,
      coalesce(item->>'impact_type','application_readiness'),coalesce(item->>'impact_level','medium'),coalesce((item->>'impact_score')::smallint,50),
      coalesce(item->>'source_type','system'),nullif(item->>'source_id','')::uuid,item->>'dedupe_key',nullif(item->>'application_id','')::uuid,
      item->>'assigned_name',item->>'assigned_email',coalesce(item->'evidence_required','[]'::jsonb),coalesce((item->>'position')::numeric,1000))
    on conflict do nothing returning id into task_id;
    if task_id is null then continue; end if;
    created := created+1;
    for impact in select value from jsonb_array_elements(coalesce(item->'impacts','[]'::jsonb)) loop
      insert into public.task_impacts(user_id,task_id,application_id,entity_type,entity_id,impact_label,readiness_delta)
      values(uid,task_id,nullif(impact->>'application_id','')::uuid,impact->>'entity_type',nullif(impact->>'entity_id','')::uuid,impact->>'impact_label',coalesce((impact->>'readiness_delta')::numeric,0))
      on conflict do nothing;
    end loop;
    insert into public.task_events(user_id,task_id,actor_user_id,event_type,to_state,metadata)
    values(uid,task_id,uid,'generated',(item->>'state')::public.task_state,jsonb_build_object('source_requirement_ids',coalesce(item->'source_requirement_ids','[]'::jsonb)));
  end loop;
  return created;
end;
$$;

create or replace function public.research_operation(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); result jsonb; fact public.fact_records%rowtype; entity_id uuid;
begin
  if uid is null or not public.can_research_write() then raise exception 'research role required' using errcode='42501'; end if;
  if p_action='capture_source' then
    insert into public.source_records(canonical_url,source_type,owner_name,country_code,verification_notes,status)
    values(p_payload->>'canonical_url',p_payload->>'source_type',p_payload->>'owner_name',p_payload->>'country_code',p_payload->>'verification_notes','unverified')
    on conflict(canonical_url) do update set source_type=excluded.source_type,owner_name=excluded.owner_name,country_code=excluded.country_code,
      verification_notes=excluded.verification_notes,updated_at=now()
    returning id,to_jsonb(source_records.*) into entity_id,result;
  elsif p_action='create_fact' then
    insert into public.fact_records(source_id,snapshot_id,entity_type,entity_key,field_key,value,normalized_value,confidence,state,created_by)
    values((p_payload->>'source_id')::uuid,nullif(p_payload->>'snapshot_id','')::uuid,p_payload->>'entity_type',p_payload->>'entity_key',p_payload->>'field_key',
      p_payload->'value',p_payload->'normalized_value',coalesce((p_payload->>'confidence')::smallint,50),'in_review',uid)
    returning id,to_jsonb(fact_records.*) into entity_id,result;
  elsif p_action='review_fact' then
    if not public.can_research_review() then raise exception 'reviewer role required' using errcode='42501'; end if;
    select * into fact from public.fact_records where id=(p_payload->>'fact_id')::uuid for update;
    if not found then raise exception 'fact not found' using errcode='P0002'; end if;
    if fact.created_by=uid and not public.has_role('admin') then raise exception 'independent review required' using errcode='23514'; end if;
    update public.fact_records set state=case when p_payload->>'decision'='conflict' then 'conflict'::public.record_state else 'in_review'::public.record_state end,
      reviewed_by=uid,reviewed_at=now(),updated_at=now() where id=fact.id returning id,to_jsonb(fact_records.*) into entity_id,result;
  elsif p_action='publish_fact' then
    if not public.can_research_review() then raise exception 'reviewer role required' using errcode='42501'; end if;
    select * into fact from public.fact_records where id=(p_payload->>'fact_id')::uuid for update;
    if not found then raise exception 'fact not found' using errcode='P0002'; end if;
    if fact.reviewed_by is null or fact.state='conflict' then raise exception 'review is incomplete' using errcode='23514'; end if;
    update public.fact_records set state='published',updated_at=now() where id=fact.id returning id,to_jsonb(fact_records.*) into entity_id,result;
  else raise exception 'unsupported research operation' using errcode='22023';
  end if;
  insert into public.audit_events(actor_user_id,action,entity_type,entity_id,after_data)
  values(uid,p_action,case when p_action like '%fact%' then 'fact_record' else 'source_record' end,entity_id,result);
  return result;
end;
$$;

create or replace function public.invite_recommender(
  p_application_id uuid,
  p_name text,
  p_email text,
  p_token_hash text,
  p_expires_at timestamptz
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); invitation public.recommenders%rowtype;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  if not exists(select 1 from public.applications where id=p_application_id and user_id=uid) then raise exception 'application not found' using errcode='P0002'; end if;
  insert into public.recommenders(user_id,application_id,name,email,status,access_token_hash,token_expires_at,invited_at)
  values(uid,p_application_id,p_name,lower(p_email),'invited',p_token_hash,p_expires_at,now()) returning * into invitation;
  insert into public.outbox_events(aggregate_type,aggregate_id,event_type,user_id,payload)
  values('recommender',invitation.id,'recommender.invited',uid,jsonb_build_object('recommender_id',invitation.id,'application_id',p_application_id,'email',lower(p_email)));
  return jsonb_build_object('id',invitation.id,'status',invitation.status,'invited_at',invitation.invited_at,'token_expires_at',invitation.token_expires_at);
end;
$$;

-- Tighten truth-system permissions. Support remains read-only.
drop policy if exists "staff manage programmes" on public.programmes;
drop policy if exists "staff manage scholarships" on public.scholarships;
drop policy if exists "staff manage rules" on public.atomic_rules;
drop policy if exists "staff manage snapshots" on public.source_snapshots;
drop policy if exists "staff manage facts" on public.fact_records;
drop policy if exists "staff manage source records" on public.source_records;
create policy "research manages programmes" on public.programmes for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages scholarships" on public.scholarships for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages rules" on public.atomic_rules for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages snapshots" on public.source_snapshots for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages facts" on public.fact_records for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages sources" on public.source_records for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "staff reads all sources" on public.source_records for select using ((select public.is_staff()));
create policy "staff reads all snapshots" on public.source_snapshots for select using ((select public.is_staff()));

alter table public.profile_snapshots enable row level security;
alter table public.recommendation_runs enable row level security;
alter table public.recommendation_components enable row level security;
alter table public.consent_events enable row level security;
alter table public.request_idempotency enable row level security;
alter table public.outbox_events enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_rows enable row level security;

create policy "students read own profile snapshots" on public.profile_snapshots for select to authenticated using (user_id=(select auth.uid()));
create policy "students read own recommendation runs" on public.recommendation_runs for select to authenticated using (user_id=(select auth.uid()));
create policy "students read own recommendation components" on public.recommendation_components for select to authenticated using (user_id=(select auth.uid()));
create policy "students append own consent" on public.consent_events for insert to authenticated with check (user_id=(select auth.uid()));
create policy "students read own consent" on public.consent_events for select to authenticated using (user_id=(select auth.uid()));
create policy "research manages import batches" on public.import_batches for all to authenticated using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages import rows" on public.import_rows for all to authenticated using (exists(select 1 from public.import_batches b where b.id=batch_id and (select public.can_research_write()))) with check (exists(select 1 from public.import_batches b where b.id=batch_id and (select public.can_research_write())));

drop policy if exists "students insert own reports" on public.pathway_reports;
drop policy if exists "authenticated append audit" on public.audit_events;

revoke all on function public.consume_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
revoke all on function public.submit_assessment(jsonb,jsonb,jsonb,jsonb,text,text,text,text) from public, anon;
grant execute on function public.submit_assessment(jsonb,jsonb,jsonb,jsonb,text,text,text,text) to authenticated;
revoke all on function public.store_recommendation_run(uuid,uuid,text,text,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.store_recommendation_run(uuid,uuid,text,text,jsonb,jsonb,jsonb) to service_role;
revoke all on function public.refresh_application_readiness(uuid,uuid) from public, anon, authenticated;
grant execute on function public.refresh_application_readiness(uuid,uuid) to service_role;
revoke all on function public.transition_task(uuid,public.task_state,numeric,text,uuid) from public, anon;
grant execute on function public.transition_task(uuid,public.task_state,numeric,text,uuid) to authenticated;
revoke all on function public.refresh_my_application_readiness(uuid) from public, anon;
grant execute on function public.refresh_my_application_readiness(uuid) to authenticated;
revoke all on function public.create_personal_task(text,text,timestamptz,text,text,uuid,integer) from public, anon;
grant execute on function public.create_personal_task(text,text,timestamptz,text,text,uuid,integer) to authenticated;
revoke all on function public.update_task_metadata(uuid,text,text,timestamptz,boolean,text,text,text) from public, anon;
grant execute on function public.update_task_metadata(uuid,text,text,timestamptz,boolean,text,text,text) to authenticated;
revoke all on function public.register_document(text,text,text,text,bigint) from public, anon;
grant execute on function public.register_document(text,text,text,text,bigint) to authenticated;
revoke all on function public.ingest_generated_tasks(jsonb) from public, anon;
grant execute on function public.ingest_generated_tasks(jsonb) to authenticated;
revoke all on function public.research_operation(text,jsonb) from public, anon;
grant execute on function public.research_operation(text,jsonb) to authenticated;
revoke all on function public.invite_recommender(uuid,text,text,text,timestamptz) from public, anon;
grant execute on function public.invite_recommender(uuid,text,text,text,timestamptz) to authenticated;
revoke all on function public.can_research_write() from public, anon;
revoke all on function public.can_research_review() from public, anon;
grant execute on function public.can_research_write() to authenticated;
grant execute on function public.can_research_review() to authenticated;

-- Research truth can only be changed through reviewed command functions.
revoke insert, update, delete on public.source_records, public.source_snapshots, public.fact_records,
  public.programmes, public.scholarships, public.atomic_rules, public.audit_events from authenticated;
revoke all on public.recommenders from authenticated;
grant select (id,user_id,application_id,name,email,status,token_expires_at,invited_at,submitted_at,created_at,updated_at) on public.recommenders to authenticated;
revoke insert, update, delete on public.pathway_reports, public.match_evaluations, public.profile_snapshots,
  public.recommendation_runs, public.recommendation_components, public.application_requirements,
  public.tasks, public.task_dependencies, public.task_impacts, public.task_events, public.task_reminders,
  public.application_readiness_snapshots, public.documents, public.request_idempotency, public.outbox_events,
  public.assessments from authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['request_idempotency','import_batches'] loop
    execute format('drop trigger if exists %I_touch_updated on public.%I',table_name,table_name);
    execute format('create trigger %I_touch_updated before update on public.%I for each row execute function public.touch_updated_at()',table_name,table_name);
  end loop;
end $$;
