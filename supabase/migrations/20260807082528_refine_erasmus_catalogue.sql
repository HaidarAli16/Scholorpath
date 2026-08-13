-- Replace the generic Erasmus landing-page crawl with the official EACEA
-- programme catalogue. Discovered programme websites remain review-only.

update public.ingestion_adapters
set entity_type = 'programme',
    allowed_hosts = array['www.eacea.ec.europa.eu'],
    config = jsonb_build_object(
      'external_links_only', true,
      'exclude_host_suffixes', jsonb_build_array('europa.eu'),
      'exclude_label_patterns', jsonb_build_array(
        '^(home|contact|about|privacy|legal|cookies|accessibility|subscribe|follow)(\s|$)'
      ),
      'minimum_label_length', 12,
      'link_keywords', '[]'::jsonb,
      'max_links', 40,
      'max_bytes', 3000000
    ),
    parser_version = 'eacea-catalogue-v2',
    updated_at = now()
where adapter_key = 'official_catalogue_discovery';

-- Preserve the old page's evidence, disable its future runs, and supersede
-- only its unreviewed noisy candidates.
update public.opportunity_candidates c
set review_state = 'superseded',
    review_notes = 'Superseded automatically: generic Erasmus landing page replaced by the official EACEA catalogue.',
    updated_at = now()
from public.source_records s
where c.source_id = s.id
  and s.canonical_url = 'https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters'
  and c.review_state = 'pending';

update public.ingestion_sources i
set enabled = false,
    last_error = 'Replaced by official EACEA catalogue pages.',
    updated_at = now()
from public.source_records s
where i.source_id = s.id
  and s.canonical_url = 'https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters';

-- A catalogue re-order must not create a duplicate review item.
alter table public.opportunity_candidates
  add constraint opportunity_candidates_canonical_hash_key unique (canonical_url, content_hash);

insert into public.source_records(canonical_url,source_type,owner_name,country_code,status,verification_notes)
select
  case when page_number = 0
    then 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en'
    else 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=' || page_number::text
  end,
  'government_agency',
  'European Commission / EACEA',
  'EU',
  'unverified',
  'Official Erasmus Mundus catalogue page. External programme links require human review before publication.'
from generate_series(0,10) as pages(page_number)
on conflict(canonical_url) do update
set owner_name = excluded.owner_name,
    verification_notes = excluded.verification_notes,
    updated_at = now();

insert into public.ingestion_sources(source_id,adapter_id,priority,schedule_minutes,next_fetch_at)
select s.id,a.id,1,720,now()
from public.source_records s
cross join public.ingestion_adapters a
where a.adapter_key = 'official_catalogue_discovery'
  and s.canonical_url ~ '^https://www\.eacea\.ec\.europa\.eu/scholarships/erasmus-mundus-catalogue_en(\?page=([1-9]|10))?$'
on conflict(source_id) do update
set adapter_id = excluded.adapter_id,
    enabled = true,
    priority = excluded.priority,
    schedule_minutes = excluded.schedule_minutes,
    next_fetch_at = now(),
    last_error = null,
    updated_at = now();
