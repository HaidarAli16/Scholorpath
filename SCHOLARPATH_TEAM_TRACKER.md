# CandidRoute team tracker

**Product mode:** full product (no fixed 14 August beta deadline)  
**Updated:** 13 August 2026  
**Owner:** Haidar  
**Rule:** this is the shared operational source of truth. Codex, Claude, Gemini, or a human must update the relevant row immediately after changing or verifying work.

## Status definitions

## Release hardening update — 13 August 2026

| Area | Status | Verified truth | Remaining |
|---|---|---|---|
| Public accessibility | Done | Vercel Deployment Protection was removed from `candidroute`; anonymous `/api/auth/status` returns HTTP 200 at `https://candidroute.vercel.app`. | Smoke the final deployment after this commit. |
| Agreed acquisition flow | Production API verified | Guest assessment now routes to account creation/sign-in, then claims the same assessment into Supabase before opening `/report`; `/report` requires a session. A temporary confirmed student completed assessment, report persistence, workspace, five recommendations and PDF export in production. | Founder visual acceptance in the browser. |
| Free report limits | Code complete + DB live | Free access is limited to readiness, top 3 routes, top 3 gaps, 3 country previews, 3 university previews and a limited PDF. Premium modules fail closed behind a server-derived entitlement. | Connect a payment provider/webhook to create Pro entitlements. |
| Subscription security | Done | `subscription_entitlements` is live with RLS; clients can read only their own row and cannot insert/update plan access. PDF scope is checked server-side. | Payment webhook and billing portal. |
| CandidRoute branding | Done in executable product | Runtime UI, metadata, auth, errors, report/PDF and package identity use CandidRoute. Historical specification filenames remain for traceability. | Rename repository/database display name separately if desired. |
| Supabase migration parity | Done | CLI linked to `gbhzekncpqeytknxanzy`; 33 local and remote migration versions match with zero mismatches. | Keep future changes on the CLI migration workflow. |
| Supabase advisors | Verified | Public schema lint returns no errors. Security/performance advisors now run and findings are recorded; anonymous access to internal rule generation was revoked. | Enable leaked-password protection in Auth settings; address remaining least-privilege/performance warnings in planned batches. |
| Automated verification | Done | Typecheck, lint, 25/25 tests, dependency audit and production build pass on 13 August 2026. Production API journey also passes. | Founder visual acceptance. |
| GitHub/Vercel release | Done | Commit `75b2f79` is pushed; production deployment `dpl_4k7j8WH3sm1RATUdGongXR1TdUQb` is ready and aliased to `candidroute.vercel.app`. | Add monitoring/alerts. |
| Account deletion/audit retention | Done | Production journey found an audit FK deletion blocker. The FK now uses `ON DELETE SET NULL`, preserving anonymised audit history while allowing account deletion; the temporary test user was removed. | Add this cleanup case to automated integration tests. |

| Status | Meaning |
|---|---|
| Done | Implemented, connected, verified in the relevant environment, and safe to build upon. |
| Partial | Useful work exists, but a specific integration, data, test, or acceptance proof remains. |
| Blocked | Cannot move without credentials, a founder decision, or an external service/source change. |
| Not started | No material implementation exists. |

## How every contributor works

1. Read this file before changing the product.
2. Claim one unclaimed task by adding your name/agent in **Owner** and changing its status to `In progress` in the task ledger.
3. Do not overwrite another contributor's in-progress files without coordinating first.
4. When finished, record the files changed, verification run, and commit/PR in **Evidence**.
5. Never call demo data, UI-only work, or unreviewed scraped data “complete”.

## Product modules

