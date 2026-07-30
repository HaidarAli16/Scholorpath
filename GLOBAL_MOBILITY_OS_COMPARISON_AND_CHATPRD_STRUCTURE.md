# ScholarPath × Global Mobility OS

## Deep comparison, consolidation decisions, and ChatPRD operating structure

**Prepared:** 30 July 2026  
**ScholarPath repository reviewed:** `HaidarAli16/Scholorpath` at `6257843`  
**Global Mobility OS repository reviewed:** `HaidarAli16/global-mobility-os` at `dc48d76`

## 1. Executive decision

ScholarPath is the primary product and the only active delivery scope. Global
Mobility OS is a source of reusable product and architecture ideas, not a second
product that should be developed in parallel.

- **ScholarPath is education only:** scholarship, admissions, education-linked
  funding, application execution, and carefully bounded study-visa preparation.
- **Jobs and career migration are a separate future product.** ScholarPath may
  show sourced graduate-outcome and post-study-work context, but it is not a job
  marketplace or career-migration engine.
- **Visa intelligence/services are a separate future product.** ScholarPath may
  organize official study-visa requirements and readiness tasks, but it does not
  predict approval or provide legal advice.
- **Family visas and relocation are a separate future product.** ScholarPath may
  capture dependent-related education costs or official student-dependent notes
  where directly relevant, but it does not become a family-relocation platform.
- **Reusable platform foundations may be shared later:** identity, profile facts,
  evidence, source provenance, rules, readiness, tasks, documents, notifications,
  audit, privacy, and entitlements.

The recommended strategy is therefore:

```text
ScholarPath education product (build now)
  -> education profile and evidence
  -> verified programmes and scholarships
  -> eligibility and decision support
  -> application execution
  -> funding, writing, documents, and offers

Future products (separate scopes, later)
  -> career and job mobility
  -> visa intelligence/services
  -> family visa and relocation
```

Do not build a public umbrella product now. Build ScholarPath with clean domain
boundaries so selected foundations can be reused by separate future products.

## 2. What was reviewed

### ScholarPath

- Four major product and operating specifications.
- A complete A-O frontend contract and 29-module product blueprint.
- Adaptive onboarding and deterministic pathway assessment.
- Responsive student, research-operations, and admin UI prototypes.
- A four-table Supabase/Postgres foundation migration.
- Shared demo fixtures and one implemented API route.

### Global Mobility OS

- Twenty-module master product definition.
- V1 user and admin journey.
- Deterministic recommendation formulas.
- Proposed relational, JSONB, and vector database domains.
- Structured-monolith architecture and service boundaries.
- API endpoint plan, page inventory, sprint plan, and monetization model.
- Current Next.js route shells and placeholder interfaces.

### External market signals

- Borderless Self positions a Global Mobility OS around a mobility profile,
  document vault, readiness, country intelligence, pathways, and household
  mobility.
- AskAïa emphasizes employer compliance, permit timelines, secure records,
  renewals, role-based access, and audit-ready evidence.
- Deel Mobility emphasizes managed cases, documents, timelines, renewals, and
  expert-supported immigration workflows.
- Studyportals is strongest at catalogue scale and programme comparison.
- Cialfo is strongest at counselor-led application execution, shared records,
  tasks, documents, and direct applications.
- Interstride connects education, careers, sponsorship-aware jobs, and
  immigration resources.

These products reinforce that the durable category is not “AI recommendations.”
It is structured profile data plus trusted knowledge plus execution workflows.

## 3. Honest implementation comparison

