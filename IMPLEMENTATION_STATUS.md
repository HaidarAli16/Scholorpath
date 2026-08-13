# ScholarPath implementation status

## Sprint 13: CandidRoute admin control plane and CMS

Status: **CODE + DATABASE VERIFIED** — implemented on 13 August 2026

- Replaced the ingestion-only admin screen with one protected control plane for overview, user roles, plan access, programme/scholarship/country/institution CMS, source ingestion, support, audit and operational settings.
- Added server-authorized mutations with strict validation, origin/rate protection, service-role isolation, required archive reasons and audit events.
- Added a transactional role-replacement function that prevents self-lockout and removal of the final administrator.
- Fixed the global nested-header CSS rule that broke the previous admin layout; the new interface is responsive and uses the CandidRoute design language.
- Applied migration `20260813135124_admin_control_plane.sql`; local/remote parity is 36/36, linked schema lint reports no errors, four settings are live and one administrator assignment is verified.
- Preserved and hardened Claude's performance pass: discovery loads independently, third-party calls are reduced, public feeds cache safely, private recommendations cannot enter a shared CDN cache, and Lucide imports are optimized.
- Verification: ESLint passed, TypeScript passed, 25/25 tests passed, production build passed and unauthenticated control-plane access returns HTTP 401.
- Released: commit `6da5126`, deployment `dpl_Fqe6GYZCXzczYseCeBxNJGJ7QiXA`, stable alias `https://candidroute.vercel.app`, Singapore function region.

## Sprint 12: Stable authenticated boot

Status: **LOCAL ACCEPTANCE PASSED** — implemented and browser-tested on 10 August 2026

- Replaced the anonymous/default first-render flash with server-supplied authenticated workspace, report, catalogue, recommendation, and directory state.
- Authenticated identity, profile, report and workspace data now appear together after resolution.
- Fixed invalid nested task-card buttons that caused hydration errors and the development issue badge.
- Removed the temporary loading shell entirely. Verified `/today`, `/recommendations`, and `/countries` render resolved live content without guest-state, zero-state, recommendation-loader, login redirect, hydration mismatch, or recent console errors.
- Verification: ESLint passed, TypeScript passed, 25/25 tests passed and production build passed.

## Sprint 11: Annotated UX acceptance — 29/29 closed

Status: **LOCAL ACCEPTANCE PASSED** — implemented and browser-tested on 10 August 2026

- Report, Discover, opportunity detail, country detail, institution directory and funding drawer were redesigned around scan-first student decisions.
- Real country flags and repaired UTF-8 text replace the corrupted symbols previously visible in country and institution records.
- Today and Recommendations preserve the completed onboarding session instead of returning the student to login.
- Today metrics, alignment bars and priority move now use the current pathway report instead of hard-coded presentation values.
- Ambiguous Supabase relationship joins in Workspace and Tasks were fixed; the live board loads and duplicate active profile-gap tasks are reconciled.
- Browser acceptance evidence and the 29-item matrix are recorded in [UX_COMMENT_ACCEPTANCE_2026-08-10.md](UX_COMMENT_ACCEPTANCE_2026-08-10.md).
- Verification: ESLint passed, TypeScript passed, 25/25 tests passed, production build passed, and `npm audit` reports 0 vulnerabilities.

## Sprint 10: Complete Backend — All 15 Issues Resolved

Status: **LIVE** — all backend APIs, migrations, and engine updates deployed on 8 August 2026
Agent: **Antigravity (Google DeepMind)**
Frontend: **Codex** — 23 UI tasks queued in SYNC_TRACKER.md (all unblocked)

### What was built (Backend only)

- **Migration 019 — Notification System**: `create_notification()` reusable helper. Triggers on scholarship/programme publish → notify matching users. Unique index on `(user_id, event_key)` for deduplication. Outbox event `notification.email_requested` for Resend integration.
- **Migration 020 — Grade Normalization**: `grade_systems` table with 13 education systems (PK, IN, BD, UK, US, DE, CN, JP, KR, AU, TR). `normalizeGrade()` engine function with scale-aware conversion including German inverted scaling.
- **Notifications API**: `GET /api/notifications` (list with unread count, filtering, pagination). `PATCH /api/notifications` (mark read by IDs or all).
- **Institution Search API**: `GET /api/institutions/search?q=&country=&limit=` with fuzzy ilike matching.
- **Assessment Draft API**: `GET /api/assessment/draft` (load saved draft). `PUT /api/assessment/draft` (save partial answers).
- **Applications CRUD API**: Full REST — `GET/POST /api/applications`, `GET/PATCH/DELETE /api/applications/[id]` with requirements join.
- **Catalogue country filter**: Already existed (`?country=GB`), verified working.

