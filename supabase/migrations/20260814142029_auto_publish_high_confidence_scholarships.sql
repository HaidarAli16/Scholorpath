-- High-confidence official scholarship records publish automatically.
-- Weak, expired, generic, insecure or conflicting candidates remain visible in
-- the human-review queue with a deterministic explanation.

alter table public.opportunity_candidates
  add column if not exists automation_score smallint,
  add column if not exists automation_decision text,
  add column if not exists automation_reasons jsonb not null default '[]'::jsonb,
  add column if not exists auto_evaluated_at timestamptz;

alter table public.opportunity_candidates
  drop constraint if exists opportunity_candidates_automation_decision_check;

alter table public.opportunity_candidates
  add constraint opportunity_candidates_automation_decision_check
  check (automation_decision is null or automation_decision in ('auto_published','human_review','duplicate'));

create index if not exists opportunity_candidates_automation_queue_idx
  on public.opportunity_candidates (automation_decision, automation_score desc, created_at)
  where review_state = 'pending';

create unique index if not exists scholarships_application_url_unique_idx
  on public.scholarships (application_url)
  where application_url is not null;

create or replace function public.auto_publish_high_confidence_scholarships(p_limit integer default 50)
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
  v_country text;
  v_provider text;
  v_slug text;
  v_scholarship_id uuid;
  v_reused_existing boolean;
  v_published integer := 0;
  v_human integer := 0;
  v_duplicate integer := 0;
  v_now timestamptz := now();
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
      and ia.adapter_key = 'discovered_official_scholarship'
    order by oc.structured_score desc, oc.created_at
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
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

    update public.opportunity_candidates
    set automation_score = v_score,
        automation_decision = 'human_review',
        automation_reasons = to_jsonb(array_remove(array[
          case when v_score < 80 then 'score_below_80' end,
          case when not v_secure then 'insecure_application_url' end,
          case when not v_available then 'no_current_open_or_future_deadline_signal' end,
          case when v_deadline is not null and v_deadline < v_now then 'deadline_expired' end,
          case when v_generic then 'generic_or_unusable_title' end,
          case when coalesce(c.normalized_data->>'funding_type', '') = '' then 'funding_not_resolved' end,
          case when not v_allowed_errors then 'blocking_validation_error' end
        ]::text[], null)),
        auto_evaluated_at = v_now
    where id = c.id;

    if v_score < 80
      or not v_secure
      or not v_available
      or (v_deadline is not null and v_deadline < v_now)
      or v_generic
      or coalesce(c.normalized_data->>'funding_type', '') = ''
      or not v_allowed_errors
      or coalesce(c.http_status, 0) < 200 or coalesce(c.http_status, 0) >= 300
      or coalesce(c.robots_state, '') <> 'allowed'
      or coalesce(c.run_status, '') <> 'needs_review'
    then
      v_human := v_human + 1;
      continue;
    end if;

    v_country := coalesce(
      nullif(c.normalized_data->>'country_code', ''),
      nullif(c.country_code, ''),
      case
        when c.canonical_url ~* '\.(ac\.uk|edu\.uk)(/|$)' then 'GB'
        when c.canonical_url ~* '\.(edu\.au)(/|$)' then 'AU'
        when c.canonical_url ~* '\.(ac\.jp)(/|$)' then 'JP'
        when c.canonical_url ~* '\.(ac\.nz)(/|$)' then 'NZ'
        when c.canonical_url ~* '\.(edu\.tr)(/|$)' then 'TR'
        when c.canonical_url ~* '\.(edu|gov)(/|$)' then 'US'
        else null
      end
    );

    v_provider := case
      when c.canonical_url ilike '%sbs.ox.ac.uk/%' then 'University of Oxford'
      when c.canonical_url ilike '%business-school.ed.ac.uk/%' then 'University of Edinburgh'
      when c.canonical_url ilike '%kochi-tech.ac.jp/%' then 'Kochi University of Technology'
      else coalesce(nullif(c.normalized_data->>'provider_name', ''), c.provider_name)
    end;

    v_scholarship_id := null;
    v_reused_existing := false;
    select id into v_scholarship_id
    from public.scholarships
    where application_url = c.normalized_data->>'application_url'
    limit 1;

    if v_scholarship_id is null then
      v_slug := left(trim(both '-' from lower(regexp_replace(c.title, '[^a-z0-9]+', '-', 'g'))), 90)
        || '-' || left(c.id::text, 8);

      insert into public.scholarships (
        slug, provider_name, title, country_code, cycle_label, opens_at,
        deadline_at, deadline_timezone, award_type, award_value,
        application_url, state, source_id, last_verified_at, next_review_at, attributes
      ) values (
        v_slug,
        v_provider,
        c.title,
        v_country,
        c.normalized_data->>'cycle_label',
        nullif(c.normalized_data->>'opens_at', '')::timestamptz,
        v_deadline,
        c.normalized_data->>'deadline_timezone',
        coalesce(nullif(c.normalized_data->>'award_type', ''), 'scholarship'),
        jsonb_build_object(
          'text', coalesce(nullif(c.normalized_data->>'award_value_text', ''), 'See official source'),
          'funding_type', c.normalized_data->>'funding_type'
        ),
        c.normalized_data->>'application_url',
        'published',
        c.source_id,
        v_now,
        v_now + interval '30 days',
        (c.normalized_data - 'title' - 'provider_name' - 'country_code' - 'application_url')
          || jsonb_build_object(
            'automated_publication', true,
            'automation_score', v_score,
            'deadline_confirmed', v_deadline is not null,
            'deadline_not_confirmed', v_deadline is null,
            'ingested_from_candidate', c.id,
            'ingestion_run_id', c.run_id
          )
      ) returning id into v_scholarship_id;
    else
      v_reused_existing := true;
      v_duplicate := v_duplicate + 1;
    end if;

    update public.source_records
    set status = 'verified',
        last_verified_at = v_now,
        next_review_at = v_now + interval '30 days',
        verification_notes = 'Automatically verified from an exact-host official page with deterministic publication gates.',
        updated_at = v_now
    where id = c.source_id;

    update public.opportunity_candidates
    set review_state = 'published',
        matched_scholarship_id = v_scholarship_id,
        reviewed_at = v_now,
        published_at = v_now,
        review_notes = 'Automatically published from a high-confidence official-source record.',
        automation_decision = case when v_reused_existing then 'duplicate' else 'auto_published' end,
        automation_reasons = jsonb_build_array('official_exact_host','https','current_availability_signal','funding_resolved','quality_score_passed'),
        updated_at = v_now
    where id = c.id;

    perform public.generate_rules_for_published_entity(
      'scholarship',
      v_scholarship_id,
      c.normalized_data || jsonb_build_object('country_code', v_country, 'provider_name', v_provider)
    );

    insert into public.audit_events (actor_user_id, action, entity_type, entity_id, after_data)
    values (null, 'ingestion_candidate_auto_published', 'opportunity_candidate', c.id,
      jsonb_build_object('scholarship_id', v_scholarship_id, 'automation_score', v_score, 'source_id', c.source_id));

    v_published := v_published + 1;
  end loop;

  return jsonb_build_object('published', v_published, 'human_review', v_human, 'duplicates_reused', v_duplicate);
end;
$$;

revoke all on function public.auto_publish_high_confidence_scholarships(integer) from public, anon, authenticated;
grant execute on function public.auto_publish_high_confidence_scholarships(integer) to service_role;