| Dimension | ScholarPath | Global Mobility OS |
| --- | --- | --- |
| Product scope | Narrower education and scholarship workflow | Very broad education, career, visa, family, advisor, and payments vision |
| Documentation | Deep operating and frontend specification | Strong platform, architecture, formula, schema, and monetization documentation |
| Current UI | Broad, polished frontend prototype across 15 routed destinations | 23 route shells, most explicitly labeled placeholders |
| Functional vertical | Onboarding -> validation -> deterministic pathway report -> local task interaction | No functional end-to-end vertical yet |
| API implementation | One assessment API route | No API route implementation |
| Domain engine implementation | Assessment schema, types, and deterministic engine | Engine directories contain README placeholders only |
| Database implementation | Draft SQL migration with profiles, assessments, reports, sources, and RLS | Proposed schema documentation; no SQL migrations |
| Real data | Demo opportunities and fixed research lanes | No implemented knowledge records or seed data |
| Authentication | Not connected | Screens only; not connected |
| Source truth system | Well specified and identified as next milestone | Knowledge/source concepts exist but are less operationally detailed |
| Application execution | Detailed UI and specification | High-level action-plan/dashboard concept |
| Career and migration | Explicitly outside the first focused workflow | Central part of the long-term scope |
| Billing | Blueprint only | Stripe architecture and entitlement plan, no implementation |
| Tests | Prior local verification is documented; no committed automated suite | No committed tests |

### Conclusion

ScholarPath is materially ahead in implemented product experience. Global
Mobility OS is materially ahead in broad platform framing, service boundaries,
formula reproducibility, monetization architecture, and career/visa/ROI domain
thinking.

Neither repository is production complete.

## 4. Module-by-module comparison

| Global Mobility OS module | ScholarPath equivalent | Decision |
| --- | --- | --- |
| 01 Authentication and roles | Account, consent, recovery, admin roles | **Adopt now.** Required P0 foundation. |
| 02 User Profile DNA | Student profile and evidence graph | **Adapt now.** Use source facts, evidence, completeness, and versioned derived signals; avoid one opaque JSON “DNA.” |
| 03 Country Intelligence | Destination context and route discovery | **Adapt narrowly.** Store official pathway facts and practical planning signals; do not build global lifestyle rankings yet. |
| 04 University/program knowledge | Programme catalogue | **Adopt now.** Add cycles/intakes, official sources, freshness, and atomic requirements. |
| 05 Job/skill shortage | No current equivalent | **Defer.** Future career-mobility pack. |
| 06 Visa policy engine | Visa planning is intentionally limited | **Defer and constrain.** Only official planning dependencies relevant to a student application; no legal eligibility verdicts. |
| 07 Matchmaking engine | Eligibility and suitability engines | **Adapt now.** Keep hard rules and transparent suitability; reject unsupported probabilities. |
| 08 Study-abroad matcher | Discovery, readiness, portfolio | **Adopt now.** ScholarPath already specifies this more safely. |
| 09 Career migration matcher | No equivalent | **Defer.** Separate future vertical. |
| 10 Scholarship engine | Scholarship/funding catalogue | **Adopt now.** ScholarPath has stronger cycle, funding-component, and source requirements. |
| 11 Cost and ROI | Funding scenarios, affordability, offers | **Adapt.** Use scenario ranges and explicit assumptions; do not present speculative salary forecasts as facts. |
| 12 Visa risk predictor | No direct equivalent | **Reject for V1.** Replace with requirement readiness, evidence gaps, and official-rule risk flags. |
| 13 Document vault/analyzer | Document and requirement matrix | **Adopt vault; constrain analysis.** Start with storage, metadata, versioning, expiry, completeness, and human-verifiable checks. |
| 14 SOP/LOR/CV generator | Writing and recommender workspace | **Adapt.** Guided evidence-based writing is safer than automatic final-document generation. |
| 15 Application journey | Applications, tasks, deadlines, documents, offers | **Adopt.** ScholarPath is significantly deeper here. |
| 16 Counselor marketplace | Explicitly rejected/limited in ScholarPath | **Defer or reject.** It introduces incentives, licensing, quality, and neutrality conflicts. |
| 17 Community/social trust | Later community concept | **Defer.** Moderation and misinformation burden is high. |
| 18 Subscription/payments | Billing and entitlements | **Adopt architecture later.** First prove free value and execution willingness-to-pay. |
| 19 Admin super panel | Research operations plus administration | **Adopt with separation.** Research truth operations and platform administration should remain distinct. |
| 20 Ingestion/refresh | Source registry, review, publication, freshness | **Adopt immediately.** ScholarPath’s manual-first, reviewed truth workflow should be authoritative. |

## 5. High-value concepts to reuse from Global Mobility OS

### 5.1 Structured-monolith boundaries

