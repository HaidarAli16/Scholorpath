# CandidRoute product tracker

Updated: 14 August 2026

The 14 August beta framing has been removed. Current product truth now lives in [SCHOLARPATH_PRODUCT_STATUS.md](SCHOLARPATH_PRODUCT_STATUS.md).

## Immediate status

Fresh verification on 14 August 2026: typecheck, lint, all 29 automated tests and the production build pass. Supabase migration parity is 42/42, linked schema lint is clean, and the protected admin control-plane schema is live. The stable production URL is `https://candidroute.vercel.app`.

| Area | Status | One-line truth |
|---|---|---|
| UI shell | Partial | All 29 annotated UX defects are closed at the target desktop viewport; cross-device and mobile acceptance remain. |
| Supabase backend | Partial | Live schema is reachable; migration parity is 36/36 and linked schema lint is clean. Advisors report no errors but 51 warnings; two-student isolation and staff-role acceptance remain. |
| Opportunity ingestion | Partial | 405 source records exist; five duplicate URL aliases are archived, active normalized URL duplicates are zero, and review/publication remain the bottleneck. |
| Recommendation engine | Partial | The engine direction is correct, but it cannot be trusted until published catalogue coverage and golden-profile tests exist. |
| Country intelligence | Partial | Architecture/UI direction exists; complete country facts are still missing. |
| Institution directory | Partial | All 12 current institutions are uniquely matched to ROR identities with daily enrichment; broader university, campus, course and ranking coverage is still missing. |
| Deployment | Done | Optimized production is public at `candidroute.vercel.app`; home, auth, catalogue, country, institution and live-scholarship checks return 200, while anonymous admin access correctly returns 401. |
| Admin and CMS | Partial | Core access, plan, education, ingestion, support, audit and settings controls exist. Authenticated visual acceptance, bulk review and relational editors for cities/facts/campuses/rankings/equivalencies/requirements/intakes/rules remain. |

## Release audit - 14 August 2026

| Check | Result | Evidence |
|---|---|---|
| Git | Done | Clean working tree; local `main` matches `origin/main`. |
| Code quality | Done | Typecheck, lint, 26/26 tests and production build pass. |
| Supabase migrations | Done | 42 local and 42 remote migrations; zero mismatch; linked schema lint clean. |
| Production HTTP | Done | `/`, `/auth`, auth status, catalogue, countries, institutions and live scholarships return 200; anonymous admin API returns 401. |
| Published catalogue | Blocked for release quality | Only 2 release-ready programmes and 3 release-ready scholarships are published. The release gate requires at least 10 current reviewed opportunities. |
| Ingestion health | Partial | 301 sources and 275 assignments exist, 271 enabled. The new daily discovery rollout is draining 94 queued runs; first acceptance produced 86 new official URLs and 11 structured scholarship candidates. |
| Review-to-publish proof | Missing | 711 candidates exist, 283 are pending, 5 approved and zero have `published_at`; the production pipeline has not yet proven candidate-to-catalogue publication. |
| Recommendation quality | Missing release proof | Deterministic engine exists, but 30 golden-profile regression/fairness cases and adequate catalogue breadth are missing. |
| Security acceptance | Partial | Protected API behavior and schema lint pass. Current Advisors report 0 errors and 51 warnings: 21 security and 30 performance, led by 20 authenticated SECURITY DEFINER grants, 25 overlapping permissive policies, 5 auth RLS init-plan findings and leaked-password protection being disabled. Two-user/staff isolation proof also remains. |
| Billing | Not started | Free/Pro entitlement controls exist, but checkout, webhook, billing portal and payment-state reconciliation are not connected. |
| Monitoring and communications | Partial | Application health is manually verifiable; production error monitoring, uptime alerts, support routing and transactional email delivery are not proven. |
| Full student/admin journey | Needs live acceptance | Authentication and role-aware routing exist; a real-account assessment-to-report-to-task-to-application journey and authenticated admin publish journey still need recorded acceptance. |

Admin acceptance correction: generic sign-in and OAuth callback redirects are now role-aware. Administrators default to `/admin`, staff default to `/operations`, students default to `/today`, and an explicit safe `next` destination still takes precedence. Commit `91cf709` is live as deployment `dpl_24s2b6DvVMkHjeMbqhuXhNan5nDw` at the stable alias.

## Performance engineering pass — 13 August 2026

- Done: live third-party scholarship discovery no longer blocks catalogue/recommendation rendering and its default network fan-out is reduced from fourteen calls to six.
- Done: public discovery receives safe CDN stale-while-revalidate caching; personalized recommendations and workspace data are explicitly private and excluded from shared caches.
- Done: Lucide imports are tree-shaken and the discovery effect no longer re-fetches when its own mode changes.

