# ScholarPath implementation status

## Sprint 4: Production backend and live decision path

Status: repository-ready and verified locally on 3 August 2026; remote migration pending

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

- Apply the four migrations to Supabase project `gbhzekncpqeytknxanzy`.
- Install production environment secrets, run Security/Performance Advisors and
  complete the documented two-account isolation test before inviting beta users.

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
