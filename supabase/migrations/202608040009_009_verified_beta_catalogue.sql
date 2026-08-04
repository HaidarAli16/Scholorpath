-- First source-backed beta catalogue. Closed cycles stay stale and are never recommended.

insert into public.source_records
  (canonical_url, source_type, owner_name, country_code, status, last_verified_at, next_review_at, verification_notes)
values
  ('https://courses.leeds.ac.uk/I071/data_science_and_analytics_msc', 'institution', 'University of Leeds', 'GB', 'verified', '2026-08-04', '2026-09-04', '2026 on-campus course, entry requirements, fees and published international deadline'),
  ('https://courses.leeds.ac.uk/d053/data-science-statistics-msc', 'institution', 'University of Leeds', 'GB', 'verified', '2026-08-04', '2026-09-04', '2026 online course, intake, entry context and fees'),
  ('https://www.uni-saarland.de/en/study/programmes/master/data-science.html', 'institution', 'Saarland University', 'DE', 'verified', '2026-08-04', '2026-09-04', 'DSAI curriculum, prerequisites, language, tuition and application windows'),
  ('https://www.tcd.ie/courses/postgraduate/courses/computer-science---data-science--mscpgraddip/', 'institution', 'Trinity College Dublin', 'IE', 'verified', '2026-08-04', '2026-09-04', 'Data Science course, intake, capacity and admission requirements'),
  ('https://www.tcd.ie/courses/postgraduate/fees/', 'institution', 'Trinity College Dublin', 'IE', 'verified', '2026-08-04', '2026-09-04', '2026/27 postgraduate fee schedule'),
  ('https://www.chevening.org/scholarships/application-timeline/', 'government', 'Chevening / UK Government', 'GB', 'verified', '2026-08-04', '2026-09-04', '2027-28 opening, closing and offer dates'),
  ('https://hea.ie/policy/internationalisation/goi-ies/', 'government_agency', 'Higher Education Authority Ireland', 'IE', 'verified', '2026-08-04', '2026-10-01', '2026 award, eligibility, value and closed deadline'),
  ('https://www.studyinnl.org/finances/nl-scholarship', 'government_agency', 'Nuffic / Study in NL', 'NL', 'verified', '2026-08-04', '2026-09-15', '2026-27 value, non-EEA eligibility and participating institutions'),
  ('https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777', 'government_agency', 'DAAD', 'DE', 'verified', '2026-08-04', '2026-09-15', 'EPOS scope, award and course-specific deadline model')
on conflict (canonical_url) do update set
  status = excluded.status,
  last_verified_at = excluded.last_verified_at,
  next_review_at = excluded.next_review_at,
  verification_notes = excluded.verification_notes;

insert into public.programmes
  (slug, institution_id, institution_name, title, country_code, level, field_family, intake_label, deadline_at, deadline_timezone, tuition_amount, tuition_currency, application_url, state, source_id, last_verified_at, next_review_at, attributes)
values
  ('leeds-data-science-analytics-msc-2026',
   (select id from public.institutions where slug = 'university-of-leeds'), 'University of Leeds', 'MSc Data Science and Analytics', 'GB', 'masters', 'Computing and information technology', 'September 2026', '2026-07-31 23:59:00+01', 'Europe/London', 34250, 'GBP', 'https://courses.leeds.ac.uk/I071/data_science_and_analytics_msc', 'stale',
   (select id from public.source_records where canonical_url = 'https://courses.leeds.ac.uk/I071/data_science_and_analytics_msc'), '2026-08-04', '2026-09-04',
   '{"delivery":"on_campus","duration_months":12,"ielts_overall":6.5,"ielts_min_component":6.0,"funding_signal":2,"closure_reason":"Published 2026 international deadline has passed"}'::jsonb),
  ('leeds-data-science-statistics-online-2026',
   (select id from public.institutions where slug = 'university-of-leeds'), 'University of Leeds', 'MSc Data Science (Statistics) Online', 'GB', 'masters', 'Natural sciences, mathematics and statistics', 'September 2026 / March 2027', null, 'Europe/London', 15000, 'GBP', 'https://courses.leeds.ac.uk/d053/data-science-statistics-msc', 'published',
   (select id from public.source_records where canonical_url = 'https://courses.leeds.ac.uk/d053/data-science-statistics-msc'), '2026-08-04', '2026-09-04',
   '{"delivery":"online","duration_months":24,"ielts_overall":6.5,"ielts_min_component":6.0,"funding_signal":4,"deadline_state":"open_check"}'::jsonb),
  ('saarland-data-science-ai-msc-2027-summer',
   (select id from public.institutions where slug = 'saarland-university'), 'Saarland University', 'MSc Data Science and Artificial Intelligence', 'DE', 'masters', 'Computing and information technology', 'Summer semester 2027', '2026-11-15 23:59:00+01', 'Europe/Berlin', 0, 'EUR', 'https://www.uni-saarland.de/en/study/programmes/master/data-science.html', 'published',
   (select id from public.source_records where canonical_url = 'https://www.uni-saarland.de/en/study/programmes/master/data-science.html'), '2026-08-04', '2026-09-04',
   '{"delivery":"on_campus","duration_months":24,"language_level":"C1","moi_accepted":false,"funding_signal":7,"semester_fee_applies":true}'::jsonb),
  ('trinity-computer-science-data-science-msc-2026',
   (select id from public.institutions where slug = 'trinity-college-dublin'), 'Trinity College Dublin', 'MSc Computer Science – Data Science', 'IE', 'masters', 'Computing and information technology', 'September 2026', '2026-01-30 23:59:00+00', 'Europe/Dublin', 27790, 'EUR', 'https://www.tcd.ie/courses/postgraduate/courses/computer-science---data-science--mscpgraddip/', 'stale',
   (select id from public.source_records where canonical_url = 'https://www.tcd.ie/courses/postgraduate/courses/computer-science---data-science--mscpgraddip/'), '2026-08-04', '2026-09-04',
   '{"delivery":"on_campus","duration_months":12,"places":30,"funding_signal":2,"closure_reason":"Published 2026 closing date has passed"}'::jsonb)
