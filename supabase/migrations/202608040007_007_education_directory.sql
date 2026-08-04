-- ScholarPath country intelligence and institution directory.

create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  slug text not null unique,
  name text not null unique,
  flag_emoji text not null,
  currency_code text not null,
  currency_symbol text not null,
  primary_language text not null,
  student_route_name text not null,
  visa_difficulty text not null check (visa_difficulty in ('lower','moderate','higher','variable')),
  visa_fee_amount numeric(12,2),
  visa_fee_currency text,
  proof_funds_amount numeric(12,2),
  proof_funds_currency text,
  proof_funds_period_months integer,
  work_hours_term integer,
  post_study_months integer,
  monthly_cost_low numeric(12,2),
  monthly_cost_high numeric(12,2),
  cost_currency text,
  summary text not null,
  healthcare_summary text not null,
  work_summary text not null,
  post_study_summary text not null,
  climate_summary text not null,
  community_summary text not null,
  visa_uncertainty text not null,
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  slug text not null,
  name text not null,
  is_major_student_city boolean not null default true,
  monthly_cost_low numeric(12,2),
  monthly_cost_high numeric(12,2),
  accommodation_low numeric(12,2),
  accommodation_high numeric(12,2),
  deposit_summary text,
  transport_summary text not null,
  safety_summary text not null,
  climate_summary text not null,
  community_summary text not null,
  source_id uuid references public.source_records(id),
  confidence smallint not null default 60 check (confidence between 0 and 100),
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_code,slug)
);

create table public.country_facts (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  category text not null check (category in ('visa','proof_funds','healthcare','work','post_study','transport','safety','climate','community','cost','housing','career')),
  fact_key text not null,
  label text not null,
  value jsonb not null,
  qualification text,
  source_id uuid references public.source_records(id),
  confidence smallint not null default 70 check (confidence between 0 and 100),
  effective_from date,
  effective_to date,
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_code,fact_key)
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  official_name text not null,
  short_name text,
  institution_type text not null check (institution_type in ('university','university_of_applied_sciences','college','pathway_provider','consortium')),
  country_code text not null references public.countries(code),
  city_id uuid references public.cities(id),
  website_url text not null,
  admissions_url text,
  logo_url text,
  public_private text check (public_private in ('public','private','mixed','unknown')),
  degree_awarding boolean not null default true,
  international_sponsor_status text,
  summary text not null,
  state public.record_state not null default 'draft',
  source_id uuid references public.source_records(id),
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  city_id uuid references public.cities(id),
  address text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_main boolean not null default false,
  source_id uuid references public.source_records(id),
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id,name)
);

create table public.institution_rankings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  publisher text not null,
  ranking_name text not null,
  edition_year integer not null check (edition_year between 2000 and 2100),
  subject text,
  rank_min integer check (rank_min > 0),
  rank_max integer check (rank_max is null or rank_max >= rank_min),
  rank_label text not null,
  score numeric(8,3),
  methodology_url text,
  source_id uuid references public.source_records(id),
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  unique(institution_id,publisher,ranking_name,edition_year,subject)
);

create table public.qualification_equivalencies (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  origin_country public.profile_country not null,
  study_level text not null,
  qualification_pattern text not null,
  minimum_result text,
  evaluation_state text not null check (evaluation_state in ('published_threshold','case_by_case','external_evaluation','unverified')),
  notes text not null,
  source_id uuid references public.source_records(id),
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id,origin_country,study_level,qualification_pattern)
);

create table public.institution_requirements (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  requirement_type text not null check (requirement_type in ('academic','english','identity','financial','reference','statement','portfolio','credential_evaluation','visa','other')),
  label text not null,
  description text not null,
  required boolean not null default true,
  origin_country public.profile_country,
  study_level text,
  source_id uuid references public.source_records(id),
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programme_intakes (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  intake_label text not null,
  starts_on date,
  application_opens_at timestamptz,
  application_deadline_at timestamptz,
  international_deadline_at timestamptz,
  timezone text,
  capacity_state text not null default 'unknown' check (capacity_state in ('open','limited','closed','unknown')),
  source_id uuid references public.source_records(id),
  state public.record_state not null default 'draft',
  last_verified_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(programme_id,intake_label)
);

alter table public.programmes add column if not exists institution_id uuid references public.institutions(id);

create index countries_state_idx on public.countries(state,name);
create index cities_country_idx on public.cities(country_code,state,name);
create index country_facts_country_category_idx on public.country_facts(country_code,category,state);
create index institutions_country_type_idx on public.institutions(country_code,institution_type,state);
create index institution_rankings_latest_idx on public.institution_rankings(institution_id,edition_year desc);
create index qualification_equivalencies_lookup_idx on public.qualification_equivalencies(institution_id,origin_country,study_level,state);
create index institution_requirements_lookup_idx on public.institution_requirements(institution_id,origin_country,study_level,state);
create index programme_intakes_lookup_idx on public.programme_intakes(programme_id,starts_on,state);
create index programmes_institution_idx on public.programmes(institution_id);

alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.country_facts enable row level security;
alter table public.institutions enable row level security;
alter table public.campuses enable row level security;
alter table public.institution_rankings enable row level security;
alter table public.qualification_equivalencies enable row level security;
alter table public.institution_requirements enable row level security;
alter table public.programme_intakes enable row level security;

create policy "published countries readable" on public.countries for select using (state='published' or public.is_staff());
create policy "published cities readable" on public.cities for select using (state='published' or public.is_staff());
create policy "published country facts readable" on public.country_facts for select using (state='published' or public.is_staff());
create policy "published institutions readable" on public.institutions for select using (state='published' or public.is_staff());
create policy "published campuses readable" on public.campuses for select using (state='published' or public.is_staff());
create policy "published rankings readable" on public.institution_rankings for select using (state='published' or public.is_staff());
create policy "published equivalencies readable" on public.qualification_equivalencies for select using (state='published' or public.is_staff());
create policy "published institution requirements readable" on public.institution_requirements for select using (state='published' or public.is_staff());
create policy "published programme intakes readable" on public.programme_intakes for select using (state='published' or public.is_staff());

create policy "research manages countries" on public.countries for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages cities" on public.cities for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages country facts" on public.country_facts for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages institutions" on public.institutions for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages campuses" on public.campuses for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages rankings" on public.institution_rankings for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages equivalencies" on public.qualification_equivalencies for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages institution requirements" on public.institution_requirements for all using ((select public.can_research_write())) with check ((select public.can_research_write()));
create policy "research manages programme intakes" on public.programme_intakes for all using ((select public.can_research_write())) with check ((select public.can_research_write()));

do $$
declare table_name text;
begin
  foreach table_name in array array['countries','cities','country_facts','institutions','qualification_equivalencies','institution_requirements','programme_intakes'] loop
    execute format('create trigger %I_touch_updated before update on public.%I for each row execute function public.touch_updated_at()',table_name,table_name);
  end loop;
end $$;