Keep pages and route handlers thin. Put domain behavior in bounded modules and
external providers behind services. A recommended ScholarPath structure is:

```text
src/app                 routes, server actions, route handlers, layouts
src/components          product UI and shared presentation
src/modules/profile     source facts, evidence, normalization, completeness
src/modules/catalogue   institutions, programmes, scholarships, cycles
src/modules/rules       atomic requirements, evaluation, explanations
src/modules/portfolio   saves, comparison, application state
src/modules/execution   tasks, deadlines, dependencies, readiness
src/modules/documents   metadata, versions, requirement links
src/modules/research    source intake, review, publication, freshness
src/modules/admin       access, support, corrections, audit
src/services            Supabase, storage, notifications, billing
database                migrations, seeds, RLS, database tests
```

### 5.2 Reproducibility

Reuse the requirement that every computed result stores:

- input/profile snapshot version;
- source and rule versions;
- raw and normalized values where scoring is used;
- weights and thresholds;
- hard-rule outcomes and reason codes;
- generated timestamp;
- explanation metadata;
- reviewer/publication state.

### 5.3 Worker-ready workflows

Design direct V1 service calls so they can later become queued jobs:

- recommendation recalculation;
- source refresh and diffing;
- document metadata extraction;
- deadline and notification generation;
- report export;
- analytics aggregation;
- billing reconciliation.

### 5.4 Entitlement boundaries

Keep payments separate from product truth. Entitlements may control report depth,
exports, or execution tooling, but must never change eligibility results,
verification labels, ranking neutrality, or correction access.

### 5.5 Broader profile model

ScholarPath can safely borrow professional, family, financial, language, and
mobility-intent fields when they directly affect an education pathway. Capture
them progressively, with purpose explanations, not as one giant onboarding form.

## 6. Concepts that must not be imported unchanged

### 6.1 “Success probability,” “admission probability,” and refusal prediction

The Global Mobility OS formulas assign precise weights to variables such as
“acceptance probability,” “embassy strictness,” and “visa probability fit” without
an identified representative outcome dataset, calibration method, uncertainty
model, or fairness evaluation.

These numbers would look scientific without being validated. ScholarPath’s current
states—eligible, conditional, ineligible, unknown, and not recommended—are safer
and more actionable.

Recommended replacement:

```text
hard eligibility result
+ evidence completeness
+ source confidence/freshness
+ suitability dimensions
+ unresolved conditions
+ explicit assumptions
= explainable decision support, not predicted outcome
```

### 6.2 “Embassy strictness” and profile proxies

Nationality, age, religion-related preferences, travel history, gaps, finances,
and location can become unfair proxies. The platform should never imply that it
knows how a visa officer will treat an individual.

Use only official requirements and user-controlled planning preferences. Separate:

- legal/official facts;
- applicant-provided facts;
- derived readiness signals;
- user preferences;
- unverified assumptions.

### 6.3 Sensitive preference ranking

The Global Mobility OS country model includes “Muslim community density.” Religion
or inferred religious preference can be sensitive personal data in several
jurisdictions. If community preferences are ever offered, they should be optional,
explicitly user-provided, separately consented, removable, and excluded from legal
eligibility or risk evaluation.

### 6.4 Automatic document judgments

Do not initially claim to verify bank-statement sufficiency, detect plagiarism,
judge “weak wording,” or validate official evidence through AI. Begin with:

- file type and size checks;
- visible completeness and expiry metadata;
- duplicate/hash detection;
- user-confirmed document type;
- human review where needed;
- clear “not verified” states.

### 6.5 Conflicted monetization

University lead generation, affiliate products, and counselor commissions can
conflict with neutral rankings. If introduced later:

- commercial relationships must be disclosed;
- sponsored placement must never affect eligibility or organic ranking;
- users must be able to filter sponsored options;
- research and revenue permissions must be separated;
- corrections and source visibility must remain free.

## 7. Recommended canonical product architecture

Replace overlapping A-O, 0-28, and 01-20 lists with ten stable product domains.
Individual PRDs live below these domains.

### Domain 1 — Platform identity and access

- Authentication and recovery
- Roles and permissions
- Consent and privacy choices
- Account lifecycle and deletion
- Subscription entitlements

