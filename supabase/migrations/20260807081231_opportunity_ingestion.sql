-- Governed official-source ingestion for ScholarPath.
-- Fetching creates immutable snapshots and review candidates; it never publishes
-- opportunity truth without an authenticated research review.

create table public.ingestion_adapters (
  id uuid primary key default gen_random_uuid(),
  adapter_key text not null unique check (adapter_key ~ '^[a-z0-9_]{3,80}$'),
  name text not null,
  kind text not null check (kind in ('html_detail','html_catalogue','json_feed','sitemap')),
  entity_type text not null check (entity_type in ('programme','scholarship','mixed')),
  description text,
  allowed_hosts text[] not null default '{}',
  config jsonb not null default '{}'::jsonb,
  parser_version text not null,
  enabled boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingestion_sources (
  source_id uuid primary key references public.source_records(id) on delete cascade,
  adapter_id uuid not null references public.ingestion_adapters(id),
  enabled boolean not null default true,
  priority smallint not null default 3 check (priority between 1 and 5),
  schedule_minutes integer not null default 1440 check (schedule_minutes between 60 and 10080),
  next_fetch_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  consecutive_failures smallint not null default 0 check (consecutive_failures >= 0),
  etag text,
  last_modified text,
  robots_state text not null default 'unchecked' check (robots_state in ('unchecked','allowed','blocked','unavailable','error')),
  robots_checked_at timestamptz,
  last_http_status smallint,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.source_records(id) on delete cascade,
  adapter_id uuid not null references public.ingestion_adapters(id),
  trigger_type text not null default 'schedule' check (trigger_type in ('schedule','manual','retry','webhook')),
  status text not null default 'queued' check (status in ('queued','running','no_change','needs_review','succeeded','blocked','failed','cancelled')),
  requested_by uuid references auth.users(id),
  worker_id text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  http_status smallint,
  final_url text,
  robots_state text check (robots_state in ('allowed','blocked','unavailable','error')),
  previous_content_hash text,
  content_hash text,
  content_changed boolean,
  bytes_received bigint check (bytes_received is null or bytes_received >= 0),
  discovered_count integer not null default 0 check (discovered_count >= 0),
  candidate_count integer not null default 0 check (candidate_count >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_code text,
  error_message text,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.opportunity_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ingestion_runs(id) on delete cascade,
  source_id uuid not null references public.source_records(id) on delete cascade,
  snapshot_id uuid not null references public.source_snapshots(id) on delete cascade,
  entity_type text not null check (entity_type in ('programme','scholarship')),
  external_key text not null,
  canonical_url text not null,
  title text not null,
  provider_name text not null,
  country_code text,
  normalized_data jsonb not null,
  content_hash text not null,
  validation_errors jsonb not null default '[]'::jsonb,
  change_summary jsonb not null default '{}'::jsonb,
  review_state text not null default 'pending' check (review_state in ('pending','approved','rejected','published','superseded')),
  matched_programme_id uuid references public.programmes(id) on delete set null,
  matched_scholarship_id uuid references public.scholarships(id) on delete set null,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_key, content_hash)
);

create index ingestion_sources_due_idx on public.ingestion_sources(priority, next_fetch_at) where enabled;
create index ingestion_sources_adapter_fk_idx on public.ingestion_sources(adapter_id);
create index ingestion_runs_queue_idx on public.ingestion_runs(queued_at, id) where status = 'queued';
create index ingestion_runs_source_created_idx on public.ingestion_runs(source_id, created_at desc);
create index ingestion_runs_adapter_fk_idx on public.ingestion_runs(adapter_id);
create index opportunity_candidates_review_idx on public.opportunity_candidates(review_state, created_at) where review_state in ('pending','approved');
create index opportunity_candidates_run_fk_idx on public.opportunity_candidates(run_id);
create index opportunity_candidates_source_fk_idx on public.opportunity_candidates(source_id);
create index opportunity_candidates_snapshot_fk_idx on public.opportunity_candidates(snapshot_id);
create index opportunity_candidates_programme_fk_idx on public.opportunity_candidates(matched_programme_id) where matched_programme_id is not null;
create index opportunity_candidates_scholarship_fk_idx on public.opportunity_candidates(matched_scholarship_id) where matched_scholarship_id is not null;

create trigger ingestion_adapters_touch_updated_at before update on public.ingestion_adapters for each row execute function public.touch_updated_at();
create trigger ingestion_sources_touch_updated_at before update on public.ingestion_sources for each row execute function public.touch_updated_at();
create trigger opportunity_candidates_touch_updated_at before update on public.opportunity_candidates for each row execute function public.touch_updated_at();

alter table public.ingestion_adapters enable row level security;
alter table public.ingestion_sources enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.opportunity_candidates enable row level security;

create policy "staff read ingestion adapters" on public.ingestion_adapters for select to authenticated using ((select public.is_staff()));
create policy "research manages ingestion adapters" on public.ingestion_adapters for all to authenticated using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "staff read ingestion sources" on public.ingestion_sources for select to authenticated using ((select public.is_staff()));
create policy "research manages ingestion sources" on public.ingestion_sources for all to authenticated using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "staff read ingestion runs" on public.ingestion_runs for select to authenticated using ((select public.is_staff()));
create policy "research queues ingestion runs" on public.ingestion_runs for insert to authenticated with check ((select public.can_research_write()) and requested_by = (select auth.uid()));
create policy "staff read opportunity candidates" on public.opportunity_candidates for select to authenticated using ((select public.is_staff()));
create policy "reviewers update opportunity candidates" on public.opportunity_candidates for update to authenticated using ((select public.can_research_review())) with check ((select public.can_research_review()));

grant select, insert, update on public.ingestion_adapters, public.ingestion_sources, public.ingestion_runs, public.opportunity_candidates to authenticated;
grant all privileges on public.ingestion_adapters, public.ingestion_sources, public.ingestion_runs, public.opportunity_candidates to service_role;

create or replace function public.enqueue_ingestion_source(p_source_id uuid, p_trigger_type text default 'manual')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  adapter uuid;
  created_id uuid;
begin
  if uid is null or not public.can_research_write() then
    raise exception 'research role required' using errcode = '42501';
  end if;
  if p_trigger_type not in ('manual','retry') then
    raise exception 'invalid manual trigger' using errcode = '22023';
  end if;
  select adapter_id into adapter from public.ingestion_sources where source_id = p_source_id and enabled;
  if adapter is null then raise exception 'ingestion source not found or disabled' using errcode = 'P0002'; end if;
  if exists (select 1 from public.ingestion_runs where source_id = p_source_id and status in ('queued','running')) then
    select id into created_id from public.ingestion_runs where source_id = p_source_id and status in ('queued','running') order by queued_at desc limit 1;
    return created_id;
  end if;
  insert into public.ingestion_runs(source_id, adapter_id, trigger_type, requested_by)
  values(p_source_id, adapter, p_trigger_type, uid)
  returning id into created_id;
  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, after_data)
  values(uid, 'ingestion_queued', 'ingestion_run', created_id, jsonb_build_object('source_id', p_source_id, 'trigger_type', p_trigger_type));
  return created_id;
