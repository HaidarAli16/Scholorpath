-- Keep generated catalogue rules aligned with the assessment vocabulary.
-- Destination preference is a ranking signal, not an eligibility requirement.

delete from public.atomic_rules
where rule_key in ('destination_info', 'english_info', 'universal_english');

update public.atomic_rules
set profile_field = 'normalizedGrade', updated_at = now()
where rule_key = 'gks_gpa' and profile_field = 'gradeValue';

update public.atomic_rules
set profile_field = 'qualificationLevel',
    expected_value = case
      when expected_value::text ilike '%phd%' then '["masters","doctoral"]'::jsonb
      when expected_value::text ilike '%bachelor%' then '["bachelors","masters","professional","doctoral"]'::jsonb
      else expected_value
    end,
    updated_at = now()
where rule_key = 'qualification_req';

update public.atomic_rules
set profile_field = 'fieldFamilyToken', updated_at = now()
where rule_key = 'field_req';

create or replace function public.generate_rules_for_published_entity(
  p_entity_type text,
  p_entity_id uuid,
  p_normalized_data jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_countries jsonb := p_normalized_data->'eligibility_origin_countries';
  v_degree text := lower(coalesce(p_normalized_data->>'degree_level', ''));
  v_funding text := lower(coalesce(p_normalized_data->>'funding_type', ''));
  v_field text := lower(coalesce(p_normalized_data->>'field_family', ''));
  v_expected jsonb;
  v_explanation text;
begin
  if v_countries is not null and jsonb_typeof(v_countries) = 'array' and jsonb_array_length(v_countries) > 0 then
    insert into public.atomic_rules (
      entity_type, entity_id, rule_key, rule_group, operator, profile_field,
      expected_value, severity, explanation, state, version
    ) values (
      p_entity_type, p_entity_id, 'nationality_req', 'nationality', 'in', 'nationality',
      v_countries, 'hard', 'Your nationality must be listed by the official opportunity.', 'published', 1
    ) on conflict (entity_type, entity_id, rule_key, version) do update set
      profile_field = excluded.profile_field,
      expected_value = excluded.expected_value,
      severity = excluded.severity,
      explanation = excluded.explanation,
      state = 'published',
      updated_at = now();
  end if;

  if v_degree in ('masters', 'master') then
    v_expected := '["bachelors","masters","professional","doctoral"]'::jsonb;
    v_explanation := 'A completed bachelor-level qualification is required for this master route.';
  elsif v_degree in ('phd', 'doctoral', 'doctorate') then
    v_expected := '["masters","doctoral"]'::jsonb;
    v_explanation := 'A completed master-level qualification is required for this doctoral route.';
  elsif v_degree in ('bachelors', 'bachelor', 'undergraduate') then
    v_expected := '["secondary","bachelors","professional","masters","doctoral"]'::jsonb;
    v_explanation := 'A qualifying secondary-school credential is required for this bachelor route.';
  end if;

  if v_expected is not null then
    insert into public.atomic_rules (
      entity_type, entity_id, rule_key, rule_group, operator, profile_field,
      expected_value, severity, explanation, state, version
    ) values (
      p_entity_type, p_entity_id, 'qualification_req', 'academic', 'in', 'qualificationLevel',
      v_expected, 'hard', v_explanation, 'published', 1
    ) on conflict (entity_type, entity_id, rule_key, version) do update set
      profile_field = excluded.profile_field,
      expected_value = excluded.expected_value,
      severity = excluded.severity,
      explanation = excluded.explanation,
      state = 'published',
      updated_at = now();
  end if;

  if v_funding in ('full', 'full_award', 'fully_funded') then
    insert into public.atomic_rules (
      entity_type, entity_id, rule_key, rule_group, operator, profile_field,
      expected_value, severity, explanation, state, version
    ) values (
      p_entity_type, p_entity_id, 'funding_fit', 'financial', 'in', 'fundingNeed',
      '["full","major","partial","self"]'::jsonb, 'information',
      'The official source describes this as a full-funding route.', 'published', 1
    ) on conflict (entity_type, entity_id, rule_key, version) do update set
      profile_field = excluded.profile_field,
      expected_value = excluded.expected_value,
      severity = excluded.severity,
      explanation = excluded.explanation,
      state = 'published',
      updated_at = now();
  end if;

  if v_field <> '' and v_field <> 'general' then
    insert into public.atomic_rules (
      entity_type, entity_id, rule_key, rule_group, operator, profile_field,
      expected_value, severity, explanation, state, version
    ) values (
      p_entity_type, p_entity_id, 'field_req', 'academic', 'in', 'fieldFamilyToken',
      jsonb_build_array(v_field), 'soft', 'Your declared subject should align with the published field.', 'published', 1
    ) on conflict (entity_type, entity_id, rule_key, version) do update set
      profile_field = excluded.profile_field,
      expected_value = excluded.expected_value,
      severity = excluded.severity,
      explanation = excluded.explanation,
      state = 'published',
      updated_at = now();
  end if;
end;
$$;

revoke all on function public.generate_rules_for_published_entity(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.generate_rules_for_published_entity(text, uuid, jsonb) to service_role;

