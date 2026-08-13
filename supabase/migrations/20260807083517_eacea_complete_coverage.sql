update public.ingestion_adapters
set parser_version = 'eacea-card-catalogue-v5', updated_at = now()
where adapter_key = 'official_catalogue_discovery';

-- Only pages 3 and 4 contain the five HTTP-only legacy records. Reprocess
-- those pages and retain the URLs with an explicit source_url_insecure flag.
update public.opportunity_candidates c
set review_state = 'superseded',
    review_notes = 'Superseded automatically by complete EACEA coverage parser.',
    updated_at = now()
from public.source_records s
where c.source_id = s.id
  and s.canonical_url in (
    'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=3',
    'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=4'
  )
  and c.review_state = 'pending';

update public.source_records
set content_hash = null, updated_at = now()
where canonical_url in (
  'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=3',
  'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=4'
);

update public.ingestion_sources i
set etag = null, last_modified = null, next_fetch_at = now(), last_error = null, updated_at = now()
from public.source_records s
where i.source_id = s.id
  and s.canonical_url in (
    'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=3',
    'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en?page=4'
  );