end;
$$;

create or replace function public.enqueue_due_ingestion_sources(p_limit integer default 25)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare inserted_count integer;
begin
  if current_user not in ('service_role','postgres') then raise exception 'service role required' using errcode='42501'; end if;
  with due as (
    select source_id, adapter_id
    from public.ingestion_sources s
    where s.enabled and s.next_fetch_at <= now()
      and not exists (select 1 from public.ingestion_runs r where r.source_id=s.source_id and r.status in ('queued','running'))
    order by s.priority, s.next_fetch_at
    limit greatest(1, least(coalesce(p_limit,25),100))
    for update skip locked
  ), inserted as (
    insert into public.ingestion_runs(source_id,adapter_id,trigger_type)
    select source_id,adapter_id,'schedule' from due returning 1
  ) select count(*) into inserted_count from inserted;
  return inserted_count;
end;
$$;

create or replace function public.claim_ingestion_run(p_worker_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare claimed public.ingestion_runs%rowtype;
begin
  if current_user not in ('service_role','postgres') then raise exception 'service role required' using errcode='42501'; end if;
  update public.ingestion_runs set status='running', worker_id=left(p_worker_id,120), started_at=now()
  where id = (
    select id from public.ingestion_runs where status='queued' order by queued_at,id limit 1 for update skip locked
  ) returning * into claimed;
  if claimed.id is null then return null; end if;
  update public.ingestion_sources set last_attempt_at=now() where source_id=claimed.source_id;
  return to_jsonb(claimed);
end;
$$;

create or replace function public.review_opportunity_candidate(p_candidate_id uuid, p_decision text, p_notes text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare uid uuid := (select auth.uid()); candidate public.opportunity_candidates%rowtype;
begin
  if uid is null or not public.can_research_review() then raise exception 'reviewer role required' using errcode='42501'; end if;
  if p_decision not in ('approve','reject') then raise exception 'invalid review decision' using errcode='22023'; end if;
  select * into candidate from public.opportunity_candidates where id=p_candidate_id for update;
  if not found then raise exception 'candidate not found' using errcode='P0002'; end if;
  if candidate.review_state not in ('pending','approved') then raise exception 'candidate is not reviewable' using errcode='23514'; end if;
  update public.opportunity_candidates
  set review_state=case when p_decision='approve' then 'approved' else 'rejected' end,
      reviewed_by=uid, reviewed_at=now(), review_notes=nullif(trim(p_notes),'')
  where id=p_candidate_id returning * into candidate;
  insert into public.audit_events(actor_user_id,action,entity_type,entity_id,after_data)
  values(uid,'ingestion_candidate_'||p_decision,'opportunity_candidate',candidate.id,to_jsonb(candidate));
  return to_jsonb(candidate);
end;
$$;

revoke all on function public.enqueue_ingestion_source(uuid,text) from public, anon;
revoke all on function public.enqueue_due_ingestion_sources(integer) from public, anon, authenticated;
revoke all on function public.claim_ingestion_run(text) from public, anon, authenticated;
revoke all on function public.review_opportunity_candidate(uuid,text,text) from public, anon;
grant execute on function public.enqueue_ingestion_source(uuid,text) to authenticated;
grant execute on function public.enqueue_due_ingestion_sources(integer) to service_role;
grant execute on function public.claim_ingestion_run(text) to service_role;
grant execute on function public.review_opportunity_candidate(uuid,text,text) to authenticated;

insert into public.ingestion_adapters(adapter_key,name,kind,entity_type,description,allowed_hosts,config,parser_version)
values
('official_scholarship_detail','Official scholarship detail','html_detail','scholarship','Extract one scholarship from an official award page.',array['chevening.org','www.chevening.org','hea.ie','www.studyinnl.org','www2.daad.de'],
 '{"open_patterns":["applications are open","apply now","applications open"],"closed_patterns":["applications are closed","applications have closed"],"deadline_keywords":["deadline","applications close","closing date"],"max_bytes":3000000}'::jsonb,'official-detail-v1'),
('official_programme_detail','Official programme detail','html_detail','programme','Extract one programme from an official university course page.',array['courses.leeds.ac.uk','www.uni-saarland.de','www.tcd.ie'],
 '{"deadline_keywords":["application deadline","deadline","apply by"],"tuition_keywords":["international fee","tuition fee","fees"],"max_bytes":3000000}'::jsonb,'programme-detail-v1'),
('official_catalogue_discovery','Official catalogue discovery','html_catalogue','mixed','Discover official opportunity links; each discovered page must be assigned and reviewed before publication.',array['erasmus-plus.ec.europa.eu','www2.daad.de'],
 '{"link_keywords":["master","scholarship","programme","program"],"max_links":100,"max_bytes":3000000}'::jsonb,'catalogue-discovery-v1')
on conflict(adapter_key) do update set name=excluded.name,kind=excluded.kind,entity_type=excluded.entity_type,description=excluded.description,
  allowed_hosts=excluded.allowed_hosts,config=excluded.config,parser_version=excluded.parser_version,enabled=true,updated_at=now();

insert into public.source_records(canonical_url,source_type,owner_name,country_code,status,verification_notes)
values('https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters','government_agency','European Commission / Erasmus+','EU','unverified','Official discovery page; fetched content requires review before publication.')
on conflict(canonical_url) do nothing;

insert into public.ingestion_sources(source_id,adapter_id,priority,schedule_minutes,next_fetch_at)
select s.id,a.id,1,360,now()
from public.source_records s cross join public.ingestion_adapters a
where a.adapter_key='official_scholarship_detail'
  and s.canonical_url in (
    'https://www.chevening.org/scholarships/application-timeline/',
    'https://hea.ie/policy/internationalisation/goi-ies/',
    'https://www.studyinnl.org/finances/nl-scholarship',
    'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777'
  )
on conflict(source_id) do update set adapter_id=excluded.adapter_id,enabled=true,priority=excluded.priority,schedule_minutes=excluded.schedule_minutes,next_fetch_at=least(public.ingestion_sources.next_fetch_at,now());

insert into public.ingestion_sources(source_id,adapter_id,priority,schedule_minutes,next_fetch_at)
select s.id,a.id,2,1440,now()
from public.source_records s cross join public.ingestion_adapters a
where a.adapter_key='official_programme_detail'
  and s.canonical_url in (
    'https://courses.leeds.ac.uk/I071/data_science_and_analytics_msc',
    'https://courses.leeds.ac.uk/d053/data-science-statistics-msc',
    'https://www.uni-saarland.de/en/study/programmes/master/data-science.html',
    'https://www.tcd.ie/courses/postgraduate/courses/computer-science---data-science--mscpgraddip/'
  )
on conflict(source_id) do update set adapter_id=excluded.adapter_id,enabled=true,priority=excluded.priority,schedule_minutes=excluded.schedule_minutes,next_fetch_at=least(public.ingestion_sources.next_fetch_at,now());

insert into public.ingestion_sources(source_id,adapter_id,priority,schedule_minutes,next_fetch_at)
select s.id,a.id,1,720,now()
from public.source_records s cross join public.ingestion_adapters a
where a.adapter_key='official_catalogue_discovery'
  and s.canonical_url='https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters'
on conflict(source_id) do update set adapter_id=excluded.adapter_id,enabled=true,priority=excluded.priority,schedule_minutes=excluded.schedule_minutes,next_fetch_at=least(public.ingestion_sources.next_fetch_at,now());
