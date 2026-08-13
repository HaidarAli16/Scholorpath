# CandidRoute product tracker

Updated: 13 August 2026

The 14 August beta framing has been removed. Current product truth now lives in [SCHOLARPATH_PRODUCT_STATUS.md](SCHOLARPATH_PRODUCT_STATUS.md).

## Immediate status

Fresh verification on 13 August 2026: typecheck, lint, all 25 automated tests and the production build pass. Supabase migration parity is 36/36, schema lint is clean, and the protected admin control-plane schema is live. Optimized commit `77e1f14` remains the current production deployment until this control-plane commit is promoted.

| Area | Status | One-line truth |
|---|---|---|
| UI shell | Partial | All 29 annotated UX defects are closed at the target desktop viewport; cross-device and mobile acceptance remain. |
| Supabase backend | Partial | Live schema is reachable; migration parity is 35/35, route-specific indexes are live, schema lint is clean and database cache-hit ratios are 100%. Two-account acceptance and remaining Advisor warnings remain. |
| Opportunity ingestion | Partial | Official-source pipeline exists, but worldwide coverage needs source packs, parsers and review. |
| Recommendation engine | Partial | The engine direction is correct, but it cannot be trusted until published catalogue coverage and golden-profile tests exist. |
| Country intelligence | Partial | Architecture/UI direction exists; complete country facts are still missing. |
| Institution directory | Partial | Database/UI direction exists; production university, campus, course and ranking data are still missing. |
| Deployment | Done | Optimized production deployment is READY and public at `candidroute-taatuftech-1331s-projects.vercel.app`; home, robots, sitemap and core public APIs return 200. |
| Admin and CMS | Code + DB verified | Admins can manage access/plans, core education content, ingestion, support, audit and settings from one protected control plane; authenticated visual acceptance remains. |

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

1. Build global official source packs and structured parsers.
2. Review and publish enough current opportunities for real recommendations.
3. Prove signed-in student and admin flows in browser.
4. Complete Supabase security hardening.
5. Monitor production latency and move the Vercel project-level function region to Singapore if the account exposes regional controls.

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
