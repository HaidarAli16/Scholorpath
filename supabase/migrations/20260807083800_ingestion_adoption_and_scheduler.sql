create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Catalogue rows are discovery leads. Deadline/application checks apply only
-- after the official programme site has been adopted and fetched in detail.
update public.opportunity_candidates c
set normalized_data = c.normalized_data || jsonb_build_object('discovery_only', true),
    validation_errors = case
      when c.canonical_url like 'http://%' then jsonb_build_array('source_url_insecure')
      else '[]'::jsonb
    end,
    updated_at = now()
from public.source_records s
where c.source_id = s.id
  and s.canonical_url like 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en%'
  and c.review_state = 'pending';

create or replace function public.adopt_opportunity_candidate(p_candidate_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  candidate public.opportunity_candidates%rowtype;
  adapter_id uuid;
  v_source_id uuid;
  v_run_id uuid;
  source_host text;
begin
  if uid is null or not public.can_research_write() then
    raise exception 'research role required' using errcode = '42501';
  end if;

  select * into candidate
  from public.opportunity_candidates
  where id = p_candidate_id
  for update;

  if candidate.id is null then raise exception 'candidate not found' using errcode = 'P0002'; end if;
  if coalesce((candidate.normalized_data->>'discovery_only')::boolean, false) is not true then
    raise exception 'candidate is not a discovery lead' using errcode = '22023';
  end if;
  if candidate.canonical_url !~ '^https://[^/]+(/|$)' then
    raise exception 'a secure HTTPS source is required for monitoring' using errcode = '22023';
  end if;

  source_host := lower(substring(candidate.canonical_url from '^https://([^/:]+)'));
  if source_host is null or source_host in ('localhost','0.0.0.0') then
    raise exception 'invalid source host' using errcode = '22023';
  end if;

  select id into adapter_id
  from public.ingestion_adapters
  where adapter_key = 'official_programme_detail' and enabled
  for update;
  if adapter_id is null then raise exception 'programme detail adapter unavailable' using errcode = 'P0002'; end if;

  update public.ingestion_adapters a
  set allowed_hosts = (
        select array_agg(distinct host order by host)
        from unnest(a.allowed_hosts || array[source_host]) as hosts(host)
      ),
      updated_at = now()
  where id = adapter_id;

  insert into public.source_records(canonical_url,source_type,owner_name,country_code,status,verification_notes)
  values(candidate.canonical_url,'official_programme_page',candidate.title,candidate.country_code,'unverified',
    'Adopted from a human-reviewed official catalogue lead; detail extraction still requires review.')
  on conflict(canonical_url) do update
  set owner_name = excluded.owner_name, updated_at = now()
  returning id into v_source_id;

  insert into public.ingestion_sources(source_id,adapter_id,enabled,priority,schedule_minutes,next_fetch_at)
  values(v_source_id,adapter_id,true,1,720,now())
  on conflict(source_id) do update
  set adapter_id=excluded.adapter_id,enabled=true,priority=excluded.priority,
      schedule_minutes=excluded.schedule_minutes,next_fetch_at=now(),last_error=null,updated_at=now();

  if not exists (select 1 from public.ingestion_runs r where r.source_id=v_source_id and r.status in ('queued','running')) then
    insert into public.ingestion_runs(source_id,adapter_id,trigger_type,status,requested_by)
    values(v_source_id,adapter_id,'manual','queued',uid)
    returning id into v_run_id;
  else
    select r.id into v_run_id from public.ingestion_runs r
    where r.source_id=v_source_id and r.status in ('queued','running')
    order by queued_at desc limit 1;
  end if;

  update public.opportunity_candidates
  set review_state='approved',reviewed_by=uid,reviewed_at=now(),
      review_notes='Approved as a discovery lead and added to detailed monitoring.',updated_at=now()
  where id=p_candidate_id;

  return jsonb_build_object('source_id',v_source_id,'run_id',v_run_id);
end;
$$;

revoke all on function public.adopt_opportunity_candidate(uuid) from public, anon;
grant execute on function public.adopt_opportunity_candidate(uuid) to authenticated;

-- One-time service-only bootstrap. The worker key is encrypted in Vault and
-- pg_cron invokes one due source each minute, providing steady back-pressure.
create or replace function public.configure_ingestion_scheduler(p_worker_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(coalesce(p_worker_key,'')) < 20 then raise exception 'invalid worker key' using errcode='22023'; end if;
  delete from vault.secrets where name='scholarpath_ingestion_worker_key';
  perform vault.create_secret(p_worker_key,'scholarpath_ingestion_worker_key','ScholarPath scheduled ingestion worker key');
  if exists (select 1 from cron.job where jobname='scholarpath-opportunity-ingestion') then
    perform cron.unschedule('scholarpath-opportunity-ingestion');
  end if;
  perform cron.schedule(
    'scholarpath-opportunity-ingestion',
    '* * * * *',
    $job$
      select net.http_post(
        url := 'https://gbhzekncpqeytknxanzy.supabase.co/functions/v1/opportunity-ingest',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'apikey',(select decrypted_secret from vault.decrypted_secrets where name='scholarpath_ingestion_worker_key' limit 1)
        ),
        body := '{"enqueueDue":true,"limit":25}'::jsonb
      );
    $job$
  );
end;
$$;

revoke all on function public.configure_ingestion_scheduler(text) from public, anon, authenticated;
grant execute on function public.configure_ingestion_scheduler(text) to service_role;
