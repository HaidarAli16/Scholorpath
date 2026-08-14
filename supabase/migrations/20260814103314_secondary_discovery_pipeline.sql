-- Secondary discovery feeds are allowed to suggest official sources only.
-- Their prose and images never become student-facing evidence. Each discovered
-- official HTTPS host receives its own exact-host fetch boundary in the worker.

alter table public.ingestion_sources
  add column if not exists discovery_metadata jsonb not null default '{}'::jsonb;

insert into public.ingestion_adapters (
  adapter_key, name, kind, entity_type, description, allowed_hosts, config, parser_version
)
values
  (
    'secondary_scholarship_feed',
    'Secondary scholarship JSON discovery',
    'json_feed',
    'scholarship',
    'Discovers aggregator detail pages from a public JSON listing. Does not publish aggregator content.',
    array['www.opportunitiescircle.com'],
    jsonb_build_object(
      'feed_format', 'wordpress_search',
      'max_links', 100,
      'max_bytes', 1000000,
      'store_candidates', false
    ),
    'secondary-feed-v1'
  ),
  (
    'secondary_scholarship_catalogue',
    'Secondary scholarship HTML discovery',
    'html_catalogue',
    'scholarship',
    'Discovers aggregator detail pages from an HTML listing. Does not publish aggregator content.',
    array['scholarpath.world'],
    jsonb_build_object(
      'link_keywords', jsonb_build_array('scholarship', 'funded'),
      'max_links', 100,
      'minimum_label_length', 8,
      'max_bytes', 2000000,
      'store_candidates', false
    ),
    'secondary-catalogue-v1'
  ),
  (
    'secondary_scholarship_detail',
    'Secondary scholarship outbound-link discovery',
    'html_detail',
    'scholarship',
    'Reads an aggregator detail page only to locate an official outbound HTTPS source.',
    array['www.opportunitiescircle.com', 'scholarpath.world'],
    jsonb_build_object(
      'max_official_links', 3,
      'max_bytes', 3000000,
      'exclude_host_suffixes', jsonb_build_array(
        'bit.ly', 'postimg.cc', 'google.com', 'googleapis.com', 'gstatic.com',
        'facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com',
        'youtube.com', 'whatsapp.com', 'telegram.org', 't.me', 'pinterest.com',
        'doubleclick.net', 'googlesyndication.com', 'larapush.com', 'yandex.ru',
        'opcircleacademy.com', 'turkiyescholar.com'
      ),
      'store_candidates', false
    ),
    'secondary-outbound-v1'
  ),
  (
    'discovered_official_scholarship',
    'Discovered official scholarship detail',
    'html_detail',
    'scholarship',
    'Fetches a discovered official source using an exact-host boundary and creates review candidates.',
    '{}'::text[],
    jsonb_build_object(
      'open_patterns', jsonb_build_array('applications are open', 'apply now', 'applications open'),
      'closed_patterns', jsonb_build_array('applications are closed', 'applications have closed'),
      'deadline_keywords', jsonb_build_array('deadline', 'applications close', 'closing date', 'apply by'),
      'max_bytes', 3000000
    ),
    'discovered-official-v1'
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
values
  (
    'https://www.opportunitiescircle.com/wp-json/wp/v2/search?search=scholarship&per_page=100&orderby=date&order=desc',
    'secondary_discovery',
    'Opportunities Circle',
    'unverified',
    now(),
    'Discovery only. Follow official outbound links; never publish aggregator prose or images.'
  ),
  (
    'https://scholarpath.world/scholarships',
    'secondary_discovery',
    'Scholar Path',
    'unverified',
    now(),
    'Discovery only. Follow official outbound links; never publish aggregator prose or images.'
  )
on conflict (canonical_url) do update
set source_type = excluded.source_type,
    owner_name = excluded.owner_name,
    next_review_at = least(public.source_records.next_review_at, now()),
    verification_notes = excluded.verification_notes,
    updated_at = now();

insert into public.ingestion_sources (
  source_id, adapter_id, enabled, priority, schedule_minutes, next_fetch_at
)
select s.id, a.id, true, 3, 1440, now()
from public.source_records s
join public.ingestion_adapters a
  on a.adapter_key = case
    when s.canonical_url like 'https://www.opportunitiescircle.com/wp-json/%' then 'secondary_scholarship_feed'
    else 'secondary_scholarship_catalogue'
  end
where s.canonical_url in (
  'https://www.opportunitiescircle.com/wp-json/wp/v2/search?search=scholarship&per_page=100&orderby=date&order=desc',
  'https://scholarpath.world/scholarships'
)
on conflict (source_id) do update
set adapter_id = excluded.adapter_id,
    enabled = true,
    priority = excluded.priority,
    schedule_minutes = 1440,
    next_fetch_at = least(public.ingestion_sources.next_fetch_at, now()),
    last_error = null,
    updated_at = now();
