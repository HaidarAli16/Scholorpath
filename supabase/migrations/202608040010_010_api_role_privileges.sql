-- PostgREST roles need table privileges before row-level policies are evaluated.
-- This matrix preserves the service-only write boundaries established in 004-006.

grant usage on schema public to anon, authenticated, service_role;

-- Anonymous users can read only publishable research/catalogue surfaces. RLS still
-- limits these tables to their verified or published rows.
grant select on table
  public.source_records,
  public.fact_records,
  public.programmes,
  public.scholarships,
  public.atomic_rules,
  public.countries,
  public.cities,
  public.country_facts,
  public.institutions,
  public.campuses,
  public.institution_rankings,
  public.qualification_equivalencies,
  public.institution_requirements,
  public.programme_intakes
to anon;

-- Authenticated requests receive ordinary API privileges. Every public table has
-- RLS enabled; the explicit revokes below retain command/RPC-only write paths.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke insert, update, delete on table
  public.source_records,
  public.source_snapshots,
  public.fact_records,
  public.programmes,
  public.scholarships,
  public.atomic_rules,
  public.audit_events,
  public.pathway_reports,
  public.match_evaluations,
  public.profile_snapshots,
  public.recommendation_runs,
  public.recommendation_components,
  public.application_requirements,
  public.tasks,
  public.task_dependencies,
  public.task_impacts,
  public.task_events,
  public.task_reminders,
  public.application_readiness_snapshots,
  public.documents,
  public.request_idempotency,
  public.outbox_events,
  public.assessments
from authenticated;

revoke all on table public.recommenders from authenticated;
grant select (id,user_id,application_id,name,email,status,token_expires_at,invited_at,submitted_at,created_at,updated_at)
  on table public.recommenders to authenticated;

revoke all on table
  public.intelligence_runs,
  public.evidence_claims,
  public.requirement_evaluations,
  public.improvement_simulations
from authenticated;
grant select on table
  public.intelligence_runs,
  public.evidence_claims,
  public.requirement_evaluations,
  public.improvement_simulations
to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

-- Public read policies must not invoke staff-only helper functions. Staff access
-- remains available through the authenticated management policies.
alter policy "published programmes readable" on public.programmes using (state = 'published');
alter policy "published scholarships readable" on public.scholarships using (state = 'published');
alter policy "published rules readable" on public.atomic_rules using (state = 'published');
alter policy "published facts readable" on public.fact_records using (state = 'published');

alter policy "staff manage programmes" on public.programmes to authenticated;
alter policy "staff manage scholarships" on public.scholarships to authenticated;
alter policy "staff manage rules" on public.atomic_rules to authenticated;
alter policy "staff manage snapshots" on public.source_snapshots to authenticated;
alter policy "staff manage facts" on public.fact_records to authenticated;
alter policy "staff manage source records" on public.source_records to authenticated;
alter policy "research manages programmes" on public.programmes to authenticated;
alter policy "research manages scholarships" on public.scholarships to authenticated;
alter policy "research manages rules" on public.atomic_rules to authenticated;
alter policy "research manages snapshots" on public.source_snapshots to authenticated;
alter policy "research manages facts" on public.fact_records to authenticated;
alter policy "research manages sources" on public.source_records to authenticated;
alter policy "staff reads all sources" on public.source_records to authenticated;
alter policy "staff reads all snapshots" on public.source_snapshots to authenticated;

alter policy "published countries readable" on public.countries using (state = 'published');
alter policy "published cities readable" on public.cities using (state = 'published');
alter policy "published country facts readable" on public.country_facts using (state = 'published');
alter policy "published institutions readable" on public.institutions using (state = 'published');
alter policy "published campuses readable" on public.campuses using (state = 'published');
alter policy "published rankings readable" on public.institution_rankings using (state = 'published');
alter policy "published equivalencies readable" on public.qualification_equivalencies using (state = 'published');
alter policy "published institution requirements readable" on public.institution_requirements using (state = 'published');
alter policy "published programme intakes readable" on public.programme_intakes using (state = 'published');

alter policy "research manages countries" on public.countries to authenticated;
alter policy "research manages cities" on public.cities to authenticated;
alter policy "research manages country facts" on public.country_facts to authenticated;
alter policy "research manages institutions" on public.institutions to authenticated;
alter policy "research manages campuses" on public.campuses to authenticated;
alter policy "research manages rankings" on public.institution_rankings to authenticated;
alter policy "research manages equivalencies" on public.qualification_equivalencies to authenticated;
alter policy "research manages institution requirements" on public.institution_requirements to authenticated;
alter policy "research manages programme intakes" on public.programme_intakes to authenticated;
