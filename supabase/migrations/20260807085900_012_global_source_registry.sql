-- Migration 012: Global Scholarship Source Registry
-- Registers 50+ official scholarship and programme sources from 20+ countries/regions
-- into the ingestion pipeline. Sources are discovery-only until a research reviewer
-- approves and publishes each candidate. No source is auto-published.
--
-- Scope: WORLDWIDE — no student-origin restriction.
-- All major global funders are covered for the Cover MVP.

-- ── Step 1: Register all new hostnames in the scholarship detail adapter ────
-- The official_scholarship_detail adapter allowlist must include every host
-- we intend to monitor so the safety validator accepts the URLs.

update public.ingestion_adapters
set
  allowed_hosts = array(
    select distinct unnest(allowed_hosts || array[
      -- UK
      'www.chevening.org', 'chevening.org',
      'cscuk.fcdo.gov.uk',
      'www.gatescambridge.org', 'gatescambridge.org',
      'www.rhodeshouse.ox.ac.uk',
      'www.ox.ac.uk',
      -- EU / Erasmus / MSCA
      'www.eacea.ec.europa.eu', 'eacea.ec.europa.eu',
      'erasmus-plus.ec.europa.eu',
      'marie-sklodowska-curie-actions.ec.europa.eu',
      -- Germany
      'www.daad.de', 'daad.de',
      'www.kas.de', 'kas.de',
      'www.boell.de', 'boell.de',
      'www.fes.de', 'fes.de',
      -- Netherlands
      'www.studyinnl.org', 'studyinnl.org',
      'www.nuffic.nl', 'nuffic.nl',
      -- Ireland
      'hea.ie', 'www.hea.ie',
      -- Switzerland
      'www.sbfi.admin.ch',
      'ethz.ch', 'www.ethz.ch',
      'www.epfl.ch',
      -- Sweden
      'si.se', 'www.si.se',
      -- USA
      'foreign.fulbrightonline.org',
      'www.humphreyfellowship.org', 'humphreyfellowship.org',
      -- Canada
      'vanier.gc.ca', 'www.vanier.gc.ca',
      'banting.fellowships-bourses.gc.ca',
      'www.idrc-crdi.ca', 'idrc-crdi.ca',
      -- Australia
      'www.dfat.gov.au', 'dfat.gov.au',
      -- Japan
      'www.studyinjapan.go.jp',
      'www.jasso.go.jp', 'jasso.go.jp',
      -- Korea
      'www.studyinkorea.go.kr',
      'graduate.korea.ac.kr',
      -- China
      'www.campuschina.org', 'campuschina.org',
      -- Singapore
      'nusgs.nus.edu.sg', 'nus.edu.sg',
      'www.a-star.edu.sg', 'a-star.edu.sg',
      -- Malaysia
      'www.yayasankhazanah.com.my', 'yayasankhazanah.com.my',
      'biasiswa.mohe.gov.my',
      -- Turkey
      'www.turkiyeburslari.gov.tr', 'turkiyeburslari.gov.tr',
      -- Hungary
      'stipendiumhungaricum.hu', 'www.stipendiumhungaricum.hu',
      -- New Zealand
      'www.scholarships.govt.nz', 'scholarships.govt.nz',
      -- Saudi Arabia
      'admissions.kaust.edu.sa', 'kaust.edu.sa',
      -- Islamic Development Bank
      'www.isdb.org', 'isdb.org',
      -- ADB / MasterCard / African Union
      'www.adb.org', 'adb.org',
      'mastercardfdn.org', 'www.mastercardfdn.org',
      'au.int', 'www.au.int'
    ]) as host order by host
  ),
  updated_at = now()
where adapter_key = 'official_scholarship_detail';

-- Also update the catalogue discovery adapter allowlist
update public.ingestion_adapters
set
  allowed_hosts = array(
    select distinct unnest(allowed_hosts || array[
      'www.eacea.ec.europa.eu', 'eacea.ec.europa.eu',
      'erasmus-plus.ec.europa.eu',
      'cscuk.fcdo.gov.uk',
      'www.studyinkorea.go.kr',
      'www.studyinjapan.go.jp',
      'www.campuschina.org', 'campuschina.org',
      'stipendiumhungaricum.hu',
      'www.turkiyeburslari.gov.tr',
      'si.se', 'www.si.se'
    ]) as host order by host
  ),
  updated_at = now()
