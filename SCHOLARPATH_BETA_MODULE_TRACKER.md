# ScholarPath beta readiness

**Target:** Invite-only beta on **14 December 2026**

**Updated:** 6 August 2026 · **130 days remaining**
**Current verdict:** Beta-shaped codebase, but **not live-beta-ready**. The main risk is production connection and proof, not missing screens.

**Status rule:** Done = built + connected + tested + accepted live. Partial = useful implementation exists but release evidence is missing. Blocked = credentials or external action required.

## Module status

| Module | Status | Done | Missing before beta |
|---|---|---|---|
| M00 Design system and shell | Partial | Urbanist, responsive student shell, states and accessibility foundations | Founder UX sign-off and live desktop/mobile acceptance |
| M01 Account, consent and security | Blocked | Auth UI, middleware, roles, consent schema and RLS | Supabase keys, redirects, SMTP, first admin, recovery and two-user live isolation |
| M02 Profile and evidence | Partial | Guided profile, validation, normalization, assessment schema and snapshots | Live cross-device persistence and signed-in evidence journey |
| M03 Education truth system | Partial | Versioned sources/facts/rules; 4 countries, 9 cities and 12 institutions | Deploy migrations 009–010; expand from 5 current opportunities to 10 independently reviewed records |
| M04 Eligibility engine | Partial | Deterministic hard gates, conditional/unknown states and reason codes | Thirty golden profiles and production catalogue regression |
| M05 Recommendation engine | Partial | Versioned scoring, explainable factors, balance logic and persistence model | Golden/fairness suite, broader retrieval and live stored runs |
| M06 Discovery and details | Partial | Search/filter/detail UX, citations, freshness and live API boundary | Ten live opportunities and signed-in production acceptance |
| M07 Portfolio and compare | Partial | Save, group, notes and comparison UX | Verify persistence and comparison against live recommendation versions |
| M08 Application tracker | Partial | Application states, requirements, readiness and activity UI/schema | Live create/update journey and deadline/version-change handling |
| M09 Tasks and deadlines | Partial | Kanban, impact, dependencies, evidence, APIs and engine tests | Scheduled reminders, real deadline changes and production acceptance |
| M10 Document vault | Partial | Upload/download routes, private buckets, RLS and document UX | Live storage test, malware scanning and per-application acceptance |
| M11 Notifications, support and corrections | Partial | UI/preferences, correction and outbox models | Email worker, support inbox, monitoring and delivery tests |
| M12 Operations and administration | Blocked | Protected live API, operations/admin UI, audit and research roles | Production admin/users, source-review exercise and Supabase advisors |
| M13 Writing and recommenders | Partial / later | Writing UX, recommender routes and confidential-storage model | Email/reminders and live confidential submission test |
| M14 Funding, offers and decisions | Partial / later | Funding/offer UX and data model | Live persistence, verified cost assumptions and decision acceptance |
| M15 Shared API and iOS foundation | Partial | Reusable server routes and domain services | Versioned `/v1`, OpenAPI contract and iOS client |

## Current evidence

- `main` is clean at `0cc610f`; latest GitHub application and database quality gates passed.
- 21 unit tests and 9 pgTAP security/isolation assertions pass in CI.
- Ten reviewed migrations exist locally; production is only documented through migration 008 and cannot currently be verified.
- Catalogue code contains **2 published programmes + 3 published scholarships**; the beta proof target is 10 current independently reviewed opportunities.
- Institution directory has 12 institutions, but rankings cover only 4 and regional equivalencies cover only Leeds and Trinity.
- No `.env.local`, Vercel link, GitHub deployment, repository secrets, or `beta` GitHub environment currently exists.
- Without environment keys, important flows intentionally run in demo/curated-fallback mode.

## Critical path

1. **6–15 Aug:** Restore Supabase access, deploy 009–010, configure Auth/admin/RLS, connect Vercel and open a live preview.
2. **16 Aug–15 Sep:** Reach 10 independently reviewed opportunities; build 30 golden profiles and fix engine regressions.
3. **16 Sep–15 Oct:** Complete live student journey, storage, reminders, support, corrections and operations workflow.
4. **16 Oct–15 Nov:** Security/advisor review, accessibility and device QA, monitoring, backups and closed pilot.
5. **16 Nov–1 Dec:** Resolve pilot defects, refresh all facts and freeze beta scope.
6. **2–13 Dec:** Release candidate, production smoke tests, invitations and rollback drill.
7. **14 Dec:** Invite-only beta launch.

## Immediate next actions

- User signs into Supabase so migrations and project state can be verified.
- Configure the five required environment variables securely; never paste secret keys into chat.
- Create/link the Vercel project and deploy a protected preview.
- Add and independently review five more current opportunities.
- Expand tests to 30 golden profiles plus one automated signed-in end-to-end journey.

**Scope guard:** Do not add new modules before these five actions are complete.
