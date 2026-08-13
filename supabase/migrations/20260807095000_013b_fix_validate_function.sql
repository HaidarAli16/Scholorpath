-- Migration 013 patch: fix array_append operator ambiguity
-- Replaces `errors || 'literal'` with `array_append(errors, 'literal')` 
-- to avoid the malformed array literal error when search_path = ''.
-- Also relaxes programme-specific validation so candidates without
-- degree_level/field_family can still be published (those fields are
-- defaulted in the publish function itself).

create or replace function public.validate_candidate_for_publish(p_candidate_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.opportunity_candidates%rowtype;
  errors text[] := array[]::text[];
begin
  select * into c from public.opportunity_candidates where id = p_candidate_id;
  if not found then
    return array['candidate_not_found'];
  end if;

  if c.review_state not in ('approved') then
    errors := array_append(errors, 'review_state_not_approved');
  end if;

  if length(trim(coalesce(c.normalized_data->>'title', c.title, ''))) < 2 then
    errors := array_append(errors, 'missing_title');
  end if;

  if length(trim(coalesce(c.normalized_data->>'provider_name', c.provider_name, ''))) < 2 then
    errors := array_append(errors, 'missing_provider_name');
  end if;

  -- application_url: accept either normalized_data field OR the candidate's canonical_url
  if length(trim(coalesce(
    c.normalized_data->>'application_url',
    c.normalized_data->>'apply_url',
    c.canonical_url, ''
  ))) < 10 then
    errors := array_append(errors, 'missing_application_url');
  end if;

  -- Scholarship-specific: funding_type is helpful but not blocking
  -- (defaults to 'unclassified' in publish function)

  -- Programme-specific: degree_level / field_family default in publish function
  -- so we don't block on them — they improve score but aren't required

  return errors;
end;
$$;