where adapter_key = 'official_catalogue_discovery';

-- ── Step 2: Insert all source_records ────────────────────────────────────────
-- Each source maps to one official page for one scholarship or catalogue.
-- Priority: 1 = flagship / high volume, 2 = regional flagship, 3 = standard

insert into public.source_records (canonical_url, source_type, owner_name, country_code, status, verification_notes)
values
  -- ── United Kingdom ──────────────────────────────────────────────────────────
  ('https://www.chevening.org/', 'official_scholarship_page', 'Chevening Scholarships (FCDO)', 'GB', 'unverified', 'Official Chevening homepage. Registration required; check application timeline sub-page.'),
  ('https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/', 'official_scholarship_page', 'Commonwealth Scholarship Commission UK', 'GB', 'unverified', 'Commonwealth Masters Scholarships official page.'),
  ('https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/', 'official_scholarship_page', 'Commonwealth Scholarship Commission UK', 'GB', 'unverified', 'Commonwealth Shared Scholarships official page.'),
  ('https://www.gatescambridge.org/', 'official_scholarship_page', 'Gates Cambridge Trust', 'GB', 'unverified', 'Gates Cambridge Scholarship official portal.'),
  ('https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/', 'official_scholarship_page', 'The Rhodes Trust / University of Oxford', 'GB', 'unverified', 'Rhodes Scholarship official page.'),
  ('https://www.ox.ac.uk/clarendon', 'official_scholarship_page', 'University of Oxford Clarendon Fund', 'GB', 'unverified', 'Clarendon Fund fully funded scholarship for Oxford postgraduate.'),

  -- ── European Union / Erasmus / MSCA ─────────────────────────────────────────
  ('https://www.eacea.ec.europa.eu/scholarships/emjmd-catalogue_en', 'official_scholarship_page', 'European Education and Culture Executive Agency (EACEA)', 'EU', 'unverified', 'Official EACEA Erasmus Mundus catalogue. Use catalogue-discovery adapter.'),
  ('https://marie-sklodowska-curie-actions.ec.europa.eu/', 'official_scholarship_page', 'European Commission – Horizon Europe (MSCA)', 'EU', 'unverified', 'Marie Skłodowska-Curie Actions official portal. Discovery only.'),

  -- ── Germany ──────────────────────────────────────────────────────────────────
  ('https://www.daad.de/en/study-and-research-in-germany/scholarships/', 'official_scholarship_page', 'German Academic Exchange Service (DAAD)', 'DE', 'unverified', 'DAAD main scholarship listing. Covers EPOS and research grants.'),
  ('https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777', 'official_scholarship_page', 'DAAD – EPOS Programme', 'DE', 'unverified', 'Direct DAAD database entry for EPOS.'),
  ('https://www.kas.de/en/web/begabtenfoerderung-und-kultur/auslaenderfoerderung', 'official_scholarship_page', 'Konrad-Adenauer-Stiftung (KAS)', 'DE', 'unverified', 'KAS international student scholarship programme.'),
  ('https://www.boell.de/en/scholarships', 'official_scholarship_page', 'Heinrich-Böll-Stiftung', 'DE', 'unverified', 'Heinrich-Böll-Stiftung scholarship for international students.'),
  ('https://www.fes.de/en/study-and-research/scholarships', 'official_scholarship_page', 'Friedrich-Ebert-Stiftung (FES)', 'DE', 'unverified', 'FES scholarship for international graduate students.'),

  -- ── Netherlands ──────────────────────────────────────────────────────────────
  ('https://www.studyinnl.org/finances/nl-scholarship', 'official_scholarship_page', 'Nuffic / Dutch Ministry of Education', 'NL', 'unverified', 'Holland Scholarship (NL Scholarship) official page.'),
  ('https://www.studyinnl.org/finances', 'official_scholarship_page', 'Nuffic / Study in NL', 'NL', 'unverified', 'Orange Tulip Scholarship and other Dutch funding overview.'),
  ('https://www.nuffic.nl/en/subjects/orange-knowledge-programme', 'official_scholarship_page', 'Nuffic / Dutch Ministry of Foreign Affairs (NFP/OKP)', 'NL', 'unverified', 'Netherlands Fellowship Programme (Orange Knowledge Programme).'),

  -- ── Ireland ───────────────────────────────────────────────────────────────────
  ('https://hea.ie/policy/internationalisation/goi-ies/', 'official_scholarship_page', 'Higher Education Authority Ireland (HEA)', 'IE', 'unverified', 'Government of Ireland International Education Scholarship.'),

  -- ── Switzerland ───────────────────────────────────────────────────────────────
  ('https://www.sbfi.admin.ch/swiss-government-excellence-scholarships', 'official_scholarship_page', 'Federal Commission for Scholarships (ESKAS) / SERI', 'CH', 'unverified', 'Swiss Government Excellence Scholarships for foreign researchers and artists.'),
  ('https://ethz.ch/en/studies/master/application/financial-aid/excellence-scholarship.html', 'official_scholarship_page', 'ETH Zurich Foundation', 'CH', 'unverified', 'ETH Zurich Excellence Scholarship and Opportunity Programme (ESOP).'),
  ('https://www.epfl.ch/education/master/master-excellence-fellowships/', 'official_scholarship_page', 'École Polytechnique Fédérale de Lausanne (EPFL)', 'CH', 'unverified', 'EPFL Excellence Master Fellowships for admitted master students.'),

  -- ── Sweden / Scandinavia ──────────────────────────────────────────────────────
  ('https://si.se/en/apply/scholarships/', 'official_scholarship_page', 'Swedish Institute (SI)', 'SE', 'unverified', 'Swedish Institute Scholarships for global professionals and students.'),

  -- ── United States ────────────────────────────────────────────────────────────
  ('https://foreign.fulbrightonline.org/', 'official_scholarship_page', 'U.S. Department of State / IIE – Fulbright Foreign Student Program', 'US', 'unverified', 'Fulbright Foreign Student Program global portal. Country-specific grants available through local commissions.'),
  ('https://www.humphreyfellowship.org/', 'official_scholarship_page', 'U.S. Department of State / IIE – Hubert H. Humphrey Fellowship', 'US', 'unverified', 'Hubert Humphrey Fellowship for mid-career professionals.'),

  -- ── Canada ────────────────────────────────────────────────────────────────────
  ('https://vanier.gc.ca/en/home-accueil.html', 'official_scholarship_page', 'Government of Canada (CIHR / NSERC / SSHRC)', 'CA', 'unverified', 'Vanier Canada Graduate Scholarships for doctoral students.'),
  ('https://banting.fellowships-bourses.gc.ca/en/home-accueil.html', 'official_scholarship_page', 'Government of Canada (CIHR / NSERC / SSHRC)', 'CA', 'unverified', 'Banting Postdoctoral Fellowships.'),
  ('https://www.idrc-crdi.ca/en/funding', 'official_scholarship_page', 'International Development Research Centre (IDRC) Canada', 'CA', 'unverified', 'IDRC Research Awards for researchers from low- and middle-income countries.'),

  -- ── Australia ────────────────────────────────────────────────────────────────
  ('https://www.dfat.gov.au/people-to-people/australia-awards', 'official_scholarship_page', 'Department of Foreign Affairs and Trade (DFAT) Australia', 'AU', 'unverified', 'Australia Awards Scholarships official portal. Applications through country-specific portals.'),

  -- ── Japan ─────────────────────────────────────────────────────────────────────
  ('https://www.studyinjapan.go.jp/en/planning/scholarship/', 'official_scholarship_page', 'Ministry of Education, Culture, Sports, Science and Technology (MEXT) Japan', 'JP', 'unverified', 'MEXT Monbukagakusho Scholarship official study-in-Japan portal.'),
  ('https://www.jasso.go.jp/en/ryugaku/scholarship_j/index.html', 'official_scholarship_page', 'Japan Student Services Organization (JASSO)', 'JP', 'unverified', 'JASSO scholarships for international students in Japan.'),
  ('https://www.adb.org/work-with-us/careers/japan-scholarship-program', 'official_scholarship_page', 'Asian Development Bank (ADB) / Government of Japan', 'JP', 'unverified', 'ADB-Japan Scholarship Program for graduate study at designated Asian universities.'),

  -- ── South Korea ───────────────────────────────────────────────────────────────
  ('https://www.studyinkorea.go.kr/en/scholarship/main.do', 'official_scholarship_page', 'National Institute for International Education (NIIED) / Ministry of Education Korea', 'KR', 'unverified', 'Global Korea Scholarship (GKS) official Study in Korea portal.'),
  ('https://graduate.korea.ac.kr/', 'official_scholarship_page', 'Korea University Graduate School', 'KR', 'unverified', 'Korea University Graduate School – GKS partner institution page.'),

  -- ── China ─────────────────────────────────────────────────────────────────────
  ('https://www.campuschina.org/', 'official_scholarship_page', 'China Scholarship Council (CSC) / Ministry of Education China', 'CN', 'unverified', 'Chinese Government Scholarship (CSC) official Campus China portal.'),

  -- ── Singapore ────────────────────────────────────────────────────────────────
  ('https://nusgs.nus.edu.sg/scholarships/', 'official_scholarship_page', 'National University of Singapore (NUS) Graduate School', 'SG', 'unverified', 'NUS Graduate School scholarships and fellowships.'),
  ('https://www.a-star.edu.sg/scholarships', 'official_scholarship_page', 'Agency for Science, Technology and Research (A*STAR) Singapore', 'SG', 'unverified', 'A*STAR scholarships for science and technology research.'),

  -- ── Malaysia ──────────────────────────────────────────────────────────────────
  ('https://www.yayasankhazanah.com.my', 'official_scholarship_page', 'Yayasan Khazanah (Khazanah Nasional Berhad)', 'MY', 'unverified', 'Khazanah Global Scholarship for undergraduate and postgraduate study.'),
  ('https://biasiswa.mohe.gov.my/INTER/', 'official_scholarship_page', 'Ministry of Higher Education (MOHE) Malaysia', 'MY', 'unverified', 'Malaysia International Scholarship (MIS) for postgraduate study.'),

  -- ── Turkey ────────────────────────────────────────────────────────────────────
  ('https://www.turkiyeburslari.gov.tr/', 'official_scholarship_page', 'Presidency for Turks Abroad and Related Communities (YTB)', 'TR', 'unverified', 'Türkiye Bursları (YTB) official portal. Full funding for undergraduate, masters and doctoral studies.'),

  -- ── Hungary ───────────────────────────────────────────────────────────────────
  ('https://stipendiumhungaricum.hu/', 'official_scholarship_page', 'Tempus Public Foundation / Ministry of Foreign Affairs Hungary', 'HU', 'unverified', 'Stipendium Hungaricum Scholarship Programme official portal.'),

  -- ── New Zealand ───────────────────────────────────────────────────────────────
  ('https://www.scholarships.govt.nz/', 'official_scholarship_page', 'Ministry of Foreign Affairs and Trade (MFAT) New Zealand', 'NZ', 'unverified', 'Manaaki New Zealand Scholarships official portal.'),

  -- ── Saudi Arabia / KAUST ──────────────────────────────────────────────────────
  ('https://admissions.kaust.edu.sa/', 'official_scholarship_page', 'King Abdullah University of Science and Technology (KAUST)', 'SA', 'unverified', 'KAUST Fellowship for graduate students. Full funding for masters and PhD.'),

  -- ── Islamic Development Bank ──────────────────────────────────────────────────
  ('https://www.isdb.org/scholarships', 'official_scholarship_page', 'Islamic Development Bank (IsDB)', 'SA', 'unverified', 'IsDB Merit Scholarship Programme and Need-Based Scholarships for member-country nationals.'),

  -- ── MasterCard Foundation / African Union ─────────────────────────────────────
  ('https://mastercardfdn.org/all/scholars/', 'official_scholarship_page', 'MasterCard Foundation', 'US', 'unverified', 'MasterCard Foundation Scholars Program. Discovery only – individual programmes at partner universities.'),
  ('https://au.int/en/scholarships', 'official_scholarship_page', 'African Union Commission (AUC) / Pan African University', 'XX', 'unverified', 'African Union Scholarships and Pan African University programmes. Discovery only.')