- Done: authenticated pages now load only their own workspace slice instead of ten unrelated student tables on every route.
- Done: profile bootstrap, entitlement and role checks run concurrently; report, catalogue, recommendations and directories load only where needed.
- Done: middleware and protected page identity checks use verified JWT claims, removing avoidable Auth API round trips from normal navigation.
- Done: public catalogue, country and institution data use request-independent RLS clients plus server/CDN stale-while-revalidate caching.
- Done: directory shaping uses grouped lookups instead of repeated full-array scans; heavy route modules are split into lazy client chunks and expensive navigation prefetch is disabled.
- Done: assessment no longer blocks on third-party discovery or recommendation persistence; the validated report returns first and enrichment runs post-response.
- Done live: two performance migrations add useful ordered/partial indexes and remove redundant indexes; remote parity is 35/35 and linked schema lint reports no errors.
- Done in code: all 34 dynamic server entry points and `vercel.json` request `sin1`; Fluid Compute is enabled. Vercel currently reports `iad1` execution for this project, so regional placement remains a platform/project-setting follow-up rather than an application-code gap.
- Verified live: warm responses measured 87-111 ms for robots, sitemap, countries and institutions; catalogue was 318 ms and uncached auth status 375 ms. Public APIs return cache HIT after the first request.
- Verified locally: warm public data responses are 4–5 ms, uncached assessment response is under 0.8 seconds, and the production build reports 122 kB first-load JS for the public assessment and 209 kB for the authenticated product shell.

## Current blockers

1. Review and publish at least five more current official opportunities, then prove one candidate reaches the catalogue and recommendations.
2. Add and pass 30 golden student profiles against versioned recommendation expectations.
3. Record the full signed-in student journey and authenticated admin review/publish journey.
4. Triage the 51 Supabase Advisor warnings, enable leaked-password protection and complete RLS role-isolation checks.
5. Connect subscription checkout/webhooks and production monitoring, alerting and transactional email.

## Ingestion and recommendation defect audit - 14 August 2026

- Critical: the historical candidate backlog remains poorly normalized. The new official-page path produced 11 structured scholarship candidates in acceptance: 4 confirmed deadlines, 7 explicitly unconfirmed deadlines and 4 resolved funding types; only 5 total candidates are approved.
- Critical: the production report uses hard-coded pathway/intelligence models while live recommendations run later through a separate catalogue engine, so the first report and saved recommendations can disagree.
- Critical: all 12 published recommendation rules cover only nationality, subject, experience and declared English status; the engine currently has no sourced grade threshold, tuition/budget, intake, document, language-score or programme-specific equivalency rules.
- High: the generic catalogue adapter is labelled as `programme` and uses an EACEA-specific HTML-card parser across unrelated worldwide sources, contributing to 669 programme candidates versus only 30 scholarship candidates.
- High: `html_detail` extraction produces only title/provider/country/URL/application-state/date mentions; it does not structurally extract the fields required by the publish and recommendation contracts.
- High: the assessment returns before live recommendation evaluation, silently discards background evaluation failures and has no durable retry/outbox confirmation.
- High: affordability is hard-coded by country, career signal is derived only from post-study months, and missing funding/country signals receive defaults; displayed percentages therefore have insufficient individual evidence.
- High: recent ingestion health remains weak: 45 of 61 enabled sources have ever succeeded; current failures include 11 robots blocks, four 404s, one 403 and one unsafe target.
- Medium: the worker has no parser fixture/unit suite, uses `@ts-nocheck`, applies a simplified robots parser and processes only one claimed run per invocation.
- Medium: generated qualification rule values do not match the human-readable qualification values accepted by onboarding; grade normalization also checks `nationalities` while the profile field is `nationality`.

### Recommendation/report remediation - 14 August 2026

- Done: assessment, saved report, PDF, tasks and recommendation records now originate from one synchronous evaluation of the published Supabase catalogue; evaluation or persistence failures fail closed instead of silently returning a conflicting static result.
- Done: the web report and PDF show the ranked opportunity list once. The separate audit area contains reproducibility metadata only, removing the duplicate recommendation presentation.
- Done: PDF export ignores browser-supplied report/profile data and reloads the signed-in student's latest `pathway_reports` and `assessments` rows under RLS before generating the file.
- Done live: migration `20260814090000_unify_recommendation_rules.sql` removed invented destination/universal-English checks, repaired normalized-grade rules and aligned generated qualification/field rules with onboarding values.
- Done: missing rules, deadlines, funding, affordability, visa, career and preference signals receive zero points. Unknown information can no longer create an inflated match score.
- Done live: the ingestion worker identifies itself as CandidRoute, records only actual inserts, fails on candidate-write errors, schedules source reviews correctly and extracts contextual deadline, funding, degree and field facts for detail pages without leaking catalogue-page facts into discovered records.
- Verified: linked Supabase migration applied, `opportunity-ingest` redeployed, 9 sourced published rules remain after removing 3 generic/invented rules, and typecheck, lint, 29 tests and production build pass.
- Deployed: revision `a3d447f` is live at `https://candidroute.vercel.app`; public home/catalogue return 200 and anonymous PDF export correctly returns 401.
- Remaining data-quality gate: the live catalogue still contains only 2 programmes and 3 scholarships. The engine is now internally consistent, but recommendation breadth cannot be called production-grade until more official records and programme-specific rules are published.

