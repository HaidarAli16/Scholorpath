-- Remove indexes superseded by existing composite/unique indexes. Keeping the
-- useful route-specific indexes avoids unnecessary write amplification.
drop index if exists public.tasks_user_due_active_idx;
drop index if exists public.notifications_user_unread_idx;
drop index if exists public.countries_published_name_idx;
drop index if exists public.cities_published_country_name_idx;
drop index if exists public.country_facts_published_country_category_idx;
drop index if exists public.campuses_published_institution_idx;
drop index if exists public.institution_rankings_published_institution_year_idx;
drop index if exists public.qualification_equivalencies_published_institution_origin_idx;
drop index if exists public.institution_requirements_published_institution_origin_idx;
drop index if exists public.programmes_published_institution_idx;
drop index if exists public.source_records_verified_idx;
