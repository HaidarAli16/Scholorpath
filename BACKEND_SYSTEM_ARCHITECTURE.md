# ScholarPath — Backend Architecture & End-to-End Flow

**Last updated**: 8 August 2026
**Agent**: Antigravity (Google DeepMind)
**Stack**: Next.js 15 (App Router) + Supabase (PostgreSQL 17) + Vercel

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        STUDENT LAYER                         │
│  Onboarding → Assessment → Recommendations → Applications   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      API LAYER (Next.js)                     │
│  /api/assessment    /api/recommendations    /api/catalogue   │
│  /api/scholarships/live   /api/admin/ingestion               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    ENGINE LAYER (TypeScript)                  │
│  Assessment Engine → Recommendation Engine → Intelligence    │
│  Live Scholarships Module → Catalogue Service                │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   DATABASE LAYER (Supabase)                   │
│  scholarships │ programmes │ atomic_rules │ countries        │
│  assessments │ recommendation_runs │ recommendation_components│
│  opportunity_candidates │ ingestion_sources │ ingestion_runs │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Data Ingestion Pipeline

### Flow

```
pg_cron (every 1 min)
  ↓
Picks due sources from ingestion_sources (by schedule_minutes + last_fetched_at)
  ↓
Calls Edge Function: supabase/functions/opportunity-ingest/
  ↓
Fetches official source URL (HTML/JSON)
  ↓
Runs ingestion_adapter (official_scholarship_detail / official_programme_detail / official_catalogue_discovery)
  ↓
Creates/updates opportunity_candidates with normalized_data JSONB
  ↓
Records ingestion_run (http_status, body_bytes, candidates_found, duration_ms)
```

### Key Tables

| Table | Purpose |
|---|---|
| `source_records` | Master record of an official source (URL, owner, trust level) |
| `ingestion_sources` | Scheduler entries: source_id + adapter + schedule_minutes + priority |
| `ingestion_adapters` | Adapter configs: name, allowed_hosts, scraping rules |
| `ingestion_runs` | Execution log: each fetch attempt with status, timing, results |
| `opportunity_candidates` | Raw parsed data from sources, pending human review |

### Source Coverage (60 sources, 20+ countries)

| Region | Count | Refresh |
|---|---|---|
| UK (Chevening, CSC, Gates, Rhodes, Clarendon) | 7 | 6h–3d |
| EU (Erasmus Mundus EACEA, MSCA) | 2 | 12h |
| Germany (DAAD, KAS, HBS, FES) | 5 | 12h–24h |
| Netherlands (Holland, OTS, OKP) | 3 | 12h |
| Ireland, Switzerland, Sweden | 5 | 12h–3d |
| USA (Fulbright, Humphrey) | 2 | 12h |
| Canada (Vanier, Banting, IDRC) | 3 | 12h–3d |
| Australia (Awards) | 1 | 12h |
| Japan (MEXT, JASSO, ADB-JSP) | 3 | 12h |
| Korea (GKS) | 2 | 12h |
| China (CSC) | 1 | 12h |
| Singapore (NUS, A*STAR) | 2 | 3d |
| Malaysia (Khazanah, MIS) | 2 | 12h |
| Turkey, Hungary, New Zealand | 3 | 12h |
| Saudi Arabia (KAUST) | 1 | 3d |
| IsDB (Merit, Need-Based) | 2 | 12h |
| Global (MasterCard, African Union) | 2 | 24h |

---

## 2. Review & Publish Pipeline

### Flow

