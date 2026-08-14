-- Process each candidate once so low-confidence rows do not starve newer rows.
-- A changed official page creates a new immutable candidate and is evaluated.
do $$
declare
  v_definition text;
  v_previous text := 'and oc.review_state = ''pending''
      and ia.adapter_key = ''discovered_official_scholarship''';
  v_replacement text := 'and oc.review_state = ''pending''
      and oc.automation_decision is null
      and ia.adapter_key = ''discovered_official_scholarship''';
begin
  select pg_get_functiondef('public.auto_publish_high_confidence_scholarships(integer)'::regprocedure)
  into v_definition;

  if position(v_previous in v_definition) = 0 then
    raise exception 'expected auto-publish queue predicate was not found';
  end if;

  execute replace(v_definition, v_previous, v_replacement);
end;
$$;