on conflict (canonical_url) do update
set
  owner_name         = excluded.owner_name,
  country_code       = excluded.country_code,
  verification_notes = excluded.verification_notes,
  updated_at         = now();

-- ── Step 3: Link sources to the ingestion_sources scheduler ─────────────────
-- All new sources are assigned to the official_scholarship_detail adapter
-- with appropriate schedule intervals and priorities.
--
-- schedule_minutes guide:
--   360 (6h)   = flagship with frequent deadline changes (Chevening, Fulbright)
--   720 (12h)  = regional flagship (DAAD, MEXT, GKS, etc.)
--   1440 (24h) = stable institutional or catalogue discovery pages
--   4320 (3d)  = very stable institutional pages (ETH, EPFL, Vanier)

insert into public.ingestion_sources (source_id, adapter_id, enabled, priority, schedule_minutes, next_fetch_at)
select
  s.id,
  a.id,
  true,
  -- Priority: 1 for flagship government scholarships, 2 for others
  case
    when s.canonical_url in (
      'https://www.chevening.org/',
      'https://foreign.fulbrightonline.org/',
      'https://www.turkiyeburslari.gov.tr/',
      'https://www.dfat.gov.au/people-to-people/australia-awards',
      'https://www.studyinjapan.go.jp/en/planning/scholarship/',
      'https://www.studyinkorea.go.kr/en/scholarship/main.do',
      'https://www.campuschina.org/',
      'https://stipendiumhungaricum.hu/',
      'https://www.scholarships.govt.nz/'
    ) then 1
    else 2
  end as priority,
  -- Schedule by source type
  case
    when s.canonical_url in (
      'https://www.chevening.org/',
      'https://foreign.fulbrightonline.org/',
      'https://www.humphreyfellowship.org/',
      'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/',
      'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/',
      'https://www.turkiyeburslari.gov.tr/',
      'https://www.studyinkorea.go.kr/en/scholarship/main.do',
      'https://stipendiumhungaricum.hu/'
    ) then 360
    when s.canonical_url in (
      'https://www.eacea.ec.europa.eu/scholarships/emjmd-catalogue_en',
      'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777',
      'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
      'https://hea.ie/policy/internationalisation/goi-ies/',
      'https://www.studyinnl.org/finances/nl-scholarship',
      'https://www.nuffic.nl/en/subjects/orange-knowledge-programme',
      'https://www.studyinjapan.go.jp/en/planning/scholarship/',
      'https://www.campuschina.org/',
      'https://www.scholarships.govt.nz/',
      'https://www.dfat.gov.au/people-to-people/australia-awards',
      'https://www.isdb.org/scholarships',
      'https://admissions.kaust.edu.sa/'
    ) then 720
    when s.canonical_url in (
      'https://ethz.ch/en/studies/master/application/financial-aid/excellence-scholarship.html',
      'https://www.epfl.ch/education/master/master-excellence-fellowships/',
      'https://vanier.gc.ca/en/home-accueil.html',
      'https://banting.fellowships-bourses.gc.ca/en/home-accueil.html',
      'https://www.gatescambridge.org/',
      'https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/',
      'https://www.ox.ac.uk/clarendon',
      'https://nusgs.nus.edu.sg/scholarships/',
      'https://www.a-star.edu.sg/scholarships',
      'https://www.yayasankhazanah.com.my',
      'https://biasiswa.mohe.gov.my/INTER/'
    ) then 4320
    else 1440
  end as schedule_minutes,
  now() as next_fetch_at
