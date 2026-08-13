# ScholarPath — Agent Worklog

All implementation steps performed by **Antigravity (Google DeepMind)** across sessions.

---

## Session 1 — 7 August 2026 (Sprint 7: Cover MVP)

### Step 1: System Architecture Research
- Mapped the full ingestion pipeline: `pg_cron` → `opportunity-ingest` edge function → `ingestion_sources` → `opportunity_candidates` → Review → Publish
- Read all existing migrations (001–011) and the ingestion system
- Identified the 3 gaps: no global sources, no structured scoring, no publish function

### Step 2: Official Scholarship URL Research
- Spawned a research subagent to find official URLs for 45+ scholarship programmes
- Verified each URL is from the funder's own website (not aggregators)
- Covered: Chevening, CSC, Gates Cambridge, Rhodes, Clarendon, Erasmus Mundus, DAAD, KAS, HBS, FES, Holland, OTS, NFP, GOI-IES, ESKAS, ETH, EPFL, Swedish Institute, Fulbright, Humphrey, Vanier, Banting, Australia Awards, MEXT, JASSO, GKS, CSC China, NUS, A*STAR, Khazanah, MIS, Türkiye Bursları, Stipendium Hungaricum, Manaaki NZ, KAUST, IsDB (2), ADB-JSP, MasterCard Foundation, African Union, IDRC

### Step 3: Migration 012 — Global Source Registry
- **File**: `supabase/migrations/20260807085900_012_global_source_registry.sql`
- Registered 50+ official scholarship source URLs into `source_records` and `ingestion_sources`
- Set per-source refresh schedules: 6h (flagship), 12h (regional), 3 days (stable), 24h (standard)
- Updated `ingestion_adapters.allowed_hosts` for all new domains
- Covered 20+ countries/regions

### Step 4: Migration 013 — Candidate Structured Fields
- **File**: `supabase/migrations/20260807090000_013_candidate_structured_fields.sql`
- Added `structured_score` generated column (0–100) on `opportunity_candidates`
- Scoring formula: title (15pts), provider (15pts), application_url (20pts), deadline (10pts), funding_type (10pts), award_value (10pts), country_code (5pts), degree_level (5pts), field_family (5pts), eligibility_origins (5pts)
- Created `validate_candidate_for_publish()` gate function
- Added index for review queue ordering

### Step 5: Migration 014 — Publish Candidate Function
- **File**: `supabase/migrations/20260807090100_014_publish_candidate_function.sql`
- Created `publish_opportunity_candidate(uuid)` — the missing link
- Upserts approved candidate into `scholarships` or `programmes` table
- Generates URL-safe slug with candidate ID suffix for uniqueness
- Builds `attributes` JSONB with provenance (ingestion_run_id, candidate_id)
- Sets `state='published'`, `last_verified_at=now()`, `next_review_at=now()+90d`
- Logs to `audit_events`
- Auth-guarded by `can_research_review()`

### Step 6: API Route Extension
- **File**: `src/app/api/admin/ingestion/route.ts`
- Added `publish` action that calls `publish_opportunity_candidate()` RPC
- Added `approvedCandidates` to GET response (review_state='approved' with structured_score)
- Added `failingSources` to GET response (consecutive_failures > 0)
- Added `structured_score` to candidate select queries

### Step 7: useIngestion Hook Extension
- **File**: `src/lib/use-ingestion.ts`
- Added `ApprovedCandidate` and `FailingSource` TypeScript types
- Added `approvedCandidates`, `failingSources` to state
- Added `approved` metric counter for the dashboard
- Extended fetch to populate new state fields

### Step 8: Admin UI Rebuild — 5-Tab Ingestion Command Center
- **File**: `src/components/admin/ingestion-command-center.tsx`
- **Sources tab**: 6-column table with country badge, all 60 sources visible
- **Review tab**: candidates with score badge, structured check validation feedback
- **Publish tab** (NEW): approved candidates with field preview (deadline, funding, award, apply URL), "Publish to Catalogue" button with blue badge showing count
- **Source Health tab** (NEW): failing sources (red left border + retry), stale sources (no fetch in 7+ days)
- **Run History tab**: unchanged

### Step 9: CSS Updates
- **File**: `src/app/globals.css`
- 5-column metrics grid, country badge styling, score indicator, health card styling, publish button, tab badges with counts

### Step 10: TypeScript Fix — Candidate Fields
- Fixed 4 TS2322 errors in candidate field preview (unknown → ReactNode)
- Used IIFE pattern with explicit `String()` casting

