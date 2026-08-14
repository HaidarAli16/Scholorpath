-- Evaluate each immutable official-page candidate once. A changed source page
-- creates a new candidate, so repeatedly rescoring held rows only wastes cron.
do $$
declare
  v_definition text;
  v_previous text := 'and (oc.automation_decision is null or oc.automation_decision = ''human_review'')';
  v_replacement text := 'and oc.automation_decision is null';
begin
  select pg_get_functiondef('public.auto_publish_high_confidence_scholarships(integer)'::regprocedure)
  into v_definition;

  if position(v_previous in v_definition) = 0 then
    raise exception 'expected two-tier queue predicate was not found';
  end if;

  execute replace(v_definition, v_previous, v_replacement);
end;
$$;

-- Secondary indexes are discovery-only. Keep their historical candidates out
-- of the official auto-publish queue and explain why they require review.
update public.opportunity_candidates oc
set automation_score = coalesce(oc.structured_score, 0),
    automation_decision = 'human_review',
    automation_reasons = jsonb_build_array('source_not_exact_official_adapter'),
    auto_evaluated_at = now()
where oc.entity_type = 'scholarship'
  and oc.review_state = 'pending'
  and oc.automation_decision is null
  and not exists (
    select 1
    from public.ingestion_sources ins
    join public.ingestion_adapters ia on ia.id = ins.adapter_id
    where ins.source_id = oc.source_id
      and ia.adapter_key = 'discovered_official_scholarship'
  );