| Module | Status | Completed / evidence | Remaining outcome | Owner |
|---|---|---|---|---|
| App shell and navigation | Partial | Urbanist-based shell; global green loading screen replaced with neutral top progress; `/operations` routes admins to `/admin?tab=review`; full-viewport split onboarding, searchable worldwide country picker, grouped destination choices, 20-currency funding selector and recommendation nav/page are implemented. | Restart local dev server after production build, then founder desktop + mobile UX acceptance; remove remaining legacy visual inconsistency. | Codex |
| Authentication and roles | Partial | Supabase Auth and protected admin routes exist. | Password recovery, redirect QA, two-student isolation test, role test for reviewer/admin. | Unassigned |
| Student profile | Partial | Profile flow and validation structure exist; onboarding institution field queries the verified institution-search endpoint; “Update pathway” now opens a prefilled latest assessment and its normal submission regenerates recommendations. | Live save journey, controlled datasets/dropdowns, profile completeness score and signed-in acceptance proof. | Codex |
| Student pathway report | Partial | Report renders `PathwayLane` records without country-ID assumptions; a separate student recommendations page now consumes the detailed recommendation contract. | Generate only from published opportunities; signed-in browser proof; show sourced evidence, uncertainty, and task impact. | Codex + Core build |
| Recommendation engine | Partial | Deterministic eligibility and explainability direction; Antigravity/Claude reports live auto-rule generation on publication, worldwide destination preference scoring and seeded worldwide eligibility rules. | Prove one published record changes a real student's explainable result; versioned regression suite with 30 golden profiles and fairness/subgroup review. | Antigravity/Claude (live report) |
| Tasks, deadlines and Kanban | Partial | Task/Kanban UI and requirement-to-task generation are implemented. | Prove live tasks are generated from published recommendation evidence gaps; add impact scoring, reminders and completion sync. | Core build |
| Opportunity ingestion | Partial | Source registry, deployed Supabase Edge worker, snapshots, hashes, candidates, review queue; EACEA discovery captured 220 leads. Antigravity/Claude reports migrations live on 8 Aug: 60 scheduled sources, 100 review candidates, structured candidate scoring and reviewer-only publishing. | Add source-specific parsers/fixtures; exercise review-to-publish; prove published records reach Discover/recommendations; freshness monitoring. | Antigravity/Claude (live report) |
| Admin command center | Partial | Protected source, review, run, publish and source-health views are implemented in the current worktree. | CSS/UI browser acceptance, reviewer workflow QA, bulk review actions, clear source-health/failure visibility. | Antigravity/Claude (implementation record) |
| Country intelligence | Partial | UK, Germany, Netherlands and Ireland were already covered; Antigravity/Claude reports 12 additional country records live (US, Canada, Australia, Japan, Korea, Singapore, Malaysia, Turkiye, Hungary, New Zealand, Saudi Arabia and China). | City-level source/review workflow, visible citations/freshness, community/halal facts, salary and currency depth. | Antigravity/Claude (live report) |
| Institution directory | Partial | Database/UI support exists. | Production institutions, campuses, programmes, intakes, entry equivalence and document rules. | Unassigned |
| Rankings | Not started | Intentional product decision: rankings are supporting context, not recommendation logic. | Licensed/source-permitted ranking provider, ranking history, university comparison UI. | Unassigned |
| Security and privacy | Partial | Protected APIs and RLS/auth structure exist. | Resolve Supabase Security Advisor findings, enable leaked-password protection, RLS proof with separate student accounts, audit logs/retention review. | Unassigned |
| Deployment and observability | Partial | Local build/typecheck/tests pass; Supabase backend connected. | Vercel production, environment audit, error monitoring, uptime checks, backup/rollback rehearsal. | Unassigned |

## Opportunity coverage truth

| Source / region | Status | Current truth | Next action |
|---|---|---|---|
| Worldwide official registry | Partial | Antigravity/Claude reports 60 official sources from 20+ countries/regions scheduled in production. | Prove parser fixtures, extraction quality and freshness for each source pack. |
| EACEA / Erasmus Mundus | Partial | 220 discovery candidates captured; nothing should auto-publish. | Adopt verified records, extract structured programme facts, reviewer publish. |
| Chevening, DAAD, Commonwealth, Australia Awards, MEXT | Registered live (reported) | Included in the reported global source registry. | Source-specific parser fixtures and publish-quality proof. |
| Leeds, Saarland, Trinity | Partial | First university programme detail sources registered. | Generalise into an institution/course ingestion pack. |
| Turkiye, Stipendium Hungaricum, EduCanada, GKS | Registered live (reported) | Included in the reported global source registry. | Source-specific parser fixtures and publish-quality proof. |
| Fulbright, Manaaki NZ, IsDB and other global funders | Registered live (reported) | Included in the reported 60-source registry. | Country-specific eligibility mapping, parser fixtures and review policy. |