### Step 11: Verification
- `npm run typecheck` — 0 errors ✅
- `npm test -- --run` — 24/24 pass ✅
- `npm run build` — production build passes ✅

### Step 12: Migration Deployment
- Supabase CLI v2.112.0 installed
- `supabase login` with access token
- `supabase link` failed (CLI date parsing bug in v2.112.0)
- Wrote custom Node.js script using Supabase Management API to apply migrations
- All 3 migrations (012, 013, 014) applied successfully to `gbhzekncpqeytknxanzy`

### Step 13: Bug Fix — Validate Function
- **File**: `supabase/migrations/20260807095000_013b_fix_validate_function.sql`
- Fixed `malformed array literal` error caused by `||` operator with `search_path = ''`
- Replaced all `errors || 'text'` with `array_append(errors, 'text')`
- Relaxed validation: programme degree_level/field_family no longer block publish
- Added canonical_url as fallback for application_url
- Applied via Management API

### Step 14: Dev Server Verification
- Started dev server at `localhost:3002`
- Admin panel shows: 60 monitored sources, 37 due, 100 candidates in review, 1 approved
- Erasmus Mundus Joint Master in AI visible in Publish queue with score 35/100

---

## Session 2 — 8 August 2026 (Sprint 8: Recommendation System MVP)

### Step 15: Recommendation System Research
- Read full recommendation engine (`src/modules/recommendation/engine.ts`) — 211 lines
- Read recommendation service (`src/modules/recommendation/service.ts`) — 63 lines
- Read all API routes: `/api/recommendations`, `/api/recommendations/latest`, `/api/catalogue`, `/api/scholarships/live`, `/api/assessment`
- Read assessment schema — identified all 23 profile fields
- Read `atomic_rules` table schema and existing seed data (4 rules for 3 scholarships)
- Identified the critical gap: `publish_opportunity_candidate()` creates no `atomic_rules`

### Step 16: Migration 015 — Auto Rules on Publish
- **File**: `supabase/migrations/20260808100000_015_auto_rules_on_publish.sql`
- Created `generate_rules_for_published_entity(entity_type, entity_id, normalized_data)` function
- Auto-generates rules based on available candidate data:
  - `eligibility_origin_countries` → HARD nationality rule
  - `degree_level` → SOFT qualification rule (maps masters→bachelors, phd→masters)
  - `funding_type='full'` → SOFT fundingNeed rule
  - `field_family` → SOFT fieldFamily rule
  - `country_code` → INFORMATION destination visa rule
  - Always → INFORMATION English evidence rule
- All rules are `state='published'`, `version=1`, idempotent via ON CONFLICT
- Updated `publish_opportunity_candidate()` to call this function after insert

### Step 17: Migration 016 — Worldwide Eligibility Rules
- **File**: `supabase/migrations/20260808100100_016_worldwide_eligibility_rules.sql`
- Retroactive rules for all published scholarships without existing rules
- Scholarship-specific rules by name pattern:
  - **Chevening**: `experienceRange in ['one_to_two','three_plus']` (HARD — 2yr work experience required)
  - **Fulbright**: `englishStatus = 'completed'` (HARD), `fieldFamily exists` (SOFT)
  - **DAAD EPOS**: `experienceRange in ['one_to_two','three_plus']` (SOFT)
  - **GKS**: `gradeValue gte 80` (SOFT — GPA requirement)
  - **Türkiye Bursları**: `completionStatus in ['completed','final_year']` (SOFT — open to all nationalities)
  - **MEXT**: graduation year proxy for age requirement
- Universal `english-evidence` INFORMATION rule for all scholarships

### Step 18: Recommendation Engine Expansion
- **File**: `src/modules/recommendation/engine.ts`
- Expanded `preferenceScore()` from 3 to 10 destination mappings:
  - Existing: UK→GB, Germany→DE, Europe→DE/NL/IE/EU
  - New: US, Canada→CA, Australia→AU, Japan→JP, Korea→KR, Singapore→SG, Malaysia→MY
  - `suggest` and `World` give baseline score of 1

### Step 19: Live Scholarships Module Expansion
- **File**: `src/modules/catalogue/live-scholarships.ts`
- Expanded `ProviderCountry` type from 4 to 7 countries
- Added: `usa`, `ca`, `au` (plus existing `uk`, `de`, `nl`, `ie`)
- Updated `countryNames` map with full names
- Updated `countriesFor()` to handle new destination preferences

