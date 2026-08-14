create or replace function public.classify_nonofficial_scholarship_candidate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_adapter_key text;
begin
  if new.entity_type <> 'scholarship' or new.automation_decision is not null then
    return new;
  end if;

  select ia.adapter_key into v_adapter_key
  from public.ingestion_sources ins
  join public.ingestion_adapters ia on ia.id = ins.adapter_id
  where ins.source_id = new.source_id;

  if coalesce(v_adapter_key, '') <> 'discovered_official_scholarship' then
    new.automation_score := public.candidate_structured_score(new.normalized_data, new.entity_type);
    new.automation_decision := 'human_review';
    new.automation_reasons := jsonb_build_array('source_not_exact_official_adapter');
    new.auto_evaluated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists classify_nonofficial_scholarship_candidate_trigger on public.opportunity_candidates;
create trigger classify_nonofficial_scholarship_candidate_trigger
before insert or update of source_id, entity_type on public.opportunity_candidates
for each row execute function public.classify_nonofficial_scholarship_candidate();

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

revoke all on function public.classify_nonofficial_scholarship_candidate() from public, anon, authenticated;