### Domain 2 — Mobility profile and evidence

- Personal and origin facts
- Academic, test, and professional records
- Financial and family context
- Goals, constraints, and preferences
- Evidence links and verification states
- Profile snapshots and completeness

### Domain 3 — Knowledge and source truth

- Source registry
- Institutions, programmes, scholarships, and cycles
- Destination/pathway facts
- Atomic facts and effective dates
- Intake, review, conflicts, publication, and freshness

### Domain 4 — Rules and decision support

- Atomic eligibility rules
- Hard outcomes and reason codes
- Suitability dimensions
- Uncertainty and missing-data handling
- Versioned, reproducible evaluation
- Human-readable explanations

### Domain 5 — Discovery and portfolio

- Search and filters
- Opportunity details and source evidence
- Save, shortlist, compare, and portfolio balance
- Readiness report and next actions

### Domain 6 — Application execution

- Application state machine
- Requirements and blockers
- Tasks, dependencies, milestones, and deadlines
- Submission readiness and activity history

### Domain 7 — Documents, writing, and recommenders

- Private document vault
- Versioning and requirement mapping
- Guided writing and evidence bank
- Recommender requests and status

### Domain 8 — Funding, affordability, offers, and decisions

- Funding components
- Cost assumptions and scenarios
- Currency and sensitivity ranges
- Offer conditions, deposits, and response dates
- Decision comparison and outcome capture

### Domain 9 — Communication and support

- In-app/email notifications
- Preferences and quiet periods
- Help content
- Corrections, support cases, and disputes

### Domain 10 — Operations, governance, and learning

- Research operations
- User and support administration
- Security and audit
- Product analytics and data quality
- Billing operations
- Formula/rule configuration governance

### Deferred vertical packs

- Career and occupation mobility
- Employer-sponsored mobility
- Residency, ancestry, citizenship, and family pathways
- Advisor/counselor tooling
- Community
- Native iOS

## 8. Product positioning

### Recommended ScholarPath positioning

> ScholarPath is a source-backed scholarship and admissions execution platform
> that helps internationally mobile students understand what they qualify for,
> what remains uncertain, and what to do next.

### Recommended relationship to Global Mobility OS

> ScholarPath is the active education product. Global Mobility OS is archived
> strategy and architecture input. Future career, visa, and family-relocation
> products may reuse ScholarPath foundations but require separate product
> decisions, positioning, risk review, and delivery plans.

Do not market the consumer V1 as an “operating system” unless the product truly
connects profile, verified knowledge, decisions, and execution. “OS” is useful as
an internal architecture and long-term category thesis; the first customer promise
should be concrete.

## 9. Competitive differentiation

| Category | Established strength | ScholarPath opportunity |
| --- | --- | --- |
| Programme search | Studyportals offers very large catalogue breadth | Win on source-level eligibility explanations and execution, not catalogue volume |
| Application platforms | ApplyBoard and Cialfo connect discovery to submission and counselor workflows | Win on neutrality, transparency, student ownership, and non-partner opportunities |
| Global student career | Interstride connects international students to jobs and immigration resources | Add career continuation only after education execution is stable |
| Employer mobility | Deel and AskAïa manage cases, permits, renewals, compliance, and experts | Do not compete in employer compliance in the first product |
| Personal mobility OS | Borderless Self emphasizes documents, readiness, profiles, households, and pathways | Differentiate ScholarPath through verified programme/scholarship rules and application depth |

The defensible asset is a reviewed, versioned rules-and-evidence graph connected to
real student execution. UI breadth or generic AI explanations are not defensible.

## 10. ChatPRD workspace structure

Create one active ChatPRD project named:

**ScholarPath — Education Mobility Vertical**

Store the Global Mobility OS documents inside ScholarPath only as archived
research/reference material. Do not create an active Global Mobility OS delivery
project. Create separate ChatPRD projects for career mobility, visa services, or
family relocation only when one of those products is explicitly approved.

### ScholarPath ChatPRD project folders/documents

