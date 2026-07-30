# ScholarPath Beta Module Tracker

**Complete system reference:** [ScholarPath Complete Education System Map](./SCHOLARPATH_COMPLETE_SYSTEM_MAP.md)

**Goal:** Invite-only beta in 10 working days, with 4 buffer days.  
**First users:** Postgraduate applicants from Pakistan, India and Bangladesh.  
**First routes:** UK, Germany and Erasmus Mundus.  
**Proof target:** 10 independently reviewed opportunities that work from official source to application plan.

> The current interface is a discarded prototype. The beta will use a readable, student-first UI with larger type, clearer hierarchy and less dashboard density.

**Priority:** P0 = beta-critical | P1 = add only after P0 is stable | Later = outside beta

## Product modules

### [ ] M00 - Design system and app shell - P0

A calm, readable responsive interface built from VOIT foundations and redesigned for students.

- Urbanist; 16px minimum body, 14px supporting text, 32-48px headings and 44px controls
- Five destinations: Today, Discover, Portfolio, Applications and Workspace
- Accessible contrast, focus, reduced motion, and complete loading/empty/error/stale states

### [ ] M01 - Account, consent and security - P0

Secure access and clear control over each student's personal data.

- Sign-up, verification, login, recovery, logout and session management
- Student, researcher, reviewer and administrator roles
- Consent, privacy controls, account export and deletion foundation

### [ ] M02 - Student profile and evidence - P0

Capture what a South Asian student can prove without unreliable foreign-grade conversion.

- Original qualification, grading scale, result, institution, field and study gaps
- English, work, research, projects, documents, goals, intake and funding position
- Guided dropdowns, conditional questions, missing-fact prompts and versioned snapshots

### [ ] M03 - Education truth system - P0

Store programmes and scholarships as reviewed, versioned facts rather than copied listings.

- Institutions, programmes, scholarships, application cycles and funding components
- Atomic requirements, deadlines, documents and official source locators
- Draft/review/published/stale/conflict/archive states, reviewer and change history

### [ ] M04 - Eligibility engine - P0

Evaluate hard requirements deterministically before ranking any opportunity.

- Eligible, conditional, ineligible, missing-information and unknown outcomes
- Versioned atomic rules, reason codes, failed rules and unresolved conditions
- Reproducible reports with source evidence; no admission, scholarship or visa probability

### [ ] M05 - Recommendation engine - P0

Build an explainable, balanced portfolio using eligibility, fit, affordability and readiness.

- Candidate retrieval using structured filters, full text and semantic similarity
- Hard-rule gate, then versioned academic/funding/preference/readiness/confidence scoring
- Portfolio diversity, stored feature values, 30 golden profiles and regression/fairness tests

### [ ] M06 - Verified discovery and details - P0

Help students research opportunities while seeing requirements, uncertainty and freshness.

- Search, filters, sorting, saved searches and zero-result recovery
- Cards and detail views for match state, funding, deadlines, rules and documents
- Official citations, last-reviewed state and fact-level correction reporting

### [ ] M07 - Portfolio, save and compare - P0

Turn discovery into a balanced shortlist instead of a favourites list.

- Save/remove, notes, planning groups and 2-4 item comparison
- Differences across funding, requirements, deadlines, documents and freshness
- Ambition, affordability and concentration warnings without guarantee language

### [ ] M08 - Application tracker - P1

Turn a saved opportunity into an accountable application case with visible blockers.

- Considering, preparing, ready, submitted, awaiting-result, offer and closed states
- Requirement matrix tied to the reviewed opportunity version
- Readiness counts, submission reference, evidence snapshot and activity history

### [ ] M09 - Tasks and deadlines - P1

Generate the next useful action from real requirements, deadlines and dependencies.

- Today, upcoming, blocked, waiting and completed views
- Requirement, owner, due date, timezone, dependency and reminder
- System rationale, completion evidence and deadline-change history

### [ ] M10 - Document vault - P1

Upload once and track whether each version is accepted for each application.

- Identity, academic, language, financial, research and submission categories
- Upload, preview, version, expiry, replacement and requirement linking
- Private Supabase Storage, signed access and per-application acceptance status

### [ ] M11 - Notifications, support and corrections - P1

Notify students only when a deadline, fact, document or support state needs attention.

