-- Reparse an existing Scholar Path source after assigning the discovery-only
-- adapter, and quarantine a non-authoritative form host found during acceptance.

update public.ingestion_adapters
set config = jsonb_set(
      config,
      '{exclude_host_suffixes}',
      coalesce(config->'exclude_host_suffixes', '[]'::jsonb) || '["pages.services"]'::jsonb,
      true
    ),
    parser_version = 'secondary-outbound-v2',
    updated_at = now()
where adapter_key = 'secondary_scholarship_detail';

update public.source_records
set content_hash = null,
    next_review_at = now(),
    updated_at = now()
where canonical_url = 'https://scholarpath.world/scholarships';

update public.ingestion_sources i
set etag = null,
    last_modified = null,
    next_fetch_at = now(),
    last_error = null,
    updated_at = now()
from public.source_records s
where i.source_id = s.id
  and s.canonical_url = 'https://scholarpath.world/scholarships';

update public.ingestion_sources i
set enabled = false,
    last_error = 'discovery_domain_not_trusted',
    updated_at = now()
from public.source_records s
where i.source_id = s.id
  and s.canonical_url = 'https://pages.services/briefings.themidpoint.org.za/2027-kas-saiia-scholarship-application/';

update public.ingestion_runs r
set status = 'cancelled',
    finished_at = now(),
    error_code = 'discovery_domain_not_trusted',
    error_message = 'The discovered form host is not authoritative enough for automatic ingestion.'
from public.source_records s
where r.source_id = s.id
  and r.status = 'queued'
  and s.canonical_url = 'https://pages.services/briefings.themidpoint.org.za/2027-kas-saiia-scholarship-application/';
