-- Migration 018: Worldwide Nationality

set search_path = '';

ALTER TABLE public.student_profiles ALTER COLUMN nationality TYPE text USING nationality::text;
ALTER TABLE public.qualification_equivalencies ALTER COLUMN origin_country TYPE text USING origin_country::text;
ALTER TABLE public.institution_requirements ALTER COLUMN origin_country TYPE text USING origin_country::text;

DROP TYPE IF EXISTS public.profile_country CASCADE;

create or replace function public.submit_assessment(
  p_profile jsonb,
  p_answers jsonb,
  p_report jsonb,
  p_tasks jsonb,
  p_engine_version text,
  p_rule_snapshot_version text,
  p_request_hash text,
  p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  assessment_id uuid;
  previous_id uuid;
  next_version integer;
  task jsonb;
  cached jsonb;
  result jsonb;
begin
  if uid is null then raise exception 'authentication required' using errcode = '42501'; end if;
  if length(p_idempotency_key) < 8 or length(p_idempotency_key) > 120 then raise exception 'invalid idempotency key'; end if;

  select response into cached from public.request_idempotency
  where user_id = uid and route = 'assessment.submit' and idempotency_key = p_idempotency_key and status = 'completed';
  if cached is not null then return cached; end if;

  insert into public.request_idempotency(user_id, route, idempotency_key, request_hash)
  values(uid, 'assessment.submit', p_idempotency_key, p_request_hash)
  on conflict (user_id, route, idempotency_key) do update set updated_at = now()
  returning response into cached;
  if cached is not null then return cached; end if;

  insert into public.student_profiles(user_id, first_name, nationality, current_country, preferred_currency)
  values(uid, p_profile->>'first_name', p_profile->>'nationality', p_profile->>'current_country', coalesce(p_profile->>'preferred_currency','USD'))
  on conflict (user_id) do update set first_name=excluded.first_name, nationality=excluded.nationality,
    current_country=excluded.current_country, preferred_currency=excluded.preferred_currency, updated_at=now();

  select id, version into previous_id, next_version from public.assessments
  where user_id = uid order by version desc limit 1;
  next_version := coalesce(next_version, 0) + 1;

  insert into public.assessments(user_id, version, status, answers, completion_percent, completed_at, content_hash, idempotency_key, supersedes_id)
  values(uid, next_version, 'completed', p_answers, 100, now(), p_request_hash, p_idempotency_key, previous_id)
  returning id into assessment_id;

  insert into public.profile_snapshots(user_id, assessment_id, snapshot, evidence_completeness, content_hash)
  values(uid, assessment_id, p_answers, coalesce((p_report->>'profileCompleteness')::smallint,0), p_request_hash);

  insert into public.pathway_reports(assessment_id, user_id, engine_version, rule_snapshot_version, report)
  values(assessment_id, uid, p_engine_version, p_rule_snapshot_version, p_report);

  for task in select value from jsonb_array_elements(coalesce(p_tasks,'[]'::jsonb)) loop
    insert into public.tasks(user_id,title,description,state,priority,system_generated,estimated_minutes,impact_type,impact_level,impact_score,source_type,source_id,dedupe_key,evidence_required)
    values(uid, task->>'title', task->>'description', 'todo', coalesce((task->>'priority')::smallint,3), true,
      nullif(task->>'estimated_minutes','')::integer, coalesce(task->>'impact_type','profile'),
      coalesce(task->>'impact_level','medium'), coalesce((task->>'impact_score')::smallint,50),
      'profile_gap', assessment_id, 'assessment:'||assessment_id::text||':'||coalesce(task->>'key',md5(task::text)),
      coalesce(task->'evidence_required','[]'::jsonb))
    on conflict do nothing;
  end loop;

  insert into public.audit_events(actor_user_id, action, entity_type, entity_id, after_data)
  values(uid, 'assessment_submitted', 'assessment', assessment_id, jsonb_build_object('version',next_version,'engine_version',p_engine_version));
  insert into public.outbox_events(aggregate_type, aggregate_id, event_type, user_id, payload)
  values('assessment', assessment_id, 'assessment.completed', uid, jsonb_build_object('assessment_id',assessment_id));

  result := jsonb_build_object('assessment_id',assessment_id,'version',next_version,'report',p_report);
  update public.request_idempotency set response=result,status='completed',updated_at=now()
  where user_id=uid and route='assessment.submit' and idempotency_key=p_idempotency_key;
  return result;
exception when others then
  update public.request_idempotency set status='failed',updated_at=now()
  where user_id=uid and route='assessment.submit' and idempotency_key=p_idempotency_key;
  raise;
end;
$$;