### Migrations applied

| Migration | File | Status |
|---|---|---|
| 019 | `20260808180000_019_notification_system.sql` | ✅ Applied |
| 020 | `20260808180100_020_grade_normalization.sql` | ✅ Applied |

### New API routes (28 total)

| Route | Method | Purpose |
|---|---|---|
| `/api/notifications` | GET, PATCH | Notification list + mark read |
| `/api/institutions/search` | GET | Fuzzy institution search |
| `/api/assessment/draft` | GET, PUT | Draft save/load |
| `/api/applications` | GET, POST | List + create applications |
| `/api/applications/[id]` | GET, PATCH, DELETE | Single app CRUD |
| `/api/recommendations/detailed` | GET | Full scoring breakdown |

### Verification

- 24 unit tests pass (all 6 suites)
- TypeScript strict-mode check passes (0 errors)
- Migrations 019–020 applied to live Supabase

## Sprint 9: Worldwide Unblock — Backend Complete

Status: **LIVE** — all backend restrictions removed, migrated and verified on 8 August 2026
Agent: **Antigravity (Google DeepMind)**
Frontend: **Codex** — 12 UI tasks queued in SYNC_TRACKER.md

### What was built (Backend only)

- **Migration 018**: `profile_country` enum → `text`. All DB columns (`student_profiles.nationality`, `equivalencies.origin_country`, `institution_requirements.origin_country`) migrated. `submit_assessment()` no longer casts to enum. Enum type dropped.
- **Types worldwide**: `originOptions` expanded to 50 countries. `residenceOptions` to 30. `qualificationOptions` has `_default` key for unknown countries (6 generic options). `OriginCountry` is now `string`. `budgetCurrency` expanded to 20 currencies. `intakeOptions` dynamically generated from current date. `PathwayLane.id` is now `string`.
- **Schema worldwide**: `nationality` and `currentCountry` accept any string. `destinationPreference` accepts all 12 options. `intake` accepts any dynamic string. Qualification superRefine falls back to `_default`.
- **Dynamic pathways**: 10 pathway definitions (UK, Germany, Erasmus, US, Canada, Australia, Japan, Korea, Singapore, Malaysia). `buildPathways()` generates 3 lanes based on destination preference and profile signals. Smart defaults for `suggest`/`World`.
- **Detailed recommendations API**: `GET /api/recommendations/detailed` returns full scoring breakdown: run metadata, profile snapshot, summary (confirmed/conditional/failed counts), and per-entity results with `score_components`, `reasons`, `failed_gates`, `open_checks`, `next_actions`, `deadline_at`, `application_url`.

### Migration applied

| Migration | File | Status |
|---|---|---|
| 018 | `20260808150000_018_worldwide_nationality.sql` | ✅ Applied |

### Verification

- 24 unit tests pass (all 6 suites)
- TypeScript strict-mode check passes (0 errors)
- Migration applied to live Supabase via Management API

## Sprint 8: Worldwide Recommendation System MVP

Status: **LIVE** — implemented, migrated and verified on 8 August 2026
Agent: **Antigravity (Google DeepMind)**

### What was built

- **Auto-rule generation on publish** — new `generate_rules_for_published_entity()` PL/pgSQL function hooks into `publish_opportunity_candidate()`. Every published scholarship/programme now automatically gets eligibility rules for the recommendation engine: nationality gates, qualification requirements, funding type matching, field family matching, English evidence, and destination visa signals.
- **Worldwide eligibility rules seeded** — retroactive atomic_rules for all published scholarships by name pattern: Chevening (2yr work experience, nationality gate), Fulbright (English required, field preference), DAAD EPOS (experience preference), GKS (grade requirement), Türkiye Bursları (open to all, completion check), MEXT (age/graduation proxy). Universal English evidence rule for all.
- **Recommendation engine expanded** — `preferenceScore()` now handles worldwide destinations: US, Canada, Australia, Japan, Korea, Singapore, Malaysia (in addition to existing UK, Germany, Europe). `suggest` and `World` give baseline scores.
- **Live scholarships API: PK/IN/BD restriction removed** — `/api/scholarships/live` now accepts any nationality string, not just Pakistan/India/Bangladesh. Destination options expanded.
- **Live scholarships module expanded** — WorqNow feed now fetches from 7 countries: UK, Germany, Netherlands, Ireland, USA, Canada, Australia (up from 4). Country names map expanded.
- **Worldwide country intelligence** — 12 new country entries in `countries` table: US, CA, AU, JP, KR, SG, MY, TR, HU, NZ, SA, CN with realistic visa difficulty, post-study work months, living costs, healthcare, climate, safety data.

