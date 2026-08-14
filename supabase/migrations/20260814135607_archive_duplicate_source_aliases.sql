-- Retain historical snapshots while removing duplicate aliases from the active
-- fetch queue. The canonical records remain active; no evidence is deleted.

with aliases(alias_url, canonical_url) as (
  values
    ('https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/', 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database'),
    ('https://www.kth.se/lediga-jobb?l=en&utm_source', 'https://www.kth.se/lediga-jobb?l=en'),
    ('https://rea.ec.europa.eu/funding-and-grants/horizon-europe-marie-sklodowska-curie-actions/msca-doctoral-networks_en?utm_source=chatgpt.com', 'https://rea.ec.europa.eu/funding-and-grants/horizon-europe-marie-sklodowska-curie-actions/msca-doctoral-networks_en'),
    ('https://www.schwarzmanscholars.org/admissions/application-instructions/?_gl=1*a74hgt*_up*MQ..*_ga*MTQ3ODMzNDA3My4xNzc0NDM4NjI4*_ga_YKV6Q4ZC6Z*czE3NzQ0Mzg2MjYkbzEkZzEkdDE3NzQ0Mzg3MTEkajYwJGwwJGgxOTExMDgwMTg0', 'https://www.schwarzmanscholars.org/admissions/application-instructions/'),
    ('https://www.ufsm.br/pro-reitorias/prpgp/busca?q=&sites%5B%5D=345&area=editais&orderby=modified&order=DESC', 'https://www.ufsm.br/pro-reitorias/prpgp/busca?area=editais&order=DESC&orderby=modified&q=&sites%5B%5D=345')
), duplicate_ids as (
  select s.id
  from public.source_records s
  join aliases a on a.alias_url = s.canonical_url
  where exists (
    select 1 from public.source_records canonical
    where canonical.canonical_url = a.canonical_url
  )
)
update public.ingestion_sources
set enabled = false,
    last_error = 'duplicate_source_alias_archived',
    updated_at = now()
where source_id in (select id from duplicate_ids);

with aliases(alias_url, canonical_url) as (
  values
    ('https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/', 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database'),
    ('https://www.kth.se/lediga-jobb?l=en&utm_source', 'https://www.kth.se/lediga-jobb?l=en'),
    ('https://rea.ec.europa.eu/funding-and-grants/horizon-europe-marie-sklodowska-curie-actions/msca-doctoral-networks_en?utm_source=chatgpt.com', 'https://rea.ec.europa.eu/funding-and-grants/horizon-europe-marie-sklodowska-curie-actions/msca-doctoral-networks_en'),
    ('https://www.schwarzmanscholars.org/admissions/application-instructions/?_gl=1*a74hgt*_up*MQ..*_ga*MTQ3ODMzNDA3My4xNzc0NDM4NjI4*_ga_YKV6Q4ZC6Z*czE3NzQ0Mzg2MjYkbzEkZzEkdDE3NzQ0Mzg3MTEkajYwJGwwJGgxOTExMDgwMTg0', 'https://www.schwarzmanscholars.org/admissions/application-instructions/'),
    ('https://www.ufsm.br/pro-reitorias/prpgp/busca?q=&sites%5B%5D=345&area=editais&orderby=modified&order=DESC', 'https://www.ufsm.br/pro-reitorias/prpgp/busca?area=editais&order=DESC&orderby=modified&q=&sites%5B%5D=345')
), duplicate_ids as (
  select s.id
  from public.source_records s
  join aliases a on a.alias_url = s.canonical_url
  where exists (
    select 1 from public.source_records canonical
    where canonical.canonical_url = a.canonical_url
  )
)
update public.ingestion_runs
set status = 'cancelled',
    finished_at = now(),
    error_code = 'duplicate_source_alias',
    error_message = 'Cancelled because this URL is an alias of an existing canonical source.'
where source_id in (select id from duplicate_ids)
  and status = 'queued';

with aliases(alias_url, canonical_url) as (
  values
    ('https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/', 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database'),
    ('https://www.kth.se/lediga-jobb?l=en&utm_source', 'https://www.kth.se/lediga-jobb?l=en'),
    ('https://rea.ec.europa.eu/funding-and-grants/horizon-europe-marie-sklodowska-curie-actions/msca-doctoral-networks_en?utm_source=chatgpt.com', 'https://rea.ec.europa.eu/funding-and-grants/horizon-europe-marie-sklodowska-curie-actions/msca-doctoral-networks_en'),
    ('https://www.schwarzmanscholars.org/admissions/application-instructions/?_gl=1*a74hgt*_up*MQ..*_ga*MTQ3ODMzNDA3My4xNzc0NDM4NjI4*_ga_YKV6Q4ZC6Z*czE3NzQ0Mzg2MjYkbzEkZzEkdDE3NzQ0Mzg3MTEkajYwJGwwJGgxOTExMDgwMTg0', 'https://www.schwarzmanscholars.org/admissions/application-instructions/'),
    ('https://www.ufsm.br/pro-reitorias/prpgp/busca?q=&sites%5B%5D=345&area=editais&orderby=modified&order=DESC', 'https://www.ufsm.br/pro-reitorias/prpgp/busca?area=editais&order=DESC&orderby=modified&q=&sites%5B%5D=345')
)
update public.source_records s
set status = 'archived',
    next_review_at = null,
    verification_notes = 'Duplicate URL alias archived. Canonical record: ' || a.canonical_url,
    updated_at = now()
from aliases a
where s.canonical_url = a.alias_url
  and exists (
    select 1 from public.source_records canonical
    where canonical.canonical_url = a.canonical_url
  );