## Secondary discovery and deadline rechecks — 14 August 2026

- Done live: Opportunities Circle and Scholarpath.world run every 24 hours as discovery-only indexes; their descriptions and images are never copied into catalogue truth.
- Done live: Opportunities Circle's public WordPress search seeded 100 detail pages; Scholarpath.world's public JSON feed yielded 75 scholarship application URLs.
- Done live: outbound URLs become exact-host official sources, then the existing HTTPS, redirect, robots, timeout, size-limit, snapshot and validation controls apply.
- Done live: official pages without a deadline remain eligible for review with the explicit `deadline_unresolved` state; student UI displays **Deadline not confirmed**, and the official source is checked again daily.
- Verified live: the first sample created 86 new official sources and 11 structured scholarship candidates; eight Opportunities Circle routes and three Scholarpath.world routes completed the official-page stage, with one correct robots block.
- Remaining: drain the queued source backlog, enrich country/eligibility fields, approve strong records and prove review-to-publication-to-recommendation end to end.

## API enrichment and deduplication — 14 August 2026

- Decision: CareerOneStop is the selected US scholarship API after its free user ID/token is supplied; ROR v2 is the immediate global institution-identity provider. College Scorecard is reserved for US cost/outcome facts, not scholarship truth.
- Done live: the `institution-enrich` Edge Function and daily cron are deployed; all 12 current institutions matched a unique active ROR education record, with zero ambiguous, failed or duplicate matches.
- Done live: ROR enriches identity, official domain, location and external identifiers only. It cannot create admission, eligibility, funding, ranking or visa claims.
- Done live: scholarship discovery URLs are normalized before insertion; tracking/session parameters, fragments, duplicate slashes and trailing slashes no longer create new active sources.
- Done live: five pre-existing URL aliases were archived without deleting their historical evidence. Active normalized source duplicate groups are now zero.
- Remaining external credential: CareerOneStop registration is required before its US scholarship feed can be enabled; its API does not permit anonymous calls.

## Production hardening — 9 August 2026

- Done: APIs no longer substitute demo/fallback records for catalogue, workspace, tasks, country, institution, recommendation, readiness or FX failures.
- Done: active Applications reads the authenticated Supabase workspace; missing opportunity details now fail closed.
- Done: sensitive mutations have schema validation, origin protection and rate limits.
- Done: dependency audit is 0 vulnerabilities; 24/24 tests, typecheck and production build pass.
- Done live: private-table anonymous reads/inserts are denied; notification definer functions are locked down and anonymous RPC execution is denied.
- Remaining security proof: Security Advisor, leaked-password setting, two-student isolation, reviewer/admin role matrix, retention and backup review.
- Remaining UI truth cleanup: Today, Profile, Writing, Funding, Offers and parts of Portfolio still contain prototype presentation data.

## Onboarding country dropdown — 9 August 2026

- Done: citizenship is now a closed-by-default searchable combobox with a floating dropdown, selected state, outside-click/Escape close and Arrow/Enter keyboard selection.
- Verified locally: closed state has no listbox; open state exposes the listbox; Canada filtering/selection closes correctly; keyboard selected Pakistan; original India selection restored; zero browser console errors.
- Code checks: lint, typecheck and 24/24 tests pass.

## Contextual help and modal UX — 9 August 2026

