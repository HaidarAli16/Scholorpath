# ScholarPath implementation status

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

Build the Supabase truth system: source registry, programme and scholarship
cycles, atomic requirement rules, reviewer publication workflow, and
student-profile persistence. Then connect the current pathway workspace to
verified opportunity records.