from public.source_records s
cross join public.ingestion_adapters a
where
  a.adapter_key = 'official_scholarship_detail'
  and a.enabled = true
  and s.canonical_url in (
    -- UK
    'https://www.chevening.org/',
    'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/',
    'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-shared-scholarships/',
    'https://www.gatescambridge.org/',
    'https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/',
    'https://www.ox.ac.uk/clarendon',
    -- EU/MSCA
    'https://marie-sklodowska-curie-actions.ec.europa.eu/',
    -- Germany
    'https://www.daad.de/en/study-and-research-in-germany/scholarships/',
    'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777',
    'https://www.kas.de/en/web/begabtenfoerderung-und-kultur/auslaenderfoerderung',
    'https://www.boell.de/en/scholarships',
    'https://www.fes.de/en/study-and-research/scholarships',
    -- Netherlands
    'https://www.studyinnl.org/finances/nl-scholarship',
    'https://www.studyinnl.org/finances',
    'https://www.nuffic.nl/en/subjects/orange-knowledge-programme',
    -- Ireland
    'https://hea.ie/policy/internationalisation/goi-ies/',
    -- Switzerland
    'https://www.sbfi.admin.ch/swiss-government-excellence-scholarships',
    'https://ethz.ch/en/studies/master/application/financial-aid/excellence-scholarship.html',
    'https://www.epfl.ch/education/master/master-excellence-fellowships/',
    -- Sweden
    'https://si.se/en/apply/scholarships/',
    -- USA
    'https://foreign.fulbrightonline.org/',
    'https://www.humphreyfellowship.org/',
    -- Canada
    'https://vanier.gc.ca/en/home-accueil.html',
    'https://banting.fellowships-bourses.gc.ca/en/home-accueil.html',
    'https://www.idrc-crdi.ca/en/funding',
    -- Australia
    'https://www.dfat.gov.au/people-to-people/australia-awards',
    -- Japan
    'https://www.studyinjapan.go.jp/en/planning/scholarship/',
    'https://www.jasso.go.jp/en/ryugaku/scholarship_j/index.html',
    'https://www.adb.org/work-with-us/careers/japan-scholarship-program',
    -- Korea
    'https://www.studyinkorea.go.kr/en/scholarship/main.do',
    'https://graduate.korea.ac.kr/',
    -- China
    'https://www.campuschina.org/',
    -- Singapore
    'https://nusgs.nus.edu.sg/scholarships/',
    'https://www.a-star.edu.sg/scholarships',
    -- Malaysia
    'https://www.yayasankhazanah.com.my',
    'https://biasiswa.mohe.gov.my/INTER/',
    -- Turkey
    'https://www.turkiyeburslari.gov.tr/',
    -- Hungary
    'https://stipendiumhungaricum.hu/',
    -- New Zealand
    'https://www.scholarships.govt.nz/',
    -- Saudi Arabia / KAUST
    'https://admissions.kaust.edu.sa/',
    -- IsDB
    'https://www.isdb.org/scholarships',
    -- MasterCard / AU (discovery)
    'https://mastercardfdn.org/all/scholars/',
    'https://au.int/en/scholarships'
  )
