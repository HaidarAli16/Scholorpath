# ScholarPath implementation status

## Sprint 6: Beta release readiness

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
