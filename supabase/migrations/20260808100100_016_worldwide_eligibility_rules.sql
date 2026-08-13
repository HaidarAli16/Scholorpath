-- Migration 016: worldwide eligibility rules for existing scholarships

do $$
declare
  s record;
  v_countries jsonb;
begin
  set search_path = '';

  for s in (select id, title, attributes from public.scholarships where state = 'published') loop
    
    -- 1. Nationality rules based on eligibility_origin_countries
    v_countries := s.attributes->'eligibility_origin_countries';
    if v_countries is not null and jsonb_array_length(v_countries) > 0 then
      insert into public.atomic_rules (
        entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
      ) values (
        'scholarship', s.id, 'nationality_req', 'nationality', 'in', 'nationality', v_countries, 'hard', 'Requires nationality from eligible countries', 'published', 1
      ) on conflict (entity_type, entity_id, rule_key, version) do nothing;
    end if;

    -- 2. Specific scholarship patterns
    if s.title ilike '%Chevening%' then
      insert into public.atomic_rules (
        entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
      ) values (
        'scholarship', s.id, 'chevening_experience', 'academic', 'in', 'experienceRange', '["one_to_two","three_plus"]'::jsonb, 'hard', 'Requires 2 years work experience', 'published', 1
      ) on conflict (entity_type, entity_id, rule_key, version) do nothing;
    elsif s.title ilike '%Fulbright%' then
      insert into public.atomic_rules (
        entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
      ) values (
        'scholarship', s.id, 'fulbright_english', 'logistics', 'eq', 'englishStatus', '"completed"'::jsonb, 'hard', 'English proficiency required', 'published', 1
      ) on conflict (entity_type, entity_id, rule_key, version) do nothing;
    elsif s.title ilike '%DAAD%' then
      insert into public.atomic_rules (
        entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
      ) values (
        'scholarship', s.id, 'daad_experience', 'academic', 'in', 'experienceRange', '["one_to_two","three_plus"]'::jsonb, 'soft', 'Work experience often required', 'published', 1
      ) on conflict (entity_type, entity_id, rule_key, version) do nothing;
    elsif s.title ilike '%GKS%' or s.title ilike '%Global Korea Scholarship%' then
      insert into public.atomic_rules (
        entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
      ) values (
        'scholarship', s.id, 'gks_gpa', 'academic', 'gte', 'gradeValue', '80'::jsonb, 'soft', 'Requires high GPA (80% or equivalent)', 'published', 1
      ) on conflict (entity_type, entity_id, rule_key, version) do nothing;
    elsif s.title ilike '%Türkiye Bursları%' or s.title ilike '%Turkiye Burslari%' then
      insert into public.atomic_rules (
        entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
      ) values (
        'scholarship', s.id, 'turkiye_completion', 'academic', 'in', 'completionStatus', '["completed","final_year"]'::jsonb, 'soft', 'Must have completed or be in final year', 'published', 1
      ) on conflict (entity_type, entity_id, rule_key, version) do nothing;
    end if;

    -- 3. Universal english-evidence rule
    insert into public.atomic_rules (
      entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version
    ) values (
      'scholarship', s.id, 'universal_english', 'logistics', 'eq', 'englishStatus', '"completed"'::jsonb, 'information', 'English proficiency test generally required', 'published', 1
    ) on conflict (entity_type, entity_id, rule_key, version) do nothing;

  end loop;
end;
$$;
