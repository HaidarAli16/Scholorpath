-- Migration 014: publish_opportunity_candidate function
-- Moves an approved candidate into the live scholarships or programmes table.
-- This is the missing link in the review→publish pipeline.
-- Only a research reviewer or admin may call this function.

create or replace function public.publish_opportunity_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid              uuid := (select auth.uid());
  c                public.opportunity_candidates%rowtype;
  validation_errs  text[];
  v_slug           text;
  v_scholarship_id uuid;
  v_programme_id   uuid;
  v_award_value    jsonb;
  v_attributes     jsonb;
  v_deadline_at    timestamptz;
  v_opens_at       timestamptz;
begin
  -- ── Auth check ──────────────────────────────────────────────────────────────
  if uid is null or not public.can_research_review() then
    raise exception 'reviewer role required' using errcode = '42501';
  end if;

  -- ── Load and lock candidate ──────────────────────────────────────────────────
  select * into c
  from public.opportunity_candidates
  where id = p_candidate_id
  for update;

  if not found then
    raise exception 'candidate not found' using errcode = 'P0002';
  end if;

  -- ── Validate ────────────────────────────────────────────────────────────────
  select public.validate_candidate_for_publish(p_candidate_id) into validation_errs;
  if array_length(validation_errs, 1) > 0 then
    raise exception 'candidate failed publish validation: %', array_to_string(validation_errs, ', ')
      using errcode = '23514';
  end if;

  -- ── Parse common fields ──────────────────────────────────────────────────────
  -- Try to parse deadline_date if present, fall back to null
  begin
    v_deadline_at := (c.normalized_data->>'deadline_date')::timestamptz;
  exception when others then
    v_deadline_at := null;
  end;

  begin
    v_opens_at := (c.normalized_data->>'opens_at')::timestamptz;
  exception when others then
    v_opens_at := null;
  end;

  -- Build the attributes blob with all extra normalized_data fields
  v_attributes := c.normalized_data
    - 'title'
    - 'provider_name'
    - 'country_code'
    - 'application_url'
    - 'deadline_date'
    - 'deadline_text'
    - 'opens_at'
    - 'cycle_label'
    - 'award_type'
    - 'award_value_text'
    - 'funding_type'
    - 'degree_level'
    - 'field_family'
    - 'tuition_amount'
    - 'tuition_currency'
    - 'eligibility_origin_countries'
    || jsonb_build_object(
        'deadline_text', c.normalized_data->>'deadline_text',
        'eligibility_origin_countries', c.normalized_data->'eligibility_origin_countries',
        'ingested_from_candidate', c.id,
        'ingestion_run_id', c.run_id
      );

  -- ── Publish by entity type ───────────────────────────────────────────────────
  if c.entity_type = 'scholarship' then
    -- Build award_value JSONB
    v_award_value := jsonb_build_object(
      'text', coalesce(c.normalized_data->>'award_value_text', 'See official source'),
      'funding_type', coalesce(c.normalized_data->>'funding_type', 'unclassified')
    );

    -- Generate a URL-safe slug
    v_slug := lower(regexp_replace(
      coalesce(c.normalized_data->>'title', c.title),
      '[^a-z0-9]+', '-', 'g'
    ));
    v_slug := trim(both '-' from v_slug);
    v_slug := left(v_slug, 90);
    -- Make it unique: append first 8 chars of candidate id
    v_slug := v_slug || '-' || left(c.id::text, 8);

    insert into public.scholarships (
      slug,
      provider_name,
      title,
      country_code,
      cycle_label,
      opens_at,
      deadline_at,
      deadline_timezone,
      award_type,
      award_value,
      application_url,
      state,
      source_id,
      last_verified_at,
      next_review_at,
      attributes
    )
    values (
      v_slug,
      coalesce(c.normalized_data->>'provider_name', c.provider_name),
      coalesce(c.normalized_data->>'title', c.title),
      coalesce(c.normalized_data->>'country_code', c.country_code),
      c.normalized_data->>'cycle_label',
      v_opens_at,
      v_deadline_at,
      c.normalized_data->>'deadline_timezone',
      coalesce(c.normalized_data->>'award_type', 'scholarship'),
      v_award_value,
      c.normalized_data->>'application_url',
      'published',
      c.source_id,
      now(),
      now() + interval '90 days',
      v_attributes
    )
    on conflict (slug) do update
    set
      provider_name    = excluded.provider_name,
      title            = excluded.title,
      country_code     = excluded.country_code,
      cycle_label      = excluded.cycle_label,
      opens_at         = excluded.opens_at,
      deadline_at      = excluded.deadline_at,
      award_type       = excluded.award_type,
      award_value      = excluded.award_value,
      application_url  = excluded.application_url,
      state            = 'published',
      source_id        = excluded.source_id,
      last_verified_at = now(),
      next_review_at   = now() + interval '90 days',
      attributes       = excluded.attributes,
      updated_at       = now()
    returning id into v_scholarship_id;

    -- Link candidate back to the published scholarship
    update public.opportunity_candidates
    set matched_scholarship_id = v_scholarship_id
    where id = c.id;

  elsif c.entity_type = 'programme' then
    v_slug := lower(regexp_replace(
      coalesce(c.normalized_data->>'title', c.title),
      '[^a-z0-9]+', '-', 'g'
    ));
    v_slug := trim(both '-' from v_slug);
    v_slug := left(v_slug, 90);
    v_slug := v_slug || '-' || left(c.id::text, 8);

    insert into public.programmes (
      slug,
      institution_name,
      title,
      country_code,
      level,
      field_family,
      intake_label,
      deadline_at,
      deadline_timezone,
      tuition_amount,
      tuition_currency,
      application_url,
      state,
      source_id,
      last_verified_at,
      next_review_at,
      attributes
    )
    values (
      v_slug,
      coalesce(c.normalized_data->>'provider_name', c.provider_name),
      coalesce(c.normalized_data->>'title', c.title),
      coalesce(c.normalized_data->>'country_code', c.country_code, 'XX'),
      coalesce(c.normalized_data->>'degree_level', 'masters'),
      coalesce(c.normalized_data->>'field_family', 'general'),
      c.normalized_data->>'cycle_label',
      v_deadline_at,
      c.normalized_data->>'deadline_timezone',
      (c.normalized_data->>'tuition_amount')::numeric,
      coalesce(c.normalized_data->>'tuition_currency', 'USD'),
      c.normalized_data->>'application_url',
      'published',
      c.source_id,
      now(),
      now() + interval '90 days',
      v_attributes
    )
    on conflict (slug) do update
    set
      institution_name = excluded.institution_name,
      title            = excluded.title,
      country_code     = excluded.country_code,
      level            = excluded.level,
      field_family     = excluded.field_family,
      deadline_at      = excluded.deadline_at,
      application_url  = excluded.application_url,
      state            = 'published',
      source_id        = excluded.source_id,
      last_verified_at = now(),
      next_review_at   = now() + interval '90 days',
      attributes       = excluded.attributes,
      updated_at       = now()
    returning id into v_programme_id;

    update public.opportunity_candidates
    set matched_programme_id = v_programme_id
    where id = c.id;
  end if;

  -- ── Mark candidate as published ──────────────────────────────────────────────
  update public.opportunity_candidates
  set
    review_state = 'published',
    reviewed_by  = uid,
    reviewed_at  = now(),
    published_at = now(),
    review_notes = coalesce(review_notes, 'Published to live catalogue by reviewer.')
  where id = c.id;

  -- ── Audit ────────────────────────────────────────────────────────────────────
  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, after_data)
  values (
    uid,
    'ingestion_candidate_published',
    'opportunity_candidate',
    c.id,
    jsonb_build_object(
      'entity_type', c.entity_type,
      'scholarship_id', v_scholarship_id,
      'programme_id', v_programme_id,
      'title', c.title,
      'source_id', c.source_id
    )
  );

  return jsonb_build_object(
    'published', true,
    'entity_type', c.entity_type,
    'scholarship_id', v_scholarship_id,
    'programme_id', v_programme_id,
    'slug', v_slug
  );
end;
$$;

revoke all on function public.publish_opportunity_candidate(uuid) from public, anon;
grant execute on function public.publish_opportunity_candidate(uuid) to authenticated;
