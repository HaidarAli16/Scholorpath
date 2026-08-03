-- ScholarPath education intelligence V3.
-- Apply after 004_production_backend.sql to the ScholarPath Supabase project.

create table public.intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null,
  engine_version text not null,
  report_hash text not null,
  evidence_confidence smallint not null check (evidence_confidence between 0 and 100),
  evaluated_at timestamptz not null,
  report_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, assessment_id, engine_version, report_hash),
  foreign key (assessment_id, user_id) references public.assessments(id, user_id) on delete cascade
);

create table public.evidence_claims (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.intelligence_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_key text not null,
  category text not null check (category in ('academic','language','experience','research','funding')),
  label text not null,
  state text not null check (state in ('verified','declared','missing')),
  confidence smallint not null check (confidence between 0 and 100),
  source_needed text not null,
  affects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (run_id, claim_key)
);

create table public.requirement_evaluations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.intelligence_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  opportunity_key text not null,
  requirement_key text not null,
  rule_group text not null,
  label text not null,
  expected_value text not null,
  actual_value text not null,
  outcome text not null check (outcome in ('pass','fail','unknown','conditional')),
  is_hard_gate boolean not null default false,
  impact text not null check (impact in ('critical','high','medium')),
  explanation text not null,
  source_version text not null,
  created_at timestamptz not null default now(),
  unique (run_id, opportunity_key, requirement_key)
);

create table public.improvement_simulations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.intelligence_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_key text not null,
  title text not null,
  input_change text not null,
  readiness_delta smallint not null,
  confidence_delta smallint not null,
  affected_routes jsonb not null default '[]'::jsonb,
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (run_id, scenario_key)
);

create index intelligence_runs_user_idx on public.intelligence_runs(user_id, evaluated_at desc);
create index evidence_claims_user_state_idx on public.evidence_claims(user_id, state, category);
create index requirement_evaluations_open_idx on public.requirement_evaluations(user_id, outcome, impact);

alter table public.intelligence_runs enable row level security;
alter table public.evidence_claims enable row level security;
alter table public.requirement_evaluations enable row level security;
alter table public.improvement_simulations enable row level security;

create policy "students read own intelligence runs" on public.intelligence_runs for select to authenticated using (user_id=(select auth.uid()));
create policy "students read own evidence claims" on public.evidence_claims for select to authenticated using (user_id=(select auth.uid()));
create policy "students read own requirement evaluations" on public.requirement_evaluations for select to authenticated using (user_id=(select auth.uid()));
create policy "students read own improvement simulations" on public.improvement_simulations for select to authenticated using (user_id=(select auth.uid()));
create policy "staff read intelligence runs" on public.intelligence_runs for select to authenticated using ((select public.is_staff()));
create policy "staff read evidence claims" on public.evidence_claims for select to authenticated using ((select public.is_staff()));
create policy "staff read requirement evaluations" on public.requirement_evaluations for select to authenticated using ((select public.is_staff()));
create policy "staff read improvement simulations" on public.improvement_simulations for select to authenticated using ((select public.is_staff()));

create or replace function public.store_intelligence_report(p_assessment_id uuid, p_report jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  v_run_id uuid;
  claim jsonb;
  opportunity jsonb;
  requirement jsonb;
  simulation jsonb;
begin
  if uid is null then raise exception 'authentication required' using errcode='42501'; end if;
  if not exists(select 1 from public.assessments where id=p_assessment_id and user_id=uid and status='completed') then
    raise exception 'completed assessment not found' using errcode='P0002';
  end if;
  if jsonb_typeof(p_report->'evidenceClaims') <> 'array' or jsonb_typeof(p_report->'opportunities') <> 'array' then
    raise exception 'invalid intelligence report' using errcode='22023';
  end if;

  insert into public.intelligence_runs(user_id,assessment_id,engine_version,report_hash,evidence_confidence,evaluated_at,report_json)
  values(uid,p_assessment_id,p_report->>'engineVersion',md5(p_report::text),(p_report->>'evidenceConfidence')::smallint,(p_report->>'evaluatedAt')::timestamptz,p_report)
  on conflict(user_id,assessment_id,engine_version,report_hash) do update set evaluated_at=excluded.evaluated_at,report_json=excluded.report_json
  returning id into v_run_id;

  delete from public.evidence_claims ec where ec.run_id=v_run_id;
  delete from public.requirement_evaluations re where re.run_id=v_run_id;
  delete from public.improvement_simulations sims where sims.run_id=v_run_id;

  for claim in select * from jsonb_array_elements(p_report->'evidenceClaims') loop
    insert into public.evidence_claims(run_id,user_id,claim_key,category,label,state,confidence,source_needed,affects)
    values(v_run_id,uid,claim->>'id',claim->>'category',claim->>'label',claim->>'state',(claim->>'confidence')::smallint,claim->>'sourceNeeded',coalesce(claim->'affects','[]'::jsonb));
  end loop;

  for opportunity in select * from jsonb_array_elements(p_report->'opportunities') loop
    for requirement in select * from jsonb_array_elements(opportunity->'requirements') loop
      insert into public.requirement_evaluations(run_id,user_id,opportunity_key,requirement_key,rule_group,label,expected_value,actual_value,outcome,is_hard_gate,impact,explanation,source_version)
      values(v_run_id,uid,opportunity->>'id',requirement->>'id',requirement->>'group',requirement->>'label',requirement->>'expected',requirement->>'actual',requirement->>'outcome',(requirement->>'hard')::boolean,requirement->>'impact',requirement->>'explanation',opportunity->'source'->>'version');
    end loop;
  end loop;

  for simulation in select * from jsonb_array_elements(p_report->'simulations') loop
    insert into public.improvement_simulations(run_id,user_id,scenario_key,title,input_change,readiness_delta,confidence_delta,affected_routes,explanation)
    values(v_run_id,uid,simulation->>'id',simulation->>'title',simulation->>'change',(simulation->>'readinessDelta')::smallint,(simulation->>'confidenceDelta')::smallint,coalesce(simulation->'affectedRoutes','[]'::jsonb),simulation->>'explanation');
  end loop;
  return v_run_id;
end;
$$;

revoke all on public.intelligence_runs, public.evidence_claims, public.requirement_evaluations, public.improvement_simulations from anon, authenticated;
grant select on public.intelligence_runs, public.evidence_claims, public.requirement_evaluations, public.improvement_simulations to authenticated;
revoke all on function public.store_intelligence_report(uuid,jsonb) from public, anon;
grant execute on function public.store_intelligence_report(uuid,jsonb) to authenticated;