```
opportunity_candidates (review_state = 'pending_review')
  ↓
Admin reviews in /admin → Ingestion → Review tab
  ↓
structured_score (0–100) computed column guides priority:
  - title (15), provider (15), application_url (20), deadline (10)
  - funding_type (10), award_value (10), country_code (5)
  - degree_level (5), field_family (5), eligibility_origins (5)
  ↓
Admin clicks Approve → review_state = 'approved'
  ↓
Admin goes to Publish tab → clicks "Publish to catalogue"
  ↓
API calls publish_opportunity_candidate(candidate_id)
  ↓
DB function:
  1. Auth check (can_research_review)
  2. Load + lock candidate
  3. Validate via validate_candidate_for_publish()
  4. Parse normalized_data into table columns
  5. UPSERT into scholarships or programmes
  6. Auto-generate atomic_rules via generate_rules_for_published_entity()
  7. Mark candidate review_state = 'published'
  8. Log to audit_events
  ↓
Scholarship/programme now visible in /discover and recommendation engine
```

### Auto-Generated Rules (on publish)

When a candidate is published, `generate_rules_for_published_entity()` creates these rules automatically:

| Condition | Rule Type | Severity | Profile Field | Operator |
|---|---|---|---|---|
| `eligibility_origin_countries` exists | Nationality gate | HARD | `nationality` | `in` |
| `degree_level` = masters | Qualification check | SOFT | `qualification` | `in` |
| `degree_level` = phd | Qualification check | SOFT | `qualification` | `in` |
| `funding_type` = full | Funding need match | SOFT | `fundingNeed` | `in` |
| `field_family` exists | Field alignment | SOFT | `fieldFamily` | `in` |
| `country_code` exists | Destination visa | INFO | `destinationPreference` | `exists` |
| Always | English evidence | INFO | `englishStatus` | `eq` |

### validate_candidate_for_publish() checks

- `review_state = 'approved'` (must be approved first)
- `title` length ≥ 2
- `provider_name` length ≥ 2
- `application_url` length ≥ 10 (fallback: canonical_url)

---

## 3. Recommendation Engine

### Architecture

```
POST /api/recommendations
  ↓
Load user's latest completed assessment (answers JSONB = profile)
  ↓
evaluateCatalogue(supabase, profile, options)
  ↓
Parallel fetch:
  ├─ programmes (state='published')
  ├─ scholarships (state='published')
  ├─ atomic_rules (state='published')
  └─ countries (state='published')
  ↓
Build ruleMap: Map<"entity_type:entity_id", AtomicRule[]>
Build countryMap: Map<country_code, CountryData>
  ↓
evaluateRecommendations(profile, entities[], now)
  ↓
For each entity:
  1. Evaluate all rules against profile
  2. Compute 10 score components
  3. Determine state (confirmed/conditional/failed/unknown/stale)
  4. Generate reasons, openChecks, failedGates, nextActions
  5. Calculate evidenceConfidence and auditTrace
  ↓
Sort by: state rank → score → title
  ↓
Persist via store_recommendation_run() (service_role only)
  ↓
Return results to student
```

### Score Components (100 points total)

| Component | Weight | How it's calculated |
|---|---|---|
| **Eligibility** | 30 | Hard rule pass rate. 0 if any hard gate fails. |
| **Academic fit** | 20 | Soft rule pass rate. Default 6 if no soft rules. |
| **Funding** | 12 | Entity's `funding_signal` (0–10 scale). Full scholarships score highest. |
| **Deadline** | 8 | Time-based: >60d=8, 30-60d=6.4, 14-30d=4, <14d=1.6, expired=0 |
| **Freshness** | 7 | verified=7, review_due=3.5, stale=0 |
| **Evidence** | 5 | Information rule pass rate. |
| **Affordability** | 8 | Country-based: DE=8, NL=5, GB/IE=4, others=5 |
| **Visa feasibility** | 5 | Country-based: lower=8, moderate=6, higher=3 |
| **Career alignment** | 3 | Derived from country's `post_study_months` |
| **Preference** | 2 | Destination match: exact=2, suggest/World=1, mismatch=0.5 |

### State Determination

```
stale       → entity.sourceFreshness === "stale" (capped at 55 score)
failed      → any hard gate failed (score forced to 0)
conditional → hard rules unknown OR open checks exist
confirmed   → all hard rules pass, no open checks, rules exist
unknown     → no rules attached to entity
```