on conflict (slug) do update set
  institution_id = excluded.institution_id,
  intake_label = excluded.intake_label,
  deadline_at = excluded.deadline_at,
  tuition_amount = excluded.tuition_amount,
  state = excluded.state,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  next_review_at = excluded.next_review_at,
  attributes = excluded.attributes;

insert into public.programme_intakes
  (programme_id, intake_label, starts_on, application_opens_at, application_deadline_at, timezone, capacity_state, source_id, state, last_verified_at, next_review_at)
select p.id, valueset.intake_label, valueset.starts_on::date, valueset.opens_at::timestamptz, valueset.deadline_at::timestamptz, valueset.timezone, valueset.capacity_state,
       p.source_id, valueset.state::public.record_state, '2026-08-04'::timestamptz, '2026-09-04'::timestamptz
from (values
  ('leeds-data-science-analytics-msc-2026','September 2026','2026-09-01',null,'2026-07-31 23:59:00+01','Europe/London','closed','stale'),
  ('leeds-data-science-statistics-online-2026','March 2027','2027-03-01',null,null,'Europe/London','unknown','published'),
  ('saarland-data-science-ai-msc-2027-summer','Summer semester 2027','2027-04-01',null,'2026-11-15 23:59:00+01','Europe/Berlin','open','published'),
  ('trinity-computer-science-data-science-msc-2026','September 2026','2026-09-01',null,'2026-01-30 23:59:00+00','Europe/Dublin','closed','stale')
) as valueset(programme_slug,intake_label,starts_on,opens_at,deadline_at,timezone,capacity_state,state)
join public.programmes p on p.slug = valueset.programme_slug
on conflict (programme_id, intake_label) do update set
  application_deadline_at = excluded.application_deadline_at,
  capacity_state = excluded.capacity_state,
  state = excluded.state,
  last_verified_at = excluded.last_verified_at,
  next_review_at = excluded.next_review_at;

insert into public.scholarships
  (slug, provider_name, title, country_code, cycle_label, opens_at, deadline_at, deadline_timezone, award_type, award_value, application_url, state, source_id, last_verified_at, next_review_at, attributes)
