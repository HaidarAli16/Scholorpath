-- Migration 013: Structured candidate fields and scoring
-- Adds validation helpers and a structured_score to opportunity_candidates
-- so the eligibility engine can use candidate data and the admin UI can
-- prioritise high-quality review items.

-- ── Structured score function ────────────────────────────────────────────────
-- Scores a normalized_data JSONB blob 0–100 based on how many required
-- fields are present and have non-empty values.
create or replace function public.candidate_structured_score(p_data jsonb, p_entity_type text)
returns smallint
language sql
immutable
parallel safe
set search_path = ''
as $$
select (
  -- Common fields (50 points)
  (case when length(trim(coalesce(p_data->>'title',''))) > 0        then 10 else 0 end) +
  (case when length(trim(coalesce(p_data->>'provider_name',''))) > 0 then 10 else 0 end) +
  (case when length(trim(coalesce(p_data->>'country_code',''))) > 0  then  5 else 0 end) +
  (case when length(trim(coalesce(p_data->>'application_url',''))) > 0 then 10 else 0 end) +
  (case when length(trim(coalesce(p_data->>'deadline_text',''))) > 0  then 10 else 0 end) +
  (case when p_data->>'deadline_date' is not null                     then  5 else 0 end) +
  -- Scholarship-specific fields (30 points when applicable)
  (case when p_entity_type = 'scholarship' then
    (case when length(trim(coalesce(p_data->>'funding_type',''))) > 0        then 10 else 0 end) +
    (case when p_data->'eligibility_origin_countries' is not null            then 10 else 0 end) +
    (case when length(trim(coalesce(p_data->>'award_value_text',''))) > 0    then 10 else 0 end)
  else 0 end) +
  -- Programme-specific fields (30 points when applicable)
  (case when p_entity_type = 'programme' then
    (case when length(trim(coalesce(p_data->>'degree_level',''))) > 0  then 10 else 0 end) +
    (case when length(trim(coalesce(p_data->>'field_family',''))) > 0  then 10 else 0 end) +
    (case when p_data->>'tuition_amount' is not null                   then 10 else 0 end)
  else 0 end) +
  -- Source quality bonus (20 points)
  (case when p_data->>'opens_at' is not null       then  5 else 0 end) +
  (case when p_data->>'cycle_label' is not null     then  5 else 0 end) +
  (case when length(trim(coalesce(p_data->>'award_type',''))) > 0 then 5 else 0 end) +
  (case when (p_data->'eligibility_origin_countries') is not null
             and jsonb_array_length(coalesce(p_data->'eligibility_origin_countries','[]'::jsonb)) > 0 then 5 else 0 end)
)::smallint
$$;

-- ── Add structured_score as generated column ─────────────────────────────────
alter table public.opportunity_candidates
  add column if not exists structured_score smallint
    generated always as (
      public.candidate_structured_score(normalized_data, entity_type)
    ) stored;

-- ── Validation function ───────────────────────────────────────────────────────
-- Returns a list of validation error codes for a candidate's normalized_data.
-- Used by the publish function to gate publication.
create or replace function public.validate_candidate_for_publish(p_candidate_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.opportunity_candidates%rowtype;
  errors text[] := '{}';
begin
  select * into c from public.opportunity_candidates where id = p_candidate_id;
  if not found then return array['candidate_not_found']; end if;
  if c.review_state not in ('approved') then
    errors := errors || 'review_state_not_approved';
  end if;
  if length(trim(coalesce(c.normalized_data->>'title',''))) < 2 then
    errors := errors || 'missing_title';
  end if;
  if length(trim(coalesce(c.normalized_data->>'provider_name',''))) < 2 then
    errors := errors || 'missing_provider_name';
  end if;
  if length(trim(coalesce(c.normalized_data->>'application_url',''))) < 10 then
    errors := errors || 'missing_application_url';
  end if;
  -- Scholarship-specific
  if c.entity_type = 'scholarship' then
    if length(trim(coalesce(c.normalized_data->>'funding_type',''))) = 0 then
      errors := errors || 'scholarship_missing_funding_type';
    end if;
  end if;
  -- Programme-specific
  if c.entity_type = 'programme' then
    if length(trim(coalesce(c.normalized_data->>'degree_level',''))) = 0 then
      errors := errors || 'programme_missing_degree_level';
    end if;
    if length(trim(coalesce(c.normalized_data->>'field_family',''))) = 0 then
      errors := errors || 'programme_missing_field_family';
    end if;
  end if;
  return errors;
end;
$$;

-- ── Index for admin review queue ordering by score ───────────────────────────
create index if not exists opportunity_candidates_review_score_idx
  on public.opportunity_candidates (review_state, structured_score desc, created_at)
  where review_state in ('pending', 'approved');

revoke all on function public.candidate_structured_score(jsonb, text) from public, anon;
revoke all on function public.validate_candidate_for_publish(uuid) from public, anon;
grant execute on function public.validate_candidate_for_publish(uuid) to authenticated;