### Rule Evaluation Logic

```typescript
compareRuleValue(actual, operator, expected) → true | false | null

Operators:
  eq        → actual === expected (case-insensitive strings)
  neq       → actual !== expected
  in        → expected[].includes(actual)
  not_in    → !expected[].includes(actual)
  gte       → actual >= expected (numbers only)
  lte       → actual <= expected
  contains_any → any overlap between arrays
  contains_all → all expected values in actual array
  exists    → actual is not null/undefined/empty

null return = "unknown" (profile field not provided)
```

### Worldwide Destination Preference Mapping

| Preference | Matches Country Codes |
|---|---|
| UK | GB |
| Germany | DE |
| Europe | DE, NL, IE, EU |
| US | US |
| Canada | CA |
| Australia | AU |
| Japan | JP |
| Korea | KR |
| Singapore | SG |
| Malaysia | MY |
| suggest / World | Baseline score (no boost) |

---

## 4. Assessment System

### Flow

```
Student fills onboarding form (5 steps)
  ↓
POST /api/assessment with all 23 fields
  ↓
Zod validation (assessmentInputSchema)
  ↓
generateAssessmentReport(input) → readiness dimensions, pathways, action plan
  ↓
fetchLiveScholarships(input) → third-party discovery leads
  ↓
If authenticated:
  - submit_assessment() RPC → saves assessment, profile, tasks atomically
  - store_intelligence_report() → persists intelligence analysis
  - evaluateCatalogue() → runs full recommendation engine
  ↓
Returns: report + intelligence + recommendations
```

### Profile Fields (used by recommendation engine)

| Field | Type | Used by rules |
|---|---|---|
| `firstName` | string | — |
| `nationality` | string | `nationality` rules (HARD) |
| `currentCountry` | string | — |
| `qualification` | string | `qualification` rules (SOFT) |
| `institution` | string | — |
| `fieldFamily` | enum (15 options) | `fieldFamily` rules (SOFT) |
| `completionStatus` | enum | `completionStatus` rules |
| `graduationYear` | number | age proxy rules |
| `gradeValue` | number | `gradeValue` rules (gte/lte) |
| `gradeMaximum` | 4/5/10/100 | grade normalization |
| `intake` | enum | timing alignment |
| `fundingNeed` | full/major/partial/self | `fundingNeed` rules (SOFT) |
| `budgetCurrency` | PKR/INR/BDT/USD | — |
| `availableBudget` | number | affordability checks |
| `destinationPreference` | enum | preference scoring |
| `englishStatus` | not_started/preparing/booked/completed | `englishStatus` rules (INFO/HARD) |
| `englishTest` | IELTS/TOEFL/PTE/Other | — |
| `englishScore` | number | score threshold rules |
| `experienceRange` | none/under_one/one_to_two/three_plus | `experienceRange` rules |
| `researchEvidence` | array | evidence scoring |
| `weeklyHours` | number | — |
| `biggestBlocker` | enum | — |

---

## 5. Country Intelligence Layer

### Data Points Per Country

| Field | Example (UK) |
|---|---|
| `code` | GB |
| `name` | United Kingdom |
| `visa_difficulty` | moderate |
| `visa_fee_usd` | 490 |
| `deposit_usd` | 1500 |
| `proof_of_funds_usd` | 14000 |
| `post_study_months` | 24 |
| `work_during_study_hours` | 20 |
| `monthly_cost_low` | 1100 |
| `monthly_cost_high` | 2200 |
| `healthcare_model` | NHS surcharge |
| `safety_summary` | text |
| `climate_summary` | text |
| `community_fit` | text |

### Countries in System (16 total)

**Original 4**: GB, DE, NL, IE
**Added in Sprint 8**: US, CA, AU, JP, KR, SG, MY, TR, HU, NZ, SA, CN

### How Countries Affect Recommendations