### Migrations applied to production

| Migration | File | Status |
|---|---|---|
| 015 | `20260808100000_015_auto_rules_on_publish.sql` | ✅ Applied |
| 016 | `20260808100100_016_worldwide_eligibility_rules.sql` | ✅ Applied |
| 017 | `20260808100200_017_worldwide_country_intelligence.sql` | ✅ Applied |

### Verification

- 24 unit tests pass (all 6 suites).
- TypeScript strict-mode check passes (0 errors).
- Migrations applied live via Supabase Management API.

## Sprint 7: Cover MVP — Worldwide Scholarship Ingestion Pipeline

Status: **LIVE on Supabase `gbhzekncpqeytknxanzy`** — implemented, migrated and verified on 7–8 August 2026
Agent: **Antigravity (Google DeepMind)**

### What was built

- **60 monitored official scholarship sources** from 20+ countries/regions registered in the ingestion scheduler — UK (Chevening, CSC, Gates Cambridge, Rhodes, Clarendon), EU (Erasmus Mundus EACEA, MSCA), Germany (DAAD, KAS, HBS, FES), Netherlands (Holland, OTS, OKP/NFP), Ireland (GOI-IES), Switzerland (ESKAS, ETH, EPFL), Sweden (SI), USA (Fulbright, Humphrey), Canada (Vanier, Banting, IDRC), Australia (Australia Awards), Japan (MEXT, JASSO, ADB-JSP), Korea (GKS), China (CSC), Singapore (NUS, A*STAR), Malaysia (Khazanah, MIS), Turkey (Türkiye Bursları), Hungary (Stipendium Hungaricum), New Zealand (Manaaki), Saudi Arabia (KAUST), IsDB (Merit + Need-Based), MasterCard Foundation, African Union.
- **`structured_score` generated column** (0–100) on `opportunity_candidates` — scores candidates by field completeness to prioritise the review queue.
- **`validate_candidate_for_publish()` DB function** — gates publication on required fields (title, provider, application URL), fixed with `array_append` to prevent operator resolution errors under `search_path = ''`.
- **`publish_opportunity_candidate()` DB function** — the missing publish link: upserts an approved candidate into `scholarships` or `programmes` table with full source provenance, `state = 'published'`, `published_at`, and an `audit_events` log entry.
- **`/api/admin/ingestion` extended** with a new `publish` action, `approvedCandidates` in GET, `failingSources` health data, and `structured_score` in candidate selects.
- **`IngestionCommandCenter` rebuilt** with 5 tabs: Sources (country badge, 6-col table, 60 sources visible), Review (score badge, validation feedback), **Publish** (new — Publish to Catalogue button, field preview, score warning), **Source Health** (new — failing sources with retry, stale sources), Run History.
- **`useIngestion` hook extended** with `approvedCandidates`, `failingSources`, `structured_score`, `approved` metric counter.

### Migrations applied to production

| Migration | File | Status |
|---|---|---|
| 012 | `20260807085900_012_global_source_registry.sql` | ✅ Applied |
| 013 | `20260807090000_013_candidate_structured_fields.sql` | ✅ Applied |
| 013b | `20260807095000_013b_fix_validate_function.sql` | ✅ Applied (array_append fix) |
| 014 | `20260807090100_014_publish_candidate_function.sql` | ✅ Applied |

### Verification

- 24 unit tests pass (unchanged).
- TypeScript strict-mode check passes (0 errors).
- Next.js production build passes.
- Migrations applied live via Supabase Management API.
- Admin panel at `/admin` → Ingestion shows 60 monitored sources, 37 due, 100 candidates in review queue, 1 approved and ready to publish (Erasmus Mundus AI programme) — confirmed in browser.
- Publish function `validate_candidate_for_publish` array-literal bug patched and re-applied.

