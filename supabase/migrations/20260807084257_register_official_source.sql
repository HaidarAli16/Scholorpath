create or replace function public.register_official_ingestion_source(
  p_url text,
  p_owner_name text,
  p_entity_type text,
  p_country_code text default null,
  p_schedule_minutes integer default 720
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  adapter_id uuid;
  v_adapter_key text;
  v_source_id uuid;
  v_run_id uuid;
  source_host text;
begin
  if uid is null or not public.can_research_write() then raise exception 'research role required' using errcode='42501'; end if;
  if p_entity_type not in ('programme','scholarship') then raise exception 'invalid entity type' using errcode='22023'; end if;
  if length(trim(coalesce(p_owner_name,''))) < 2 then raise exception 'owner name required' using errcode='22023'; end if;
  if p_schedule_minutes < 60 or p_schedule_minutes > 10080 then raise exception 'invalid schedule' using errcode='22023'; end if;
  if p_url !~ '^https://[^/]+(/|$)' then raise exception 'a secure HTTPS source is required' using errcode='22023'; end if;
  source_host := lower(substring(p_url from '^https://([^/:]+)'));
  if source_host is null or source_host in ('localhost','0.0.0.0') then raise exception 'invalid source host' using errcode='22023'; end if;

  v_adapter_key := case when p_entity_type='programme' then 'official_programme_detail' else 'official_scholarship_detail' end;
  select a.id into adapter_id from public.ingestion_adapters a where a.adapter_key=v_adapter_key and a.enabled for update;
  if adapter_id is null then raise exception 'detail adapter unavailable' using errcode='P0002'; end if;

  update public.ingestion_adapters a
  set allowed_hosts=(select array_agg(distinct host order by host) from unnest(a.allowed_hosts || array[source_host]) hosts(host)),updated_at=now()
  where id=adapter_id;

  insert into public.source_records(canonical_url,source_type,owner_name,country_code,status,verification_notes)
  values(trim(p_url),'official_' || p_entity_type || '_page',trim(p_owner_name),nullif(upper(trim(coalesce(p_country_code,''))),''),'unverified',
    'Registered by an authorised research administrator; extracted facts require review before publication.')
  on conflict(canonical_url) do update
  set owner_name=excluded.owner_name,country_code=excluded.country_code,updated_at=now()
  returning id into v_source_id;

  insert into public.ingestion_sources(source_id,adapter_id,enabled,priority,schedule_minutes,next_fetch_at)
  values(v_source_id,adapter_id,true,1,p_schedule_minutes,now())
  on conflict(source_id) do update
  set adapter_id=excluded.adapter_id,enabled=true,priority=1,schedule_minutes=excluded.schedule_minutes,next_fetch_at=now(),last_error=null,updated_at=now();

  if not exists(select 1 from public.ingestion_runs r where r.source_id=v_source_id and r.status in ('queued','running')) then
    insert into public.ingestion_runs(source_id,adapter_id,trigger_type,status,requested_by)
    values(v_source_id,adapter_id,'manual','queued',uid) returning id into v_run_id;
  else
    select r.id into v_run_id from public.ingestion_runs r where r.source_id=v_source_id and r.status in ('queued','running') order by queued_at desc limit 1;
  end if;
  return jsonb_build_object('source_id',v_source_id,'run_id',v_run_id);
end;
$$;

revoke all on function public.register_official_ingestion_source(text,text,text,text,integer) from public, anon;
grant execute on function public.register_official_ingestion_source(text,text,text,text,integer) to authenticated;