```
countrySignals(country_code) → {
  affordabilitySignal:     DE=8, NL=5, GB/IE=4, others=5
  visaFeasibilitySignal:   lower=8, moderate=6, higher=3
  careerSignal:            post_study_months / 2.4 (capped 2–10)
}
```

---

## 6. Live Discovery Feed (Third-Party)

### Flow

```
GET /api/scholarships/live?destination=UK&nationality=Pakistan&limit=12
  ↓
countriesFor(input) → pick WorqNow API countries to fetch
  ↓
Parallel fetch from https://api.worqnow.ai/education/{country}/scholarships
  + https://api.worqnow.ai/education/{country}/universities
  ↓
Parse, deduplicate, clean encoding artifacts
  ↓
Return LiveScholarshipPreview[] with:
  - verificationState: "third_party_discovery" (never auto-promoted)
  - fitReasons based on profile
```

### Covered Countries (WorqNow Feed)
UK, Germany, Netherlands, Ireland, USA, Canada, Australia

### Important: Discovery ≠ Recommendations
Live discovery items are **third-party leads**. They are never auto-promoted to the recommendation engine. Only officially reviewed and published scholarships enter the `scholarships` table and recommendation scoring.

---

## 7. Persistence & Security

### Row-Level Security (RLS)

| Table | Read | Write |
|---|---|---|
| `scholarships` | Published: anyone. All: staff. | Research role only |
| `programmes` | Published: anyone. All: staff. | Research role only |
| `atomic_rules` | Published: anyone. All: staff. | Research role only |
| `recommendation_runs` | Own user only | service_role only |
| `recommendation_components` | Own user only | service_role only |
| `assessments` | Own user only | Own user only |
| `opportunity_candidates` | Research role | Research role |

### Key DB Functions

| Function | Auth | Purpose |
|---|---|---|
| `submit_assessment()` | Authenticated | Atomic: saves assessment + profile + tasks |
| `store_recommendation_run()` | service_role only | Persist recommendation results |
| `store_intelligence_report()` | Authenticated | Persist intelligence analysis |
| `publish_opportunity_candidate()` | can_research_review | Publish candidate → live catalogue |
| `generate_rules_for_published_entity()` | Internal (called by publish) | Auto-create atomic rules |
| `validate_candidate_for_publish()` | Internal | Gate check before publish |
| `register_official_ingestion_source()` | Admin | Add new source URL |
| `adopt_opportunity_candidate()` | Research role | Promote discovery → monitored |

---

