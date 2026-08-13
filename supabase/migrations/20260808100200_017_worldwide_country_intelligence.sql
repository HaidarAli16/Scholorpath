-- Migration 017: worldwide country intelligence

do $$
begin
  set search_path = '';

  -- US
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'US', 'united-states', 'United States', '🇺🇸', 'USD', '$', 'English', 'F-1 Student Visa',
    'higher', 185.00, 'USD', 20000.00, 'USD', 9,
    20, 12, 1000.00, 2500.00, 'USD',
    'Top destination with world-class universities.', 'Private health insurance required.', 'On-campus work allowed; off-campus requires authorization (CPT/OPT).', '12 months OPT standard; up to 36 months for STEM.', 'Varies widely by region.', 'Highly diverse and international.', 'Visa process requires interview and strict intent-to-return check.', 'published'
  ) on conflict (code) do nothing;

  -- CA
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'CA', 'canada', 'Canada', '🇨🇦', 'CAD', '$', 'English', 'Study Permit',
    'moderate', 150.00, 'CAD', 20635.00, 'CAD', 12,
    20, 36, 1200.00, 2500.00, 'CAD',
    'Welcoming environment with strong post-study opportunities.', 'Provincial health plans available for students in most provinces.', 'Off-campus work allowed up to 20 hours/week.', 'Post-Graduation Work Permit (PGWP) up to 3 years.', 'Cold winters, pleasant summers.', 'Multicultural and safe.', 'Recent policy changes have introduced caps, check latest rules.', 'published'
  ) on conflict (code) do nothing;

  -- AU
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'AU', 'australia', 'Australia', '🇦🇺', 'AUD', '$', 'English', 'Student Visa (Subclass 500)',
    'moderate', 710.00, 'AUD', 24505.00, 'AUD', 12,
    48, 24, 1500.00, 3000.00, 'AUD',
    'High quality of life and excellent education system.', 'Overseas Student Health Cover (OSHC) is mandatory.', 'Work up to 48 hours per fortnight.', 'Temporary Graduate visa available for 2-4 years.', 'Generally warm and sunny.', 'Vibrant international student community.', 'Strict English and financial requirements.', 'published'
  ) on conflict (code) do nothing;

  -- JP
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'JP', 'japan', 'Japan', '🇯🇵', 'JPY', '¥', 'Japanese', 'Student Visa',
    'moderate', 3000.00, 'JPY', 1500000.00, 'JPY', 12,
    28, 12, 100000.00, 200000.00, 'JPY',
    'Unique blend of traditional and cutting-edge culture.', 'National Health Insurance covers 70% of medical costs.', 'Requires permission, up to 28 hours per week.', 'Can switch to Designated Activities visa to job hunt.', 'Four distinct seasons.', 'Safe and orderly.', 'Certificate of Eligibility (COE) required from school first.', 'published'
  ) on conflict (code) do nothing;

  -- KR
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'KR', 'south-korea', 'South Korea', '🇰🇷', 'KRW', '₩', 'Korean', 'D-2 Student Visa',
    'moderate', 60.00, 'USD', 20000000.00, 'KRW', 12,
    20, 6, 800000.00, 1500000.00, 'KRW',
    'Dynamic technology hub with strong government support for international students.', 'Mandatory National Health Insurance.', 'Requires permission from university and immigration.', 'D-10 Job Seeker visa available.', 'Four distinct seasons.', 'Fast-paced and modern.', 'Straightforward if accepted by recognized university.', 'published'
  ) on conflict (code) do nothing;

  -- SG
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'SG', 'singapore', 'Singapore', '🇸🇬', 'SGD', '$', 'English', 'Student''s Pass',
    'lower', 90.00, 'SGD', 8400.00, 'SGD', 12,
    16, 1, 1000.00, 2500.00, 'SGD',
    'Global financial center and educational hub in Asia.', 'Institutions typically provide medical insurance.', 'Allowed during term for specific institutions.', 'Long-Term Visit Pass available for job hunting.', 'Tropical, hot and humid year-round.', 'Extremely safe and multicultural.', 'Efficient online processing.', 'published'
  ) on conflict (code) do nothing;

  -- MY
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'MY', 'malaysia', 'Malaysia', '🇲🇾', 'MYR', 'RM', 'Malay', 'Student Pass',
    'lower', 1060.00, 'MYR', 15000.00, 'MYR', 12,
    20, 0, 1500.00, 3000.00, 'MYR',
    'Affordable education with many international branch campuses.', 'Medical insurance is mandatory.', 'Allowed during semester breaks only (max 20 hours).', 'No automatic post-study work visa.', 'Tropical climate.', 'Diverse, friendly and food-centric.', 'EMGS handles process efficiently.', 'published'
  ) on conflict (code) do nothing;

  -- TR
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'TR', 'turkey', 'Turkey', '🇹🇷', 'TRY', '₺', 'Turkish', 'Student Visa',
    'lower', 60.00, 'USD', 5000.00, 'USD', 12,
    24, 0, 8000.00, 20000.00, 'TRY',
    'Crossroads of Europe and Asia with generous government scholarships.', 'General Health Insurance (GSS) available.', 'Undergraduates cannot work; graduates can with permit.', 'Must find employer sponsorship to stay.', 'Varies by region.', 'Rich history and hospitable culture.', 'Relatively easy with university acceptance.', 'published'
  ) on conflict (code) do nothing;

  -- HU
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'HU', 'hungary', 'Hungary', '🇭🇺', 'HUF', 'Ft', 'Hungarian', 'Residence Permit for Study',
    'moderate', 110.00, 'EUR', 6000.00, 'EUR', 12,
    24, 9, 150000.00, 300000.00, 'HUF',
    'Affordable European destination known for Stipendium Hungaricum.', 'Health insurance is required.', 'Up to 24 hours per week during term.', 'Study-to-work visa available for 9 months.', 'Continental climate.', 'Historic cities and vibrant student life.', 'Standard Schengen-area student rules apply.', 'published'
  ) on conflict (code) do nothing;

  -- NZ
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'NZ', 'new-zealand', 'New Zealand', '🇳🇿', 'NZD', '$', 'English', 'Fee Paying Student Visa',
    'moderate', 430.00, 'NZD', 20000.00, 'NZD', 12,
    20, 36, 1200.00, 2500.00, 'NZD',
    'Stunning nature and safe, high-quality learning environment.', 'International student insurance required.', 'Up to 20 hours per week.', 'Post-study work visa up to 3 years depending on qualification.', 'Temperate climate.', 'Relaxed and inclusive.', 'Clear requirements, strict on health and character.', 'published'
  ) on conflict (code) do nothing;

  -- SA
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'SA', 'saudi-arabia', 'Saudi Arabia', '🇸🇦', 'SAR', '﷼', 'Arabic', 'Student Visa',
    'lower', 0.00, 'SAR', 0.00, 'SAR', 12,
    0, 0, 2000.00, 4000.00, 'SAR',
    'Emerging education hub with fully funded scholarships.', 'Provided by the institution.', 'Generally not permitted on student visa.', 'Requires employer sponsorship.', 'Desert climate, extremely hot summers.', 'Conservative, rapidly modernizing.', 'Visas usually facilitated entirely by the university.', 'published'
  ) on conflict (code) do nothing;

  -- CN
  insert into public.countries (
    code, slug, name, flag_emoji, currency_code, currency_symbol, primary_language, student_route_name,
    visa_difficulty, visa_fee_amount, visa_fee_currency, proof_funds_amount, proof_funds_currency, proof_funds_period_months,
    work_hours_term, post_study_months, monthly_cost_low, monthly_cost_high, cost_currency,
    summary, healthcare_summary, work_summary, post_study_summary, climate_summary, community_summary, visa_uncertainty, state
  ) values (
    'CN', 'china', 'China', '🇨🇳', 'CNY', '¥', 'Chinese', 'X1 Visa',
    'moderate', 100.00, 'USD', 25000.00, 'CNY', 12,
    0, 0, 1500.00, 4000.00, 'CNY',
    'Massive investment in higher education and global partnerships.', 'Comprehensive medical insurance required.', 'Internships allowed with permission, general work restricted.', 'Excellent graduates can obtain work permits.', 'Varies significantly from north to south.', 'Fast-developing and technologically advanced.', 'Requires JW201/JW202 form from university.', 'published'
  ) on conflict (code) do nothing;

end;
$$;
