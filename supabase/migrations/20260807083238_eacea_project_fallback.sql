update public.ingestion_adapters
set parser_version = 'eacea-card-catalogue-v4', updated_at = now()
where adapter_key = 'official_catalogue_discovery';

update public.opportunity_candidates c
set review_state = 'superseded',
    review_notes = 'Superseded automatically by complete EACEA project-link fallback extraction.',
    updated_at = now()
from public.source_records s
where c.source_id = s.id
  and s.canonical_url like 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en%'
  and c.review_state = 'pending';

update public.source_records
set content_hash = null, updated_at = now()
where canonical_url like 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en%';

update public.ingestion_sources i
set etag = null, last_modified = null, next_fetch_at = now(), last_error = null, updated_at = now()
from public.source_records s
where i.source_id = s.id
  and s.canonical_url like 'https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en%';
