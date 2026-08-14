-- Credential-free institution identity enrichment through ROR v2.
-- ROR metadata is supporting context only; it never establishes admissions,
-- eligibility, funding or visa facts.

alter table public.institutions
  add column if not exists official_domain text,
  add column if not exists ror_id text,
  add column if not exists ror_match_score numeric(5,4),
  add column if not exists external_ids jsonb not null default '{}'::jsonb,
  add column if not exists enrichment_metadata jsonb not null default '{}'::jsonb,
  add column if not exists enrichment_state text not null default 'pending',
  add column if not exists enriched_at timestamptz,
  add column if not exists next_enrichment_at timestamptz;

alter table public.institutions
  drop constraint if exists institutions_enrichment_state_check;

alter table public.institutions
  add constraint institutions_enrichment_state_check
  check (enrichment_state in ('pending','matched','ambiguous','not_found','failed'));

update public.institutions
set official_domain = nullif(
  regexp_replace(
    split_part(split_part(lower(website_url), '://', 2), '/', 1),
    '^www\.',
    ''
  ),
  ''
)
where official_domain is null;

create unique index if not exists institutions_ror_id_unique_idx
  on public.institutions (ror_id)
  where ror_id is not null;

create unique index if not exists institutions_official_domain_unique_idx
  on public.institutions (official_domain)
  where official_domain is not null;

create index if not exists institutions_enrichment_due_idx
  on public.institutions (next_enrichment_at, enrichment_state);

create table if not exists public.institution_enrichment_runs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  provider text not null default 'ror',
  status text not null check (status in ('matched','ambiguous','not_found','failed','duplicate_blocked')),
  matched_external_id text,
  match_score numeric(5,4),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists institution_enrichment_runs_institution_idx
  on public.institution_enrichment_runs (institution_id, created_at desc);

alter table public.institution_enrichment_runs enable row level security;

drop policy if exists "staff read institution enrichment runs" on public.institution_enrichment_runs;
create policy "staff read institution enrichment runs"
  on public.institution_enrichment_runs for select to authenticated
  using ((select public.is_staff()));

revoke all on table public.institution_enrichment_runs from anon, authenticated;
grant select on table public.institution_enrichment_runs to authenticated;
grant all on table public.institution_enrichment_runs to service_role;

create or replace function public.configure_institution_enrichment_scheduler(p_worker_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(coalesce(p_worker_key,'')) < 20 then
    raise exception 'invalid worker key' using errcode='22023';
  end if;

  delete from vault.secrets where name='candidroute_institution_enrichment_worker_key';
  perform vault.create_secret(
    p_worker_key,
    'candidroute_institution_enrichment_worker_key',
    'CandidRoute scheduled institution enrichment worker key'
  );

  if exists (select 1 from cron.job where jobname='candidroute-institution-enrichment') then
    perform cron.unschedule('candidroute-institution-enrichment');
  end if;

  perform cron.schedule(
    'candidroute-institution-enrichment',
    '17 2 * * *',
    $job$
      select net.http_post(
        url := 'https://gbhzekncpqeytknxanzy.supabase.co/functions/v1/institution-enrich',
        headers := jsonb_build_object(
          'Content-Type','application/json',
          'apikey',(select decrypted_secret from vault.decrypted_secrets where name='candidroute_institution_enrichment_worker_key' limit 1)
        ),
        body := '{"limit":40}'::jsonb
      );
    $job$
  );
end;
$$;

revoke all on function public.configure_institution_enrichment_scheduler(text) from public, anon, authenticated;
grant execute on function public.configure_institution_enrichment_scheduler(text) to service_role;