```text
00 Strategy
  Product One-Pager
  Product Principles and Non-Goals
  Positioning and Business Model
  Decision Log

01 Research
  User and Problem Research
  Competitive Analysis
  Destination and Source Strategy
  Regulatory, Privacy, and Trust Notes

02 Platform
  Domain Model
  System Architecture
  Database and RLS Design
  Source Truth System
  Rule Grammar and Evaluation Contract
  API and Event Contracts

03 Product Domains
  Identity and Access PRD
  Profile and Evidence PRD
  Knowledge and Sources PRD
  Rules and Decision Support PRD
  Discovery and Portfolio PRD
  Application Execution PRD
  Documents/Writing/Recommenders PRD
  Funding/Offers PRD
  Notifications/Support PRD
  Operations/Admin PRD

04 Delivery
  MVP Scope and Release Criteria
  Roadmap and Sprint Plan
  Acceptance Criteria
  Test and Quality Strategy
  Launch Readiness

05 Learning
  Metrics Dictionary
  Research Queue
  Outcome Learning Plan
  Post-Launch Decisions
```

### ChatPRD project instructions — ready to paste

```text
You are the product documentation partner for ScholarPath, a source-backed
scholarship and admissions execution platform for internationally mobile students.

ScholarPath's first complete workflow serves postgraduate applicants from Pakistan,
India, and Bangladesh exploring a deliberately limited set of UK, Germany, and
Erasmus Mundus routes. Do not expand scope to general immigration, undergraduate,
community, counselor marketplace, employer mobility, or native iOS unless a decision
record explicitly changes the boundary.

Product truth rules:
1. Never invent admission, scholarship, or visa probabilities.
2. Separate official facts, applicant facts, derived signals, preferences, and
   assumptions.
3. Missing data is not a pass.
4. Every consequential rule or catalogue claim needs source provenance, effective
   dates, review status, and freshness state.
5. Use eligibility, conditional, ineligible, unknown, and not-recommended states
   with machine-readable reasons and user-readable explanations.
6. The student remains the applicant. The product supports preparation and
   execution but does not impersonate the student or promise outcomes.
7. Commercial relationships must not influence eligibility or organic ranking.
8. AI may summarize, explain, structure, and assist writing; deterministic rules
   and reviewed sources decide eligibility and ordering.

Documentation rules:
- Distinguish planned, designed, prototyped, implemented, verified, and released.
- Every PRD must include problem, target user, scope, non-goals, user journeys,
  functional requirements, data requirements, trust/privacy requirements, edge
  cases, analytics, dependencies, acceptance criteria, and release gates.
- Requirements must be testable. Avoid vague words such as intelligent, seamless,
  automated, verified, or personalized without defining their behavior.
- Preserve stable domain terminology from the canonical ten-domain architecture.
- Flag conflicts with prior decisions instead of silently overwriting them.
- Prefer the narrowest release that proves a trustworthy end-to-end workflow.
```

## 11. First ChatPRD documents to produce

Create these in order:

1. **Product One-Pager** — approve target user, initial markets, value proposition,
   business boundary, and non-goals.
2. **Canonical Domain Map** — approve the ten domains in this document.
3. **Truth-System Proof PRD** — source registry, programme/scholarship cycles,
   atomic rules, review/publication, and reproducible evaluation.
4. **Profile and Evidence PRD** — controlled onboarding, progressive profile,
   evidence, persistence, and consent.
5. **Verified Discovery PRD** — connect one real profile to ten reviewed
   opportunities and show honest results.
6. **MVP Release Criteria** — define what must be operational, tested, secure,
   and source-backed before calling V1 complete.

Do not begin by creating twenty-nine separate PRDs. That recreates the current
documentation sprawl before product decisions are locked.

## 12. Recommended implementation sequence

### Milestone 0 — Canonical decisions

- Approve brand relationship between ScholarPath and Global Mobility OS.
- Approve initial user, study level, origin markets, and destinations.
- Approve neutrality and monetization boundary.
- Approve outcome vocabulary and ban unsupported probability claims.
- Select the first ten representative opportunities.

### Milestone 1 — Truth-system proof

- Connect Supabase.
- Implement auth, users, profiles, and consent.
- Implement sources, opportunities, cycles, atomic facts, and rules.
- Implement draft -> review -> publish -> stale/conflicting states.
- Evaluate test profiles reproducibly against one official opportunity.
- Add database, RLS, and rule tests.

