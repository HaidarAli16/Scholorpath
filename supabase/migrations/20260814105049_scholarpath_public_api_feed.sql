-- Scholar Path exposes a public JSON endpoint whose scholarship records include
-- official application URLs. Consume only those URLs; ignore descriptions and images.

insert into public.ingestion_adapters (
  adapter_key, name, kind, entity_type, description, allowed_hosts, config, parser_version
)
values (
  'secondary_scholarpath_feed',
  'Scholar Path official-link discovery feed',
  'json_feed',
  'scholarship',
  'Reads public scholarship records only to discover official application URLs.',
  array['scholarpath.world'],
  jsonb_build_object(
    'feed_format', 'scholarpath_api',
    'max_links', 100,
    'max_bytes', 5000000,
    'store_candidates', false
  ),
  'scholarpath-feed-v1'
)
on conflict (adapter_key) do update
set name = excluded.name,
    kind = excluded.kind,
    entity_type = excluded.entity_type,
    description = excluded.description,
    allowed_hosts = excluded.allowed_hosts,
    config = excluded.config,
    parser_version = excluded.parser_version,
    enabled = true,
    updated_at = now();

insert into public.source_records (
  canonical_url, source_type, owner_name, status, next_review_at, verification_notes
)
values (
  'https://scholarpath.world/api/opportunities?type=scholarship&limit=100',
  'secondary_discovery',
  'Scholar Path',
  'unverified',
  now(),
  'Discovery only. Only official application URLs are retained; descriptions and images are ignored.'
)
on conflict (canonical_url) do update
set next_review_at = now(),
    verification_notes = excluded.verification_notes,
    updated_at = now();

insert into public.ingestion_sources (
  source_id, adapter_id, enabled, priority, schedule_minutes, next_fetch_at, discovery_metadata
)
select s.id, a.id, true, 3, 1440, now(), jsonb_build_object('provenance_mode', 'official_links_only')
from public.source_records s
cross join public.ingestion_adapters a
where s.canonical_url = 'https://scholarpath.world/api/opportunities?type=scholarship&limit=100'
  and a.adapter_key = 'secondary_scholarpath_feed'
on conflict (source_id) do update
set adapter_id = excluded.adapter_id,
    enabled = true,
    priority = excluded.priority,
    schedule_minutes = 1440,
    next_fetch_at = now(),
    last_error = null,
    discovery_metadata = excluded.discovery_metadata,
    updated_at = now();

update public.ingestion_sources i
set enabled = false,
    last_error = 'replaced_by_public_json_feed',
    updated_at = now()
from public.source_records s
where i.source_id = s.id
  and s.canonical_url = 'https://scholarpath.world/scholarships';
