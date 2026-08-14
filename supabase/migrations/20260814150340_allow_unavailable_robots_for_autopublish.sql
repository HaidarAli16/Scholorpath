-- A missing robots.txt (404/410) is recorded as `unavailable` and is already
-- treated as fetch-allowed by the worker. Keep the publication gate aligned:
-- only explicit blocks and fetch errors require human review.
do $$
declare
  v_definition text;
  v_previous text := 'or coalesce(c.robots_state, '''') <> ''allowed''';
  v_replacement text := 'or coalesce(c.robots_state, '''') not in (''allowed'', ''unavailable'')';
begin
  select pg_get_functiondef('public.auto_publish_high_confidence_scholarships(integer)'::regprocedure)
  into v_definition;

  if position(v_previous in v_definition) = 0 then
    raise exception 'expected auto-publish robots gate was not found';
  end if;

  execute replace(v_definition, v_previous, v_replacement);
end;
$$;