**Exit:** one official opportunity produces a complete source-to-result trace.

### Milestone 2 — Verified student result

- Persist adaptive onboarding.
- Add profile/evidence graph and controlled taxonomies.
- Evaluate ten reviewed opportunities.
- Show eligibility states, reasons, conditions, and official source links.
- Save and compare opportunities.

**Exit:** a student receives useful results without invented confidence.

### Milestone 3 — Application execution

- Create portfolio and applications.
- Add requirement matrix, tasks, deadlines, and document metadata.
- Add notification and correction workflows.
- Add research freshness and conflict queues.

**Exit:** a student can manage multiple real applications without a spreadsheet.

### Milestone 4 — Funding, writing, and offers

- Add guided writing and recommender status.
- Add affordability scenarios with explicit assumptions.
- Add offers, conditions, decision dates, and outcome capture.
- Validate paid execution value before implementing complex billing tiers.

## 13. Release status vocabulary

Use this vocabulary everywhere—in ChatPRD, GitHub, implementation status, and
roadmaps:

| Status | Meaning |
| --- | --- |
| Proposed | Idea exists but is not approved |
| Approved | Product decision is accepted |
| Specified | Testable PRD and acceptance criteria exist |
| Prototyped | UI or technical proof exists with non-production data |
| Implemented | Integrated code and persistence exist |
| Verified | Automated and manual acceptance checks pass |
| Released | Available to intended users with monitoring and support |
| Deferred | Intentionally outside the current delivery boundary |
| Rejected | Explicitly excluded, with reason recorded |

This prevents a page shell from being reported as a completed module.

## 14. Key risks and controls

| Risk | Control |
| --- | --- |
| Scope expands into every mobility journey | ScholarPath remains the first vertical; new packs require decision records |
| False precision harms trust | No unsupported outcome probability; use rules, conditions, and uncertainty |
| Stale sources create wrong guidance | Source registry, effective dates, freshness SLAs, conflict states, and corrections |
| AI becomes the hidden decision maker | Deterministic rule ownership, prompt/model versioning, and audit trails |
| Sensitive data is over-collected | Progressive capture, purpose limitation, consent, minimization, and deletion |
| Commercial incentives distort results | Separate revenue from research/ranking and disclose sponsorship |
| Documentation contradicts implementation | Canonical status vocabulary plus requirement-to-code verification |
| Too many PRDs create paralysis | Start with six canonical documents and one end-to-end proof |

## 15. Source notes

- Global Mobility OS repository: https://github.com/HaidarAli16/global-mobility-os
- ScholarPath repository: https://github.com/HaidarAli16/Scholorpath
- Borderless Self product: https://borderlessself.com/borderless-self-app/
- Borderless Self decision-tool limitations: https://borderlessself.com/relocation-decision-tool/
- AskAïa: https://askaia.ca/en/
- Deel Mobility: https://www.deel.com/solutions/mobility/
- Cialfo: https://www.cialfo.co/what-is-cialfo
- Studyportals: https://studyportals.com/for-students/
- Interstride: https://www.interstride.com/
- EU AI Act: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex:32024R1689
- UK ICO AI fairness guidance:
  https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/how-do-we-ensure-fairness-in-ai/what-about-fairness-bias-and-discrimination/
- ChatPRD Projects: https://www.chatprd.ai/docs/create-and-use-projects
- ChatPRD templates: https://www.chatprd.ai/docs/create-and-use-templates
- ChatPRD GitHub connector: https://www.chatprd.ai/docs/github-mcp-connector

## 16. Final recommendation

The previous work is not wasted. It contains two valuable assets:

1. Global Mobility OS supplies the long-term platform frame and several strong
   architecture patterns.
2. ScholarPath supplies the safer product philosophy and the deeper first vertical.

The right move is consolidation, not expansion:

- make ScholarPath the sole active product and brand;
- use Global Mobility OS as research and architecture input;
- combine every education-relevant capability into one canonical ScholarPath scope;
- define reusable foundations through actual production needs;
- build the source-and-rule truth system before adding more screens;
- use ChatPRD for canonical decisions and testable PRDs;
- use GitHub and the repository as the implementation source of truth.