## Priority task ledger

| ID | Priority | Task | Status | Owner | Acceptance evidence |
|---|---|---|---|---|---|
| P0-01 | P0 | Publish a versioned opportunity schema and required review fields (funding, dates, citizenship, level, subject, source, verification date). | Partial | Antigravity/Claude (live report) | Structured score and publication validation are reported live; incomplete candidate must still be tested through the reviewer interface. |
| P0-02 | P0 | Add official source packs for Commonwealth, Australia Awards, MEXT, Turkiye, Stipendium Hungaricum, EduCanada, Fulbright and GKS. | Partial | Antigravity/Claude (live report) | 60 official source records are reported scheduled/live; each still needs source-specific parser fixture and scheduled-run quality proof. |
| P0-03 | P0 | Complete reviewer flow from candidate to reviewed/published/rejected. | Partial | Antigravity/Claude (live report) | Live report confirms review/publish tabs and publish fix; signed-in publish-to-Discover journey remains to prove. |
| P0-04 | P0 | Connect published opportunities to one deterministic recommendation contract. | Partial | Antigravity/Claude + Codex | Publication reportedly auto-generates eligibility rules and supports worldwide scoring; Codex implemented `/recommendations` from the detailed contract. One signed-in student must receive stable explainable results in Recommendations, Discover, Today and Report. |
| P0-05 | P0 | Convert missing eligibility evidence into prioritised tasks and Kanban items. | Partial | Core build | Requirement-to-task generation exists; every blocked live recommendation must link to an impact-scored task with owner, due date and completion effect. |
| P0-06 | P0 | Run a real student and real admin browser acceptance journey. | Not started | Unassigned | Auth → profile → recommendation → report → task and source → review → publish both pass. |
| P0-07 | P0 | Resolve Supabase advisor issues and test RLS role isolation. | Not started | Unassigned | No critical advisor finding; two unrelated students cannot read each other; reviewer/admin rights proven. |
| P1-01 | P1 | Build country intelligence dataset and source/review workflow. | Partial | Antigravity/Claude (live report) | Sixteen countries are reported in the database; facts must be cited, freshness-dated, city-level and reviewed. |
| P1-02 | P1 | Build institution/campus/programme/intake directory ingestion. | Partial | Core build + Codex | Initial 12-institution directory exists and onboarding has institution typeahead; published institution data must scale beyond the beta set and support filters. |
| P1-03 | P1 | Add 30 golden profiles and recommendation regression tests. | Not started | Unassigned | Expected eligibility, reasons and ordering are documented and tests pass. |
| P1-04 | P1 | Deploy Vercel production with monitoring and rollback procedure. | Not started | Unassigned | Production smoke tests, alert destination and rollback notes verified. |
| P2-01 | P2 | Add rankings as transparent, licensed context only. | Not started | Unassigned | Source license/permission documented; rankings never override eligibility or affordability. |
| P2-02 | P2 | Complete mobile UX and interaction polish. | Partial | Codex | Split onboarding and recommendations layouts include responsive states; founder sign-off on mobile + desktop flows and accessible states remains required. |

## Current blockers

| Blocker | Impact | Needed to unblock | Owner |
|---|---|---|---|
| Catalogue has few reviewed, published opportunities | Recommendations cannot be trusted at global scale. | Execute P0-01 through P0-03. | Product/data team |
| No canonical recommendation test set | Scoring changes can silently harm students. | Execute P1-03. | Product/engineering |
| Security acceptance is incomplete | Public release risk. | Execute P0-07; verify live Supabase settings. | Backend/security |
| Production hosting/monitoring unproven | No reliable public release path. | Execute P1-04. | DevOps |
| UX is not founder-accepted | Product quality remains subjective and inconsistent. | Execute P0-06 then P2-02. | Haidar + design |