### Scope decision recorded

- **Worldwide from day one.** No PK/IN/BD student-origin restriction on the ingestion pipeline. All 50+ global funders are in scope.
- **Future roadmap:** Remove student-origin restriction from onboarding and eligibility engine to open the platform to any student globally.

### What remains for full catalogue visibility

1. Admin reviewer approves pending candidates in the Review queue (`/admin` → Ingestion → Review).
2. Admin publishes approved candidates via the Publish tab — each click writes one row to `scholarships` or `programmes` table.
3. Students see published scholarships in `/discover` and receive them in Recommendations automatically.



Status: implementation complete; production credentials and deployment validation remain environment-owned

### Included

- Source-backed beta catalogue with current and explicitly stale programme/scholarship cycles; closed records cannot enter recommendations.
- Official-source records for Leeds, Saarland, Trinity, Chevening, GOI-IES, NL Scholarship and DAAD EPOS.
- Conservative versioned eligibility rules using only profile fields supported by the assessment model.
- Research Operations and Administration now read protected live counts or show a clear setup/access state; fabricated operational metrics were removed.
- Automated pgTAP isolation coverage for two unrelated students plus anonymous published/stale catalogue visibility.
- GitHub database quality gate now runs the RLS database tests after a full local reset.

### Environment-owned release gates

- Add Supabase URL, publishable key and server secret to local/Vercel environments.
- Re-authenticate Supabase administration, run Security/Performance Advisors and deploy migration `009`.
- Configure Auth redirect URLs, SMTP, outbox delivery, monitoring and a support inbox.
- Create the first verified admin account and assign research roles.
- Deploy a Vercel preview, perform the signed-in browser acceptance journey and then promote it.

## Sprint 5: Country and institution intelligence

Status: implemented, migrated and locally verified on 4 August 2026

### Included

- Country Intelligence for the United Kingdom, Germany, Netherlands and Ireland, covering city budgets, accommodation, deposits, visa fees, proof of funds, healthcare, work rights, post-study routes, transport, safety context, climate and community fit.
- Institution Directory with 12 beta universities, campuses, official-source ranking facts, Pakistan/India/Bangladesh qualification equivalencies and institution requirements.
- Rankings are evidence only; the recommendation engine now prioritises eligibility, academic fit, funding, deadline, source freshness, evidence readiness, affordability, visa feasibility, career alignment and student preference.
- Mobile-ready `/api/countries`, `/api/institutions` and `/api/fx` routes with input validation, timeouts and an explicitly labelled curated fallback.
- Versioned Supabase schema, row-level security, research-role publishing policies, reviewed beta sources and freshness dates.

### Verification

- 21 unit tests pass.
- TypeScript strict-mode check passes.
- Next.js production build passes with zero warnings.
- `/countries`, `/institutions` and their supporting APIs return HTTP 200 locally.
- Remote migrations `006`, `007` and `008` were applied to Supabase project `gbhzekncpqeytknxanzy`.

### Deliberate beta boundary

- The 12 institutions are a launch dataset, not a claim of global catalogue completeness.
- Programme and scholarship records must only be published after current-cycle official-source review; discovery feeds cannot silently become recommendations.
- A local or deployment environment needs the values documented in `.env.example` to use Supabase instead of the bundled fallback.

## Sprint 4: Production backend and live decision path

Status: migrated and superseded by Sprint 5

### Included

- Supabase schema for identity, assessments, catalogue truth, atomic rules,
  recommendation history, portfolios, applications, Kanban tasks, evidence,
  references, writing, funding, offers, consent, audit, imports and outbox.
- Tenant-safe composite foreign keys, row-level security, private storage and
  role-separated research publication.
- Transactional assessment submission, idempotency, rate limiting, task state
  transitions, readiness snapshots and requirement-to-task generation.
- Deterministic recommendation engine with hard gates, funding/deadline/source
  feasibility, explainable reasons, open checks and versioned results.
- Recommendation persistence restricted to the server-only Supabase secret;
  authenticated users cannot write fabricated recommendation runs directly.
- Today, Discover, Portfolio and route detail now consume the same live
  catalogue and latest recommendation run, with a safe demo fallback.
- Saving a route and starting an application now persist into the authenticated
  workspace; official source URLs and verification dates come from catalogue data.