- Done: one reusable accessible tooltip/explainer-modal system now supports hover, keyboard focus, click/tap, Escape/backdrop dismissal, focus return, scroll lock and a mobile bottom-sheet layout.
- Done: contextual explanations cover onboarding rule branches, Today evidence/readiness metrics, Discover verification, recommendation priority/statuses, application readiness, country visa signals, ranking guardrails, task readiness and admin extraction scores.
- Done: live catalogue publishing now requires an explicit confirmation that explains student-facing and recommendation-engine consequences; routine reversible actions remain one click.
- Mobbin references reviewed: [Arcade metric context](https://mobbin.com/screens/ffa76985-7fe5-4ae3-8a08-2337cae94c02), [TheyDo evidence detail panel](https://mobbin.com/screens/0420156b-e923-44d7-9be9-8b86205fb7b5), [Expensify submit confirmation](https://mobbin.com/screens/58e9c856-13ac-40d7-b323-6e911a896f43), and [Substack publish decision](https://mobbin.com/screens/50020839-4e84-4e7e-b599-e43cd729bcd6).
- Verified locally: onboarding help opens as a labelled dialog, content remains legible over the 100vh split layout, close restores the page, and the dev server runs at `http://localhost:3001`.
- Code checks: lint, typecheck, 24/24 tests and production build pass.

## Pathway report and PDF delivery — 9 August 2026

- Done: [SCHOLARPATH_FLOW_AND_REPORT_STATUS.md](SCHOLARPATH_FLOW_AND_REPORT_STATUS.md) maps the complete onboarding-to-production flow with live, partial and missing work.
- Done: signed-in students can reload their latest persisted `pathway_reports` record; guest completion still uses the browser-session handoff.
- Done: the web report has section navigation and explicit snapshot/version guidance.
- Done: `/api/report/pdf` creates a real private, no-store A4 PDF from the same validated report object, with executive summary, readiness, evidence gaps, pathway comparison, actions, safeguards and audit summary.
- Verified sample: `output/pdf/ScholarPath_Sample_Pathway_Report.pdf` renders as five clean A4 pages with no clipping or broken characters.
- Mobbin direction: result-first hierarchy from Codecademy, multidimensional explanation from Midjourney, auditable download snapshot from Vanta and assessment-to-action continuity from Uxcel.
- Remaining: optional report version history, saved PDF storage and email delivery; these do not block immediate download.
- Code checks: lint, typecheck, 25/25 tests and production build pass.

## Student-first UX continuity pass — 9 August 2026

- Done: `/today` and `/recommendations` no longer redirect a guest who has just completed onboarding; browser-session recommendations reuse the same deterministic assessment result while saved private work still requires authentication.
- Done: Report defaults to a short Quick view and offers Full evidence on demand. The hero now uses the broader Today gradient palette, readiness cards are scan-first, and long programme evidence is removed from the default reading path.
- Done: Discover cards now prioritise country, match percentage, friendly funding/deadline facts and one next check. Raw values such as `full_award` are humanised.
- Done: recommendation modal shows profile match, two aligning signals and one next check instead of a wall of text.
- Done: opportunity detail has proper flags, a Today-style gradient, match percentage, pill tabs and actionable next-step cards.
- Done: country detail no longer repeats every country; the budget translator uses a bounded slider. Institution cards are shorter, fully clickable and use compact rank, equivalence, campus, programme and verification badges.
- Done: funding drawer spacing was corrected; ambiguous Supabase task/workspace joins were fixed; duplicate active profile-gap tasks are reconciled; the live board currently loads 8 active tasks.
- Mobbin grounding: [Codecademy result hierarchy](https://mobbin.com/screens/fc2dd380-28af-4459-95ba-a21396c65286), [Uxcel result summary](https://mobbin.com/screens/470d90c2-3137-4efb-9798-7dea10710d64), [Mercor opportunity browsing](https://mobbin.com/screens/67ac792b-1c55-4d5a-805e-b32faa3be760), and [Contra action checklist](https://mobbin.com/screens/1968548c-f02b-4b16-a755-fb57a5a9ba09).
- Verified in browser: `/today` stays on `/today`; `/recommendations` stays on `/recommendations` and loads five evaluated routes; country detail has no switcher and uses a range budget control; the funding drawer opens cleanly; the task board loads live data instead of its former error state.
- Comment-by-comment acceptance: [UX_COMMENT_ACCEPTANCE_2026-08-10.md](UX_COMMENT_ACCEPTANCE_2026-08-10.md).

## Stable authenticated first paint — 10 August 2026

- Done: the shared student shell no longer renders anonymous defaults while authentication, profile and report data are resolving.
- Done: authenticated workspace, saved report, catalogue, recommendation results, and route-specific education directory data are supplied in the first server response.
- Done: task cards no longer nest interactive buttons, removing the React hydration error and red development issue badge.
- Done: country flags no longer generate aspect-ratio warnings during route changes.
- Removed the temporary loading interface; no “Student”, sign-in chip, zero-value dashboard, or recommendation evaluation placeholder is rendered before live data.
- Browser verified on Today, Recommendations, and Countries: Haidar/live workspace appears directly, recommendations are populated without a loading card, directory data is present, and no recent console or hydration errors were recorded.
- Production build passed after clean generated-cache rebuild.
- Code checks: lint, typecheck, 25/25 tests and production build pass.