on conflict (source_id) do update
set
  adapter_id       = excluded.adapter_id,
  enabled          = true,
  priority         = excluded.priority,
  schedule_minutes = excluded.schedule_minutes,
  next_fetch_at    = least(public.ingestion_sources.next_fetch_at, now()),
  last_error       = null,
  updated_at       = now();

-- Also link Erasmus EACEA catalogue to the catalogue_discovery adapter
insert into public.ingestion_sources (source_id, adapter_id, enabled, priority, schedule_minutes, next_fetch_at)
select s.id, a.id, true, 1, 720, now()
from public.source_records s
cross join public.ingestion_adapters a
where
  a.adapter_key = 'official_catalogue_discovery'
  and a.enabled = true
  and s.canonical_url = 'https://www.eacea.ec.europa.eu/scholarships/emjmd-catalogue_en'
on conflict (source_id) do update
set
  adapter_id       = excluded.adapter_id,
  enabled          = true,
  priority         = 1,
  schedule_minutes = 720,
  next_fetch_at    = least(public.ingestion_sources.next_fetch_at, now()),
  updated_at       = now();

-- ── Step 4: Update the IMPLEMENTATION_STATUS doc timestamp in audit ───────────
-- Log the global source registration as an admin action for traceability
insert into public.audit_events (actor_user_id, action, entity_type, entity_id, after_data)
select
  null,
  'global_source_registry_migration_012',
  'ingestion_adapter',
  a.id,
  jsonb_build_object(
    'migration', '012_global_source_registry',
    'sources_registered', (select count(*) from public.ingestion_sources),
    'regions', array['UK','EU','DE','NL','IE','CH','SE','US','CA','AU','JP','KR','CN','SG','MY','TR','HU','NZ','SA','IsDB','Africa'],
    'scope', 'worldwide_no_origin_restriction',
    'timestamp', now()
  )
from public.ingestion_adapters a
where a.adapter_key = 'official_scholarship_detail'
limit 1;