### Verification

- ESLint passes with zero warnings.
- TypeScript strict-mode check passes.
- 10 unit tests pass across assessment, recommendation and live catalogue mapping.
- Next.js optimized production build passes.
- All four generated PostgreSQL migrations parse successfully.
- Production server smoke tests pass for pages and API routes.
- Desktop discovery/filter/explanation flow and 390 × 844 responsive layout pass.
- No horizontal overflow or browser console errors were detected.

### Remaining live release gate

- Install deployment environment secrets, rerun Supabase Security/Performance Advisors and complete the documented two-account isolation test before inviting beta users.

## Sprint 3: Complete frontend system

Status: implemented and verified locally on 25 July 2026

### Included

- Five-destination responsive shell: Today, Discover, Portfolio, Applications,
  and Workspace.
- Desktop navigation rail and future-iOS-aligned bottom navigation.
- Today dashboard with one dominant next action.
- Programme and scholarship discovery with filters, verification freshness,
  honest match states, conditions, deadlines, saves, and detail entry points.
- Portfolio grouping and comparison entry points.
- Application execution detail with readiness categories, blockers,
  requirements, writing, references, documents, and activity tabs.
- Task, document, guided writing, funding-scenario, and offer workspaces.
- Profile and evidence, notifications, help, and correction surfaces.
- Research operations control room for sources, review, conflicts, atomic
  rules, programmes, scholarships, and freshness.
- Administration control room for users, support, corrections, delivery,
  security, audit, analytics, and settings.
- Shared typed frontend fixtures instead of page-local demo constants.
- Loading/empty/error/state requirements captured in the complete frontend
  specification.

### Primary routes

- `/today`
- `/discover`
- `/portfolio`
- `/applications`
- `/workspace`
- `/workspace/documents`
- `/workspace/writing`
- `/workspace/funding`
- `/workspace/offers`
- `/profile`
- `/notifications`
- `/help`
- `/operations`
- `/admin`

### Verification

- TypeScript strict-mode check passes.
- Next.js production build passes.
- Desktop QA passed at 1440 × 900.
- Mobile QA passed at 390 × 844.
- No horizontal overflow was detected on the tested routes.
- No browser console errors or warnings were detected.
- Local development server is available at `http://localhost:3000`.

## Sprint 2: Guided pathway workspace

Status: implemented and verified locally

### Included

- Research-led landing page using VOIT semantic tokens and Urbanist.
- Five-step adaptive onboarding for Pakistan, India, and Bangladesh.
- Structured citizenship, residence, qualification, field, intake, funding,
  evidence, experience, and blocker controls.
- Country-dependent qualification options and original-scale grade capture.
- Explicit internal academic planning signal with an equivalency disclaimer.
- Destination suggestion mode so students do not have to choose a country
  before the system understands their constraints.
- Conditional English-test follow-up fields.
- System-involvement notes after consequential answers.
- Final profile-understanding review before pathway generation.
- Deterministic UK, Germany, and Erasmus Mundus research lanes.
- Conditional, unknown, and not-recommended states instead of fit percentages.
- Expandable reasons, unresolved conditions, source links, and next actions.
- Student execution workspace with one dominant next action, profile snapshot,
  task completion, evidence gaps, and recalculated task priority.
- Browser-local draft persistence and runtime API validation.
- Responsive layouts and reduced-motion support.

### Product boundaries

- Route suggestions are research priorities, not admission predictions.
- Academic normalization is not an official equivalency.
- Programme and scholarship eligibility remains conditional until a verified,
  versioned source catalogue is attached.
- The current institution field is a launch placeholder; it must become a
  registry-backed searchable combobox with a reviewed “not listed” route.
- Supabase authentication and persistence are not connected to this slice yet.

### Verification

- TypeScript strict-mode check passes.
- Next.js production build passes.
- Complete onboarding-to-workspace journey passed browser interaction testing.
- Conditional English-test controls were exercised.
- Route expansion and task completion/reprioritization were exercised.
- Desktop and 390px responsive layouts were inspected.
- The mobile document has no horizontal overflow.
- No browser console errors or warnings were detected.

## Next milestone

Deploy and validate the prepared Supabase migrations, seed the first reviewed
catalogue cycles, and complete the real onboarding-to-recommendation-to-task
journey in the Vercel preview environment.