## 8. API Routes Reference

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/assessment` | POST | Optional | Submit assessment, get report + recommendations |
| `/api/recommendations` | POST | Optional | Run recommendation engine on profile |
| `/api/recommendations/latest` | GET | Required | Get latest recommendation run |
| `/api/catalogue` | GET | Optional | Browse published scholarships/programmes |
| `/api/scholarships/live` | GET | None | Third-party discovery feed |
| `/api/countries` | GET | None | Country intelligence data |
| `/api/institutions` | GET | None | Institution directory |
| `/api/fx` | GET | None | Currency exchange rates |
| `/api/admin/ingestion` | GET/POST | Admin | Ingestion command center |
| `/api/operations` | GET/POST | Research | Research operations |
| `/api/tasks` | GET/PATCH | Required | User task management |
| `/api/tasks/generate` | POST | Required | Generate tasks from assessment |
| `/api/workspace` | GET | Required | User workspace data |
| `/api/documents/*` | Various | Required | Document management |
| `/api/references/*` | Various | Token | Reference management |

---

## 9. Future Improvements

### Accuracy Improvements (Recommended Next)

- [ ] **Structured deadline parser** — extract actual dates from `deadline_text` strings ("January 2027", "Rolling", "15 March 2027") and populate `deadline_at` properly
- [ ] **GPA normalization rules** — convert between 4.0/5.0/10.0/100-point scales to evaluate `gradeValue gte X` rules accurately across all systems
- [ ] **Age-based eligibility** — add `birthDate` or `age` profile field for MEXT and other age-restricted scholarships
- [ ] **Programme-specific rules** — auto-detect IELTS/TOEFL minimum scores from parsed source pages and create `englishScore gte 6.5` hard rules
- [ ] **Eligibility country mapping** — maintain a mapping of scholarship → eligible countries so the nationality hard gate is precise (not just PK/IN/BD)
- [ ] **Field family alignment scoring** — when a scholarship specifies eligible fields (e.g., "STEM only"), generate `fieldFamily in ['Computing...', 'Engineering...']` rules
- [ ] **Budget affordability rules** — cross-reference `availableBudget` × `budgetCurrency` against country `monthly_cost_low` × programme duration to create affordability gates
- [ ] **Consortium-level Erasmus rules** — each EMJMD consortium has different eligibility; parse from EACEA pages

### Infrastructure Improvements

- [ ] **Automated structured-field extraction** — deterministic parsers for common page layouts (no LLM dependency)
- [ ] **JSON API adapters** — direct API ingestion for Fulbright, Study in Korea, CSC once available
- [ ] **Visa data module** — official study visa checklists per destination country
- [ ] **Notification on new scholarships** — alert students when a new published scholarship matches their profile
- [ ] **Recommendation refresh on catalogue change** — re-run recommendations when new scholarships are published
- [ ] **Remove PK/IN/BD from onboarding schema** — open `nationality` to any country globally (assessment + student_profiles)
- [ ] **Scheduled recommendation re-evaluation** — periodic batch job to update all active users' recommendations when catalogue changes

---

## 10. Database Schema Summary (26 migrations)

| Migration | File | What |
|---|---|---|
| 001 | `foundation.sql` | Users, profiles, assessments base tables |
| 002 | `complete_product.sql` | Scholarships, programmes, atomic_rules, match_evaluations, portfolios, applications, tasks, documents, references, writing, funding, offers |
| 003 | `execution_engine.sql` | Task state machine, requirement-to-task generation |
| 004 | `production_backend.sql` | Recommendation runs/components, store_recommendation_run, submit_assessment, role functions (can_research_review, can_research_write, is_staff) |
| 005 | `intelligence_engine.sql` | Intelligence reports, store_intelligence_report |
| 006 | `security_hardening.sql` | RLS policy tightening |
| 007 | `education_directory.sql` | Countries table, institutions table, equivalencies |
| 008 | `beta_education_data.sql` | Seed data: 4 countries, 12 institutions |
| 009 | `verified_beta_catalogue.sql` | Seed: 4 programmes, 4 scholarships, 4 atomic_rules |
| 010 | `api_role_privileges.sql` | Grant/revoke for anon/authenticated/service_role |
| 011 | `normalize_catalogue_text.sql` | Text normalization triggers |
| — | `opportunity_ingestion.sql` | Ingestion pipeline: sources, runs, candidates, adapters, pg_cron |
| — | `refine_erasmus_catalogue.sql` | Erasmus Mundus scraping refinements |
| — | `eacea_*.sql` (3 files) | EACEA catalogue extraction improvements |
| — | `ingestion_adoption_and_scheduler.sql` | adopt_opportunity_candidate, scheduler tuning |
| — | `register_official_source.sql` | register_official_ingestion_source function |
| — | `ingestion_advisor_hardening.sql` | Ingestion security hardening |
| 012 | `global_source_registry.sql` | 50+ worldwide source registrations |
| 013 | `candidate_structured_fields.sql` | structured_score column, validate function |
| 013b | `fix_validate_function.sql` | array_append bug fix |
| 014 | `publish_candidate_function.sql` | publish_opportunity_candidate function |
| 015 | `auto_rules_on_publish.sql` | generate_rules_for_published_entity function |
| 016 | `worldwide_eligibility_rules.sql` | Retroactive rules for known scholarships |
| 017 | `worldwide_country_intelligence.sql` | 12 new country entries |
