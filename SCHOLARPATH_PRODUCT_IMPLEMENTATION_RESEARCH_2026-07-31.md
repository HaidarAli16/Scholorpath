# ScholarPath Product Implementation Research

Date: 31 July 2026  
Scope: beta-ready interactive frontend for student, research-operations, and platform-admin modules.

## Product rule

ScholarPath is an evidence-backed progress system for Pakistani, Indian, and Bangladeshi students pursuing international study. It does not sell consultation, predict acceptance, or submit on a student's behalf. It translates a student's evidence into explainable routes, blockers, tasks, and decisions.

## Pattern research translated into the product

### Mobbin

- Progressive onboarding: Nibble, Evernote, Life Reset, and Uxcel Go informed one-decision-per-step profiling, visible progress, and contextual guidance.
- Dense but calm dashboards: ClickUp, Rox, 15Five, Mintlify, Slack, and Vanta informed overview-first hierarchy, next-action emphasis, and compact system health.
- Discovery: DoorDash, SuperHi, Klarna, and Mobbin catalogue flows informed visible filters, active-filter chips, result counts, and focused detail surfaces.
- Task and application workflows: Manus, Deel, Glassdoor, and Tiimo informed explicit states, blocking dependencies, completion feedback, and resumable progress.
- Operations: Wrike, Optimal Workshop, Navattic, Braintrust, Vanta, and Aboard informed impact-ordered tables, saved-state controls, ownership, and slide-over record review.

### Untitled UI

The implementation uses the interaction grammar of Untitled UI's application components: accessible filter bars, progress steps, file-upload states, data tables, alerts, empty states, dialogs, and slide-over panels. The visual styling remains ScholarPath's own Urbanist-based system and does not copy proprietary assets.

## Implemented modules

- Adaptive assessment: conditional questions, system suggestions, controlled selections, and a detailed pathway report.
- Today: evidence landscape, strongest routes, current blockers, deadlines, and next-best actions.
- Discover: search, opportunity type, verified/funding filters, sorting, save state, result counts, and explainable detail.
- Portfolio: controlled selection, multi-route comparison, match states, deadlines, costs, and open checks.
- Applications: readiness, blockers, requirements, linked documents, writing, confidential references, and accountable activity.
- Tasks: state filters, completion/reopen behavior, dependency context, and task details.
- Documents: search, categories, secure-upload explanation, versioning, access boundaries, and detail review.
- Writing: evidence outline, item switching, grounded-writing guardrail, draft editor, and word count.
- Funding: baseline and conditional scenarios, confirmed-versus-conditional separation, and editable assumptions.
- Offers: structured offer capture, conditions, net-cost framework, and decision deadlines.
- Profile: completeness, priority evidence gaps, per-section evidence state, and change-impact explanation.
- Notifications: material-event filters, read state, preferences, and contextual action.
- Help and corrections: searchable guides and exact-fact correction reporting with an audit path.
- Research operations: source capture, impact queue, state filtering, freshness, conflicts, reviews, and versioned publication controls.
- Platform administration: users, support, corrections, delivery, analytics, security, audit, permissions, and filtered accountable activity.
- Global interaction layer: command search, escape-to-close behavior, detail drawers, responsive mobile states, reduced-motion handling, and strong keyboard focus.

## Recommendation-engine contract

The frontend is designed for a deterministic, explainable engine backed by versioned data—not a black-box external AI API.

1. Normalize profile facts and evidence states.
2. Evaluate atomic eligibility rules as pass, conditional, fail, unknown, or stale.
3. Apply hard gates before any ranking.
4. Score only surviving routes across academic alignment, goal fit, funding feasibility, deadline feasibility, evidence readiness, and source confidence.
5. Return reason codes, open checks, source versions, and affected facts with every result.
6. Recompute only impacted routes when a profile answer or rule changes.
7. Never emit acceptance probability unless a future validated statistical model supports it.

## Data and backend boundary

- Supabase remains suitable for beta authentication, PostgreSQL, row-level security, storage, realtime events, and scheduled/edge workflows.
- Core entities: profiles, evidence records, sources, source snapshots, programmes, scholarships, atomic rules, evaluations, portfolios, applications, requirements, tasks, documents, writing items, references, funding scenarios, offers, notifications, correction tickets, review jobs, and audit events.
- Research data enters through controlled source capture and human review. Public pages and official documents are stored as cited snapshots; normalized facts are separately versioned.
- Student documents must use private storage buckets, short-lived signed access, strict row-level policies, malware/file validation, and access logging.

## Beta acceptance criteria

- Every page has a purposeful empty, loading, error, and success state when connected to live data.
- Every recommendation exposes why it surfaced and what remains unknown.
- All deadlines retain source timezone and display the student's local timezone.
- Conditional funding never reduces confirmed funding gap.
- Confidential recommendations cannot be viewed by students.
- Official submission remains clearly external.
- Material research and admin actions are versioned and attributable.
- Accessibility target: WCAG 2.2 AA for contrast, focus, labels, keyboard access, reduced motion, and touch targets.

## Verification completed

- TypeScript typecheck: passed.
- Next.js production build: passed.
- All 14 product routes returned HTTP 200 on the local server.
- Source scan found no remaining mojibake markers, TODOs, or FIXMEs in the primary product component and stylesheet.

## Sources

- Mobbin flows and screens: https://mobbin.com/
- Untitled UI React components: https://www.untitledui.com/react/components
- Untitled UI Application UI: https://www.untitledui.com/react/application-ui
- Untitled UI filters: https://www.untitledui.com/components/filters
- Untitled UI tables: https://www.untitledui.com/react/components/tables
- Untitled UI slideouts: https://www.untitledui.com/react/components/slideout-menus
- Untitled UI progress steps: https://www.untitledui.com/react/components/progress-steps
- Untitled UI file uploaders: https://www.untitledui.com/react/components/file-uploaders
## Backend implementation update

The planned backend boundary is now implemented in code: Supabase browser/server clients, auth and recovery, session middleware, complete RLS migration, live workspace API, assessment persistence, deterministic atomic-rule recommendations, private signed document storage, confidential recommender submissions, staff research operations, correction tickets, audit events, and persistent create forms. The local build remains in safe Demo mode until project credentials and migrations are supplied.

Final validation after backend implementation:

- TypeScript typecheck passed.
- Next.js production build passed across 18 page/API routes.
- Full dependency audit passed with zero known vulnerabilities.
- All public product pages returned HTTP 200.
- Protected staff and confidential endpoints returned the expected denial states without credentials.
- The deterministic assessment endpoint returned a complete report.