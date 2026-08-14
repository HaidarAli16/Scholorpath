-- Task 1a. Add publish_tier column to scholarships and programmes
ALTER TABLE public.scholarships ADD COLUMN IF NOT EXISTS publish_tier text NOT NULL DEFAULT 'verified' CHECK (publish_tier IN ('verified', 'provisional', 'manual'));
ALTER TABLE public.programmes ADD COLUMN IF NOT EXISTS publish_tier text NOT NULL DEFAULT 'verified' CHECK (publish_tier IN ('verified', 'provisional', 'manual'));

ALTER TABLE public.opportunity_candidates
  DROP CONSTRAINT IF EXISTS opportunity_candidates_automation_decision_check;

ALTER TABLE public.opportunity_candidates
  ADD CONSTRAINT opportunity_candidates_automation_decision_check
  CHECK (automation_decision IS NULL OR automation_decision IN (
    'auto_published', 'auto_published_provisional', 'human_review', 'duplicate'
  ));

-- Update publish_opportunity_candidate to support p_publish_tier
DROP FUNCTION IF EXISTS public.publish_opportunity_candidate(uuid);
CREATE OR REPLACE FUNCTION public.publish_opportunity_candidate(
  p_candidate_id uuid,
  p_publish_tier text default 'verified'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid              uuid := (select auth.uid());
  v_role           text := coalesce((select auth.jwt()->>'role'), '');
  c                public.opportunity_candidates%rowtype;
  validation_errs  text[];
  v_slug           text;
  v_scholarship_id uuid;
  v_programme_id   uuid;
  v_award_value    jsonb;
  v_attributes     jsonb;
  v_deadline_at    timestamptz;
  v_opens_at       timestamptz;
BEGIN
  -- ── Auth check ──────────────────────────────────────────────────────────────
  if (uid is null or not public.can_research_review()) and v_role <> 'service_role' then
    raise exception 'reviewer or service role required' using errcode = '42501';
  end if;

  if p_publish_tier not in ('verified', 'provisional', 'manual') then
    raise exception 'invalid publish tier' using errcode = '22023';
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
  -- Only fully validate if verified tier
  if p_publish_tier = 'verified' then
    select public.validate_candidate_for_publish(p_candidate_id) into validation_errs;
    if array_length(validation_errs, 1) > 0 then
      raise exception 'candidate failed publish validation: %', array_to_string(validation_errs, ', ')
        using errcode = '23514';
    end if;
  end if;

  -- ── Parse common fields ──────────────────────────────────────────────────────
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

  v_attributes := c.normalized_data
    - 'title' - 'provider_name' - 'country_code' - 'application_url'
    - 'deadline_date' - 'deadline_text' - 'opens_at' - 'cycle_label'
    - 'award_type' - 'award_value_text' - 'funding_type' - 'degree_level'
    - 'field_family' - 'tuition_amount' - 'tuition_currency' - 'eligibility_origin_countries'
    || jsonb_build_object(
        'deadline_text', coalesce(c.normalized_data->>'deadline_text', case when p_publish_tier = 'provisional' then 'See official source' else null end),
        'eligibility_origin_countries', c.normalized_data->'eligibility_origin_countries',
        'ingested_from_candidate', c.id,
        'ingestion_run_id', c.run_id
      );

  if p_publish_tier = 'provisional' then
    v_attributes := v_attributes || jsonb_build_object(
      'publish_tier', 'provisional',
      'data_completeness', 'partial',
      'disclaimer', 'Some details require verification from the official source.'
    );
  end if;

  -- ── Publish by entity type ───────────────────────────────────────────────────
  if c.entity_type = 'scholarship' then
    v_award_value := jsonb_build_object(
      'text', coalesce(c.normalized_data->>'award_value_text', case when p_publish_tier = 'provisional' then 'See official source' else 'See official source' end),
      'funding_type', coalesce(nullif(c.normalized_data->>'funding_type', ''), case when p_publish_tier = 'provisional' then 'unclassified' else 'unclassified' end)
    );

    v_slug := lower(regexp_replace(coalesce(c.normalized_data->>'title', c.title), '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    v_slug := left(v_slug, 90) || '-' || left(c.id::text, 8);

    insert into public.scholarships (
      slug, provider_name, title, country_code, cycle_label, opens_at,
      deadline_at, deadline_timezone, award_type, award_value,
      application_url, state, source_id, last_verified_at, next_review_at, attributes, publish_tier
    ) values (
      v_slug, coalesce(c.normalized_data->>'provider_name', c.provider_name), coalesce(c.normalized_data->>'title', c.title), coalesce(c.normalized_data->>'country_code', c.country_code),
      c.normalized_data->>'cycle_label', v_opens_at, v_deadline_at, c.normalized_data->>'deadline_timezone',
      coalesce(c.normalized_data->>'award_type', 'scholarship'), v_award_value, c.normalized_data->>'application_url',
      'published', c.source_id, now(), now() + interval '90 days', v_attributes, p_publish_tier
    )
    on conflict (slug) do update set
      provider_name = excluded.provider_name, title = excluded.title, country_code = excluded.country_code,
      cycle_label = excluded.cycle_label, opens_at = excluded.opens_at, deadline_at = excluded.deadline_at,
      award_type = excluded.award_type, award_value = excluded.award_value, application_url = excluded.application_url,
      state = 'published', source_id = excluded.source_id, last_verified_at = now(), next_review_at = now() + interval '90 days',
      attributes = excluded.attributes, publish_tier = excluded.publish_tier, updated_at = now()
    returning id into v_scholarship_id;

    update public.opportunity_candidates set matched_scholarship_id = v_scholarship_id where id = c.id;
    perform public.generate_rules_for_published_entity('scholarship', v_scholarship_id, c.normalized_data);

  elsif c.entity_type = 'programme' then
    v_slug := lower(regexp_replace(coalesce(c.normalized_data->>'title', c.title), '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    v_slug := left(v_slug, 90) || '-' || left(c.id::text, 8);

    insert into public.programmes (
      slug, institution_name, title, country_code, level, field_family, intake_label,
      deadline_at, deadline_timezone, tuition_amount, tuition_currency, application_url,
      state, source_id, last_verified_at, next_review_at, attributes, publish_tier
    ) values (
      v_slug, coalesce(c.normalized_data->>'provider_name', c.provider_name), coalesce(c.normalized_data->>'title', c.title),
      coalesce(c.normalized_data->>'country_code', c.country_code, 'XX'), coalesce(c.normalized_data->>'degree_level', 'masters'),
      coalesce(c.normalized_data->>'field_family', 'general'), c.normalized_data->>'cycle_label', v_deadline_at,
      c.normalized_data->>'deadline_timezone', (c.normalized_data->>'tuition_amount')::numeric,
      coalesce(c.normalized_data->>'tuition_currency', 'USD'), c.normalized_data->>'application_url',
      'published', c.source_id, now(), now() + interval '90 days', v_attributes, p_publish_tier
    )
    on conflict (slug) do update set
      institution_name = excluded.institution_name, title = excluded.title, country_code = excluded.country_code,
      level = excluded.level, field_family = excluded.field_family, deadline_at = excluded.deadline_at,
      application_url = excluded.application_url, state = 'published', source_id = excluded.source_id,
      last_verified_at = now(), next_review_at = now() + interval '90 days', attributes = excluded.attributes,
      publish_tier = excluded.publish_tier, updated_at = now()
    returning id into v_programme_id;

    update public.opportunity_candidates set matched_programme_id = v_programme_id where id = c.id;
    perform public.generate_rules_for_published_entity('programme', v_programme_id, c.normalized_data);
  end if;

  update public.opportunity_candidates
  set review_state = 'published', reviewed_by = coalesce(uid, reviewed_by), reviewed_at = now(), published_at = now(),
      review_notes = case when p_publish_tier = 'provisional' then 'Auto-published to provisional tier.' else coalesce(review_notes, 'Published to live catalogue by reviewer.') end
  where id = c.id;

  insert into public.audit_events (actor_user_id, action, entity_type, entity_id, after_data)
  values (uid, case when p_publish_tier = 'provisional' then 'ingestion_candidate_auto_published_provisional' else 'ingestion_candidate_published' end, 'opportunity_candidate', c.id,
    jsonb_build_object('entity_type', c.entity_type, 'scholarship_id', v_scholarship_id, 'programme_id', v_programme_id, 'title', c.title, 'source_id', c.source_id, 'publish_tier', p_publish_tier));

  return jsonb_build_object('published', true, 'entity_type', c.entity_type, 'scholarship_id', v_scholarship_id, 'programme_id', v_programme_id, 'slug', v_slug, 'publish_tier', p_publish_tier);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_opportunity_candidate(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_opportunity_candidate(uuid, text) TO authenticated, service_role;

create or replace function public.auto_publish_high_confidence_scholarships(p_limit integer default 100)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c record;
  v_score integer;
  v_deadline timestamptz;
  v_available boolean;
  v_secure boolean;
  v_generic boolean;
  v_allowed_errors boolean;
  v_reused_existing boolean;
  v_published_verified integer := 0;
  v_published_provisional integer := 0;
  v_human integer := 0;
  v_duplicate integer := 0;
  v_now timestamptz := now();
  v_tier text;
  v_scholarship_id uuid;
begin
  if coalesce((select auth.jwt()->>'role'), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  for c in
    select
      oc.*,
      ia.adapter_key,
      ir.http_status,
      ir.robots_state,
      ir.status as run_status
    from public.opportunity_candidates oc
    join public.ingestion_sources ins on ins.source_id = oc.source_id
    join public.ingestion_adapters ia on ia.id = ins.adapter_id
    join public.ingestion_runs ir on ir.id = oc.run_id
    where oc.entity_type = 'scholarship'
      and oc.review_state = 'pending'
      and (oc.automation_decision is null or oc.automation_decision = 'human_review')
      and ia.adapter_key = 'discovered_official_scholarship'
    order by oc.structured_score desc, oc.created_at
    limit least(greatest(coalesce(p_limit, 100), 1), 500)
    for update of oc skip locked
  loop
    begin
      v_deadline := null;
      if coalesce(c.normalized_data->>'deadline_date', '') <> '' then
        v_deadline := (c.normalized_data->>'deadline_date')::timestamptz;
      end if;
    exception when others then
      v_deadline := null;
    end;

    v_secure := coalesce(c.normalized_data->>'application_url', '') like 'https://%';
    v_available := coalesce(c.normalized_data->>'application_state', '') = 'open'
      or coalesce((c.normalized_data->>'deadline_is_rolling')::boolean, false)
      or (v_deadline is not null and v_deadline >= v_now);
    v_generic := length(trim(c.title)) < 8
      or length(trim(c.title)) > 120
      or lower(trim(c.title)) ~ '^(home|our government|how to apply|application instructions?|scholarships?|funding|welcome|research opportunities)$';
    v_allowed_errors := not exists (
      select 1
      from jsonb_array_elements_text(coalesce(c.validation_errors, '[]'::jsonb)) error_code
      where error_code not in ('application_state_unresolved', 'deadline_unresolved')
    );

    v_score := least(100,
      coalesce(c.structured_score, 0)
      + 15
      + case when v_secure then 10 else 0 end
      + case when v_available then 10 else 0 end
      + case when not v_generic then 5 else 0 end
    );

    v_reused_existing := exists (
      select 1 from public.scholarships where application_url = c.normalized_data->>'application_url'
    );

    if v_reused_existing then
      update public.opportunity_candidates
      set automation_decision = 'duplicate',
          automation_score = v_score,
          auto_evaluated_at = v_now,
          review_state = 'published'
      where id = c.id;
      v_duplicate := v_duplicate + 1;
      continue;
    end if;

    -- Pass 1: Verified tier
    if v_score >= 80
      and v_secure
      and v_available
      and (v_deadline is null or v_deadline >= v_now)
      and not v_generic
      and coalesce(c.normalized_data->>'funding_type', '') <> ''
      and v_allowed_errors
      and coalesce(c.http_status, 0) >= 200 and coalesce(c.http_status, 0) < 300
      and coalesce(c.robots_state, '') = 'allowed'
      and coalesce(c.run_status, '') = 'needs_review'
    then
      v_tier := 'verified';
    -- Pass 2: Provisional tier
    elsif v_score >= 40
      and v_secure
      and (v_deadline is null or v_deadline >= v_now)
      and not v_generic
      and coalesce(c.http_status, 0) >= 200 and coalesce(c.http_status, 0) < 300
      and coalesce(c.robots_state, '') in ('allowed', 'unavailable')
      and coalesce(c.run_status, '') = 'needs_review'
    then
      v_tier := 'provisional';
    else
      v_tier := null;
    end if;

    if v_tier is null then
      update public.opportunity_candidates
      set automation_score = v_score,
          automation_decision = 'human_review',
          automation_reasons = to_jsonb(array_remove(array[
            case when v_score < 40 then 'score_below_40' end,
            case when not v_secure then 'insecure_application_url' end,
            case when v_deadline is not null and v_deadline < v_now then 'deadline_expired' end,
            case when v_generic then 'generic_or_unusable_title' end
          ]::text[], null)),
          auto_evaluated_at = v_now
      where id = c.id;
      v_human := v_human + 1;
      continue;
    end if;

    if v_tier = 'verified' then
      update public.opportunity_candidates
      set automation_score = v_score,
          automation_decision = 'auto_published',
          automation_reasons = jsonb_build_array('official_exact_host','https','current_availability_signal','funding_resolved','quality_score_passed'),
          auto_evaluated_at = v_now,
          review_state = 'approved'
      where id = c.id;
      perform public.publish_opportunity_candidate(c.id, 'verified');
      v_published_verified := v_published_verified + 1;
    else
      update public.opportunity_candidates
      set automation_score = v_score,
          automation_decision = 'auto_published_provisional',
          automation_reasons = jsonb_build_array('official_exact_host','provisional_publish_incomplete_data'),
          auto_evaluated_at = v_now,
          review_state = 'approved'
      where id = c.id;
      perform public.publish_opportunity_candidate(c.id, 'provisional');
      v_published_provisional := v_published_provisional + 1;
    end if;

  end loop;

  return jsonb_build_object('published_verified', v_published_verified, 'published_provisional', v_published_provisional, 'human_review', v_human, 'duplicates_reused', v_duplicate);
end;
$$;

-- Reset automation_decision for previously held candidates so they get re-evaluated
UPDATE public.opportunity_candidates 
SET automation_decision = NULL 
WHERE automation_decision = 'human_review'
  AND review_state = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.ingestion_sources ins
    JOIN public.ingestion_adapters ia ON ia.id = ins.adapter_id
    WHERE ins.source_id = opportunity_candidates.source_id
      AND ia.adapter_key = 'discovered_official_scholarship'
  );