values
  ('chevening-scholarship-2027-28', 'Chevening / UK Government', 'Chevening Scholarship 2027–28', 'GB', '2027–28', '2026-08-04 11:00:00+00', '2026-10-06 11:00:00+00', 'UTC', 'full_award', '{"coverage":"Published Chevening scholarship package; confirm country page"}'::jsonb, 'https://www.chevening.org/scholarships/application-timeline/', 'published',
   (select id from public.source_records where canonical_url = 'https://www.chevening.org/scholarships/application-timeline/'), '2026-08-04', '2026-09-04', '{"funding_signal":10,"offer_deadline":"2027-07-08T17:00:00+01:00","cycle_state":"open"}'::jsonb),
  ('government-of-ireland-international-education-2026', 'Higher Education Authority Ireland', 'Government of Ireland International Education Scholarship 2026', 'IE', '2026', null, '2026-03-12 17:00:00+00', 'Europe/Dublin', 'fee_waiver_plus_stipend', '{"amount":10000,"currency":"EUR","fee_waiver":true,"duration_years":1}'::jsonb, 'https://hea.ie/policy/internationalisation/goi-ies/', 'stale',
   (select id from public.source_records where canonical_url = 'https://hea.ie/policy/internationalisation/goi-ies/'), '2026-08-04', '2026-10-01', '{"funding_signal":10,"awards":60,"cycle_state":"closed"}'::jsonb),
  ('nl-scholarship-2026-27', 'Dutch Ministry of Education and participating institutions', 'NL Scholarship 2026–27', 'NL', '2026–27', '2025-11-01 00:00:00+01', null, 'Europe/Amsterdam', 'partial_award', '{"amount":5000,"currency":"EUR","first_year_only":true}'::jsonb, 'https://www.studyinnl.org/finances/nl-scholarship', 'published',
   (select id from public.source_records where canonical_url = 'https://www.studyinnl.org/finances/nl-scholarship'), '2026-08-04', '2026-09-15', '{"funding_signal":4,"deadline_state":"institution_specific","non_eea_only":true}'::jsonb),
  ('daad-epos-2027-28', 'DAAD', 'Development-Related Postgraduate Courses (EPOS) 2027–28', 'DE', '2027–28', null, null, 'Europe/Berlin', 'monthly_stipend_and_support', '{"amount":992,"currency":"EUR","frequency":"monthly","level":"graduate"}'::jsonb, 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777', 'published',
   (select id from public.source_records where canonical_url = 'https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database?detail=50076777'), '2026-08-04', '2026-09-15', '{"funding_signal":9,"deadline_state":"course_specific","eligible_course_list_required":true}'::jsonb)
on conflict (slug) do update set
  opens_at = excluded.opens_at,
  deadline_at = excluded.deadline_at,
  award_value = excluded.award_value,
  state = excluded.state,
  source_id = excluded.source_id,
  last_verified_at = excluded.last_verified_at,
  next_review_at = excluded.next_review_at,
  attributes = excluded.attributes;

-- Conservative rules: only official, directly profile-addressable requirements become gates.
insert into public.atomic_rules
  (entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version)
select 'programme', p.id, r.rule_key, r.rule_group, r.operator, r.profile_field, r.expected_value::jsonb, r.severity, r.explanation, 'published', 1
from public.programmes p
join (values
  ('leeds-data-science-statistics-online-2026','relevant-subject','academic','in','fieldFamily','["Computing and information technology","Natural sciences, mathematics and statistics"]','soft','A computing, mathematics or statistics background aligns with the published course context.'),
  ('leeds-data-science-statistics-online-2026','english-evidence','language','eq','englishStatus','"completed"','information','Verified English-language evidence is needed before enrolment.'),
  ('saarland-data-science-ai-msc-2027-summer','relevant-subject','academic','in','fieldFamily','["Computing and information technology","Natural sciences, mathematics and statistics"]','hard','The programme requires computer science, informatics or a closely related academic background.'),
  ('saarland-data-science-ai-msc-2027-summer','english-evidence','language','eq','englishStatus','"completed"','information','Accepted C1 English evidence is required; a medium-of-instruction letter is not accepted.')
) as r(programme_slug,rule_key,rule_group,operator,profile_field,expected_value,severity,explanation)
  on p.slug = r.programme_slug
on conflict (entity_type, entity_id, rule_key, version) do update set
  expected_value = excluded.expected_value,
  severity = excluded.severity,
  explanation = excluded.explanation,
  state = excluded.state;

insert into public.atomic_rules
  (entity_type, entity_id, rule_key, rule_group, operator, profile_field, expected_value, severity, explanation, state, version)
select 'scholarship', s.id, r.rule_key, r.rule_group, r.operator, r.profile_field, r.expected_value::jsonb, r.severity, r.explanation, 'published', 1
from public.scholarships s
join (values
  ('chevening-scholarship-2027-28','target-origin','eligibility','in','nationality','["Pakistan","India","Bangladesh"]','hard','The selected South Asian origin has a Chevening country or territory route; the country page must still be checked.'),
  ('nl-scholarship-2026-27','non-eea-origin','eligibility','in','nationality','["Pakistan","India","Bangladesh"]','hard','The NL Scholarship is for applicants from outside the EEA.'),
  ('daad-epos-2027-28','target-origin','eligibility','in','nationality','["Pakistan","India","Bangladesh"]','soft','Origin eligibility and the selected EPOS course list must be verified for the current cycle.'),
  ('daad-epos-2027-28','experience-evidence','experience','in','experienceRange','["one_to_two","three_plus"]','soft','EPOS routes commonly require relevant professional experience; verify the selected course requirement.')
) as r(scholarship_slug,rule_key,rule_group,operator,profile_field,expected_value,severity,explanation)
  on s.slug = r.scholarship_slug
on conflict (entity_type, entity_id, rule_key, version) do update set
  expected_value = excluded.expected_value,
  severity = excluded.severity,
  explanation = excluded.explanation,
  state = excluded.state;