## Known verification

- `npm run build` passed locally.
- `npm run typecheck` passed locally.
- `npm test` passed locally: 24 tests.
- Supabase migrations and opportunity ingestion Edge Function were previously deployed; re-verify live before declaring any backend module done.

## Latest UI integration — 8 August 2026

- Codex connected `/notifications` to the live notification API, including the mark-read control and authenticated header unread badge. A signed-in acceptance run is still required.
- Codex added the private `/recommendations` surface from the detailed recommendation API, with explainable state groups, score components, failed gates and next actions.
- Local production build passed after these additions; restart `npm run dev` before browser testing because the build invalidates the active Next development cache.

## Security lead pass — 9 August 2026

| Task | Status | Evidence | Remaining |
|---|---|---|---|
| Remove demo/fallback behavior from core data APIs | Done | Catalogue, workspace, tasks, country, institution, recommendations, readiness and FX fail closed. | Prototype presentation data remains a UI task. |
| Live database isolation | Partial | Anonymous private-table reads and inserts are denied with `42501`; public published catalogue remains readable. | Two-student and reviewer/admin session matrix. |
| RLS coverage | Verified in migrations | 57 created tables; none missing RLS enablement. | Security Advisor review. |
| Notification definer functions | Done live | Migration `20260809000100_021_security_lockdown.sql` applied; anonymous RPC execution denied. | Normal migration-history reconciliation on next DB push. |
| Application APIs/UI | Code complete | Validated/rate-limited CRUD and active live-backed Applications screen. | Signed-in browser acceptance and detailed requirements UI. |
| Dependency security | Done | Full `npm audit`: 0 vulnerabilities. | CI automation. |
| Local verification | Done | 24/24 tests, typecheck and production build pass. | Production deployment smoke test. |

Open security release gates: Supabase Advisor, leaked-password protection, two-account isolation, role matrix, retention/backup review, Vercel environment/observability audit.

Credential action: rotate the Supabase management token found hard-coded in an untracked helper; the helper has been removed.

## Supporting documents

- [Product narrative and pipeline](SCHOLARPATH_PRODUCT_STATUS.md)
- [Opportunity ingestion specification](docs/OPPORTUNITY_INGESTION_MVP.md)

## Lead UI/UX pass — 9 August 2026

| Module | Current status | Newly completed | Remaining acceptance |
|---|---|---|---|
| Authentication and roles | Partial | Rotating promotional story, Google OAuth entry, privacy/terms links, corrected input focus behavior. | Supabase Google-provider configuration and real redirect/session QA. |
| Discover | Partial | Reduced text density; country flag + name identity; two-key-reason limit; empty open-check blocks suppressed. | Live catalogue/save/application acceptance. |
| Country intelligence | Partial | Dedicated country-code routes, proper flag images, shorter hierarchy, distinct life-card gradients, no 1970 verification date. | Production data breadth, citations and country-opportunity integration. |
| Institution directory | Partial | Mojibake removed from rendered identity; gradient covers and flag + country context across current catalogue. | Production-scale institutions, programmes, intakes and institution detail integration. |
| Mobile UX and interaction polish | Partial | Auth, Discover, country and institution desktop layouts browser-verified; responsive CSS retained. | Founder mobile acceptance and accessibility sweep. |

Evidence: Mobbin flow/screen study completed; `npm run typecheck` passed; 24/24 tests passed; clean production build passed; `/auth`, `/discover`, `/countries/gb` and `/institutions` browser-smoked on port 3001 with no rendered mojibake.
- [Legacy short tracker](SCHOLARPATH_BETA_MODULE_TRACKER.md) — do not update; this file is the shared tracker.
