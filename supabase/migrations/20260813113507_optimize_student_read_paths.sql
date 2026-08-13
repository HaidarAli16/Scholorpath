-- CandidRoute production read paths. These indexes mirror the filters and
-- ordering used by authenticated server bootstrap and public directories.

create index if not exists assessments_user_updated_idx
  on public.assessments (user_id, updated_at desc);
create index if not exists pathway_reports_user_generated_idx
  on public.pathway_reports (user_id, generated_at desc);
create index if not exists applications_user_deadline_idx
  on public.applications (user_id, deadline_at asc nulls last);
create index if not exists tasks_user_due_active_idx
  on public.tasks (user_id, due_at asc nulls last)
  where state not in ('completed', 'cancelled', 'not_applicable');
create index if not exists documents_user_updated_active_idx
  on public.documents (user_id, updated_at desc)
  where status <> 'deleted';
create index if not exists portfolios_user_default_idx
  on public.portfolios (user_id, is_default);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index if not exists writing_items_user_updated_idx
  on public.writing_items (user_id, updated_at desc);
create index if not exists funding_scenarios_user_updated_idx
  on public.funding_scenarios (user_id, updated_at desc);
create index if not exists offers_user_created_idx
  on public.offers (user_id, created_at desc);
create index if not exists recommendation_components_run_user_score_idx
  on public.recommendation_components (run_id, user_id, final_score desc);

create index if not exists programmes_published_deadline_idx
  on public.programmes (deadline_at asc nulls last)
  where state = 'published';
create index if not exists scholarships_published_deadline_idx
  on public.scholarships (deadline_at asc nulls last)
  where state = 'published';
create index if not exists countries_published_name_idx
  on public.countries (name)
  where state = 'published';
create index if not exists cities_published_country_name_idx
  on public.cities (country_code, name)
  where state = 'published';
create index if not exists country_facts_published_country_category_idx
  on public.country_facts (country_code, category)
  where state = 'published';
create index if not exists institutions_published_country_name_idx
  on public.institutions (country_code, official_name)
  where state = 'published';
create index if not exists campuses_published_institution_idx
  on public.campuses (institution_id)
  where state = 'published';
create index if not exists institution_rankings_published_institution_year_idx
  on public.institution_rankings (institution_id, edition_year desc)
  where state = 'published';
create index if not exists qualification_equivalencies_published_institution_origin_idx
  on public.qualification_equivalencies (institution_id, origin_country)
  where state = 'published';
create index if not exists institution_requirements_published_institution_origin_idx
  on public.institution_requirements (institution_id, origin_country)
  where state = 'published';
create index if not exists programmes_published_institution_idx
  on public.programmes (institution_id)
  where state = 'published';
create index if not exists source_records_verified_idx
  on public.source_records (id)
  where status = 'verified';