- In-app/email preferences and deadline/source/document/security alerts
- Support tickets with minimum necessary account context
- Fact-level corrections with acknowledgement and visible resolution status

### [ ] M12 - Research operations and administration - P0

Give the internal team the controls needed to keep student-facing information trustworthy.

- Source inbox/registry, opportunity editor, atomic rule editor and review diff
- Freshness, conflict, correction and publication queues
- Roles, users, audit log, security events and operational health metrics

### [ ] M13 - Writing and recommenders - Later

Guide authentic writing and recommendation requests without becoming an essay factory.

- Prompt breakdown, evidence bank, outline, drafts, versions and word-limit checks
- Recommender invitation, deadline, reminder and received state
- Student-controlled export; no automatic final essay or confidential-letter exposure

### [ ] M14 - Funding, offers and decisions - Later

Compare real costs, confirmed funding, conditions and remaining financial gaps.

- Tuition, living costs, travel, deposits, exchange assumptions and funding components
- Confirmed/conditional/unresolved funding and scenario sensitivity
- Offer conditions, response dates, deposits and side-by-side decision view

### [ ] M15 - Shared API and future iOS foundation - Foundation

Keep core logic reusable across the web beta, future iOS app and approved clients.

- Versioned internal `/v1` contracts for profile, opportunity, eligibility and recommendation
- Validation, authorization, rate limits, audit records and OpenAPI schemas
- Web uses shared domain services; MCP stays a later read-only adapter with no ranking logic

## Previous build: decision record

### Keep as concepts

- Adaptive onboarding/profile DNA; scholarship list, detail, save and compare
- Journey, tasks, vault, content operations and service/API separation
- Deterministic decisions separated from human-readable explanations

### Rebuild completely

- Visual system, typography, navigation and responsive interactions
- Source registry, atomic facts, review, freshness and correction workflow
- Eligibility/recommendation engines, Supabase persistence, RLS, storage and test coverage

### Keep outside this education beta

- Jobs, skilled migration, general visa tools, counselor marketplace and community feed
- Admission/scholarship/visa probability claims, 3D globe and AI essay factory

## Recommendation engine: required pipeline

1. **Retrieve:** Narrow the catalogue with structured filters, text and semantic matching.
2. **Gate:** Apply hard deterministic rules and expose missing or unknown facts.
3. **Score:** Rank viable options by academic, funding, preference, deadline and source confidence.
4. **Balance:** Mix realistic, ambitious, funding-first and needs-research options.
5. **Explain:** Show passed, failed and unresolved rules with official evidence and next actions.
6. **Test:** Run 30 golden profiles for correctness, subgroup fairness and regression safety.
7. **Learn later:** Use outcomes only after enough reliable data, consent and governance exist.

## 10-day beta timeline

| Day | Delivery | Exit check |
|---|---|---|
| 1 | Freeze scope, schema and readable UI direction | P0 decisions signed off |
| 2 | Design system, shell, auth and roles | Desktop/mobile access works |
| 3 | Profile, evidence and snapshots | One full regional profile persists |
| 4 | Source registry, opportunity model and review | One source is captured and approved |
| 5 | Enter and review 10 real opportunities | Important facts have provenance |
| 6 | Eligibility, reason codes and golden tests | Correct known/unknown outcomes |
| 7 | Ranking, portfolio balance and explanations | Results are reproducible |
| 8 | Discovery, details, save and compare | Research loop works end to end |
| 9 | Applications, requirements, tasks and basic vault | One result becomes an action plan |
| 10 | Security, accessibility, browser QA and Vercel beta | Invite-only beta opens |
| 11-14 | Buffer for bugs, corrections and tester feedback | Critical issues resolved |

## Beta release gates

- [ ] New UI approved at desktop and mobile widths; text is comfortably readable
- [ ] 10 real opportunities independently reviewed with evidence and freshness
- [ ] 30 golden profiles pass eligibility and ranking regression tests
- [ ] Every recommendation explains rules, evidence, uncertainty and next actions
- [ ] Supabase RLS blocks cross-user access and no service credential reaches the browser
- [ ] Auth to profile to discovery to portfolio to application works end to end
- [ ] Loading, empty, error, stale and conflict states are tested
- [ ] Feedback, support and fact-correction channels are live

## Founder sign-off

- Beta scope: ____________________  UI direction: ____________________
- First 10 opportunities: ________  Beta invitation date: ___________