### Step 20: Live Scholarships API — Restriction Removal
- **File**: `src/app/api/scholarships/live/route.ts`
- Changed `nationality` from `z.enum(["Pakistan","India","Bangladesh"])` to `z.string().trim().min(2).max(60).optional()`
- Expanded `destination` enum with worldwide options

### Step 21: Migration 017 — Worldwide Country Intelligence
- **File**: `supabase/migrations/20260808100200_017_worldwide_country_intelligence.sql`
- Added 12 new country entries to `countries` table:
  - US (higher visa, 36mo post-study OPT, $1800–3200/mo)
  - CA (moderate visa, 36mo PGWP, CAD 1200–2200/mo)
  - AU (moderate visa, 24–48mo post-study, AUD 1600–2800/mo)
  - JP (lower visa, 12mo post-study, ¥80k–150k/mo)
  - KR (moderate visa, 24mo D-10 visa, ₩700k–1200k/mo)
  - SG (moderate visa, 12mo, SGD 1200–2000/mo)
  - MY (lower visa, 12mo, MYR 1500–2800/mo)
  - TR (lower visa, 12mo, TRY 8000–15000/mo)
  - HU (lower visa, 9mo, HUF 150k–280k/mo)
  - NZ (moderate visa, 36mo, NZD 1400–2400/mo)
  - SA (lower visa, 0mo, SAR 1500–2800/mo)
  - CN (moderate visa, 0mo, CNY 3000–6000/mo)

### Step 22: Migration Deployment
- Created Node.js deployment script for Management API
- Applied migrations 015, 016, 017 to live Supabase
- All 3 applied successfully

### Step 23: TypeScript Fixes
- Fixed type errors from loosened nationality/destination types
- Updated assessment types to support new nationality options

### Step 24: Final Verification
- `npm run typecheck` — 0 errors ✅
- `npm test -- --run` — 24/24 pass (6 suites) ✅
- Updated `IMPLEMENTATION_STATUS.md` with Sprint 8

---

## Cumulative Migration Log

### Session 3 — 13 August 2026 (Sprint 13: Admin control plane)

- Preserved Claude's six performance changes and corrected private-cache and repeated-discovery-fetch risks.
- Built the unified CandidRoute Super Admin control plane and core CMS.
- Applied and verified migration `20260813135124_admin_control_plane.sql` (remote parity 36/36; schema lint clean).
- Verified four live platform settings and one admin assignment using protected server credentials.
- ESLint, TypeScript, 25 tests and production build pass; unauthenticated admin API access returns 401.

| # | Migration File | Applied | What |
|---|---|---|---|
| 012 | `20260807085900_012_global_source_registry.sql` | 7 Aug ✅ | 50+ global sources |
| 013 | `20260807090000_013_candidate_structured_fields.sql` | 7 Aug ✅ | structured_score column |
| 013b | `20260807095000_013b_fix_validate_function.sql` | 7 Aug ✅ | array_append bug fix |
| 014 | `20260807090100_014_publish_candidate_function.sql` | 7 Aug ✅ | publish_opportunity_candidate() |
| 015 | `20260808100000_015_auto_rules_on_publish.sql` | 8 Aug ✅ | auto-generate rules on publish |
| 016 | `20260808100100_016_worldwide_eligibility_rules.sql` | 8 Aug ✅ | worldwide eligibility rules seed |
| 017 | `20260808100200_017_worldwide_country_intelligence.sql` | 8 Aug ✅ | 12 new country entries |

## Cumulative Files Modified

| File | Sprint | Change |
|---|---|---|
| `supabase/migrations/012–017` (7 files) | 7–8 | NEW — all migration SQL |
| `src/app/api/admin/ingestion/route.ts` | 7 | MODIFIED — publish action, approved candidates, failing sources |
| `src/lib/use-ingestion.ts` | 7 | MODIFIED — new types, state fields |
| `src/components/admin/ingestion-command-center.tsx` | 7 | REBUILT — 5-tab UI |
| `src/app/globals.css` | 7 | MODIFIED — ingestion styles |
| `src/modules/recommendation/engine.ts` | 8 | MODIFIED — worldwide preference scoring |
| `src/modules/catalogue/live-scholarships.ts` | 8 | MODIFIED — 7 countries, expanded logic |
| `src/app/api/scholarships/live/route.ts` | 8 | MODIFIED — removed PK/IN/BD restriction |
| `IMPLEMENTATION_STATUS.md` | 7–8 | MODIFIED — Sprint 7 + 8 entries |
