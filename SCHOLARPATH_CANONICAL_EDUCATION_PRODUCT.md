# ScholarPath Canonical Education Product

## Consolidated scope from ScholarPath and Global Mobility OS

**Decision date:** 30 July 2026
**Status:** Canonical product scope for ChatPRD and implementation planning
**Active product:** ScholarPath
**Current boundary:** Education, scholarships, admissions, and application execution

## 1. Product decision

ScholarPath is the only active product. It combines every useful
education-related capability specified or prototyped across the ScholarPath and
Global Mobility OS repositories.

Global Mobility OS will not be built as a parallel product. Its useful platform
ideas are absorbed into ScholarPath. Its non-education modules are preserved as
research for possible separate future products.

### Current product

ScholarPath helps internationally mobile students:

- build a structured academic and funding profile;
- understand source-backed programme and scholarship requirements;
- distinguish eligibility, conditions, missing evidence, and uncertainty;
- compare realistic education pathways and affordability scenarios;
- organize applications, deadlines, requirements, documents, writing, and
  recommenders;
- track offers, funding, and decisions;
- correct inaccurate information and see why guidance changed.

### Separate future products

The following must not be silently added to ScholarPath:

- job marketplace or international recruitment;
- career migration matching;
- general skilled-worker or residency pathways;
- personalized visa approval prediction;
- immigration case filing or legal representation;
- family visa and household relocation management;
- employer global-mobility compliance;
- counselor marketplace;
- general relocation services.

Each requires a separate product brief, target user, risk review, data model,
business model, and delivery decision.

## 2. Product promise

> ScholarPath turns a student’s education profile into source-backed opportunity
> guidance and a practical application plan—showing what is known, what remains
> conditional, and what to do next without inventing admission or scholarship
> probabilities.

## 3. Initial market boundary

### Primary users

- Postgraduate taught applicants.
- Selected research-master’s applicants where the workflow is supportable.
- Scholarship-dependent and mixed-funding students.
- Initial origin markets: Pakistan, India, and Bangladesh.
- Initial destination depth: UK, Germany, and Erasmus Mundus routes.

### Secondary operational users

- Research operators.
- Reviewers/publishers.
- Support and correction operators.
- Platform administrators.

### Explicit non-users for V1

- Employers and talent-acquisition teams.
- Immigration firms and visa caseworkers.
- General job seekers.
- Family-relocation planners.
- Undergraduate applicants until origin-qualification rules are sufficiently deep.
- Universities purchasing preferential ranking.

## 4. Product principles

1. **Evidence before confidence.** Important claims require source provenance,
   effective dates, review status, and freshness.
2. **No fake probability.** Do not show admission, scholarship, or visa approval
   likelihood unless a future validated and governed evidence base supports it.
3. **Missing data is not a pass.** Missing inputs produce conditional or unknown
   results.
4. **Facts remain distinct.** Separate official facts, student facts, evidence,
   derived signals, preferences, assumptions, and recommendations.
5. **Student remains the applicant.** ScholarPath prepares and organizes; it does
   not impersonate students or guarantee outcomes.
6. **Commercial neutrality.** Payment, partnerships, or commissions cannot alter
   eligibility or organic ranking.
7. **Progressive data collection.** Ask only for information needed for the
   current decision and explain why it matters.
8. **Human-reviewable automation.** AI may explain and structure; reviewed data
   and deterministic rules own consequential results.
9. **Historical reproducibility.** A past result must be reconstructable from its
   profile, source, rule, and configuration versions.
10. **Execution over spectacle.** A working source-to-application workflow is more
    valuable than a large set of disconnected screens.

## 5. Canonical system domains

The combined product uses ten stable domains. These replace overlapping module
lists in previous documents.

## Domain 1 — Identity, access, consent, and entitlements

### Combined capabilities

From ScholarPath:

- account creation, verification, consent, recovery, and deletion;
- student, research operator, reviewer, and administrator roles;
- privacy and settings surfaces.

From Global Mobility OS:

- application user record separate from Supabase Auth;
- role-aware route protection;
- session and onboarding-state handling;
- subscription status and entitlement checks;
- Stripe checkout, portal, webhook, and billing-operation boundaries.

### Canonical requirements

- Supabase authentication and secure server-side session resolution.
- Application `users` record linked to `auth.users`.
- Explicit account states and onboarding status.
- Role-based access with least privilege.
- Versioned consent records for privacy, communications, and optional processing.
- Password recovery, session visibility, export, and deletion.
- Entitlements isolated from eligibility and ranking logic.
- Billing events and administrator actions audited.

### Priority

P0: auth, roles, consent, recovery, deletion foundation.
P2: paid entitlements and billing after product value is validated.

## Domain 2 — Student profile, evidence, and normalization

### Combined capabilities

From ScholarPath:

- adaptive onboarding by origin country;
- original grading-scale capture;
- academic context and qualification normalization;
- goals, destinations, intake, funding need, English status, experience, research
  evidence, time capacity, and blockers;
- evidence graph and profile completeness;
- system-involvement explanations after consequential answers.

From Global Mobility OS:

- separate personal, academic, exam, professional, financial, preference, and
  risk-related records;
- canonical raw facts separate from derived profile snapshots;
- profile history and recommendation-refresh triggers;
- optional semantic summaries for grounded explanation retrieval.

### Canonical requirements

- Progressive multi-step onboarding with save/resume.
- Origin qualification taxonomies and registry-backed institutions.
- Academic records stored on their original scale.
- Normalization labeled as an internal planning signal, never official equivalency.
- Separate tables for academic, test, professional, financial, preference, and
  evidence records.
- Field-level provenance: student-declared, document-backed, operator-reviewed, or
  derived.
- Snapshot/version model so every evaluation references the exact profile used.
- Completeness calculated by decision relevance, not a cosmetic universal score.
- Optional professional and family context only when it affects an education
  pathway, funding, dependents, or post-study planning.

### Priority

P0.

## Domain 3 — Education knowledge and source truth system

### Combined capabilities

From ScholarPath:

- universities, programmes, scholarships, cycles, intakes, and funding components;
- source registry, data intake, review, publication, conflicts, and freshness;
- atomic facts with effective dates and source evidence;
- manual-first research operations.

From Global Mobility OS:

- country context, cost-of-living data, programme employability context, knowledge
  documents, retrieval metadata, content hashes, and vector-ready records;
- clear structured-data versus semantic-retrieval boundary;
- ingestion -> clean -> verify -> store -> publish lifecycle;
- worker-ready knowledge refresh.

### Canonical requirements

- Canonical institutions, programmes, scholarship providers, awards, cycles, and
  intakes.
- Programme-level requirements rather than institution-only assumptions.
- Scholarship funding decomposed into tuition, stipend, travel, insurance,
  dependents, and other components.
- Source hierarchy favoring official provider and government sources.
- Every consequential fact stores source, locator/context, effective dates,
  reviewer, status, and freshness deadline.
- Publication states: draft, in review, changes requested, approved, published,
  stale, conflicting, and archived.
- Source diffs and conflict resolution preserve history.
- Structured tables are authoritative; embeddings may help retrieval but never
  replace deterministic facts.
- Start with ten representative opportunities, not thousands of shallow listings.

### Education-only country context

Allowed:

- study system structure;
- official student-visa planning links;
- post-study work rules as sourced context;
- tuition and living-cost assumptions;
- dependent rules directly connected to student status;
- application calendars and recognized qualifications.

Excluded:

- general residency ranking;
- lifestyle scoring based on sensitive traits;
- skilled-worker pathway matching;
- job sponsorship prediction;
- family relocation planning.

### Priority

P0 and the immediate next milestone.

## Domain 4 — Eligibility, suitability, and explanation engine

### Combined capabilities

From ScholarPath:

- atomic rules;
- eligibility, conditional, ineligible, unknown, and not-recommended outcomes;
- hard requirements before suitability;
- missing-data handling and reasons;
- source-backed explanations and unresolved conditions.

From Global Mobility OS:

- explicit module boundary for deterministic matching;
- hard-filter-before-ranking pattern;
- stored raw/normalized values, weights, thresholds, configuration versions, and
  reason codes;
- LLM as explanation layer rather than decision maker;
- historical recommendation reports.

### Canonical evaluation sequence

```text
profile snapshot
  -> candidate opportunities
  -> applicable atomic rules
  -> hard requirement evaluation
  -> missing/unknown identification
  -> suitability dimensions
  -> portfolio context
  -> deterministic ordering
  -> grounded explanation
  -> stored reproducible report
```

### Allowed outputs

- Eligible based on current verified facts.
- Conditional with named unresolved conditions.
- Ineligible with source-backed reasons.
- Unknown because required facts or current sources are missing.
- Not recommended because constraints make the route impractical.
- Suitability dimensions such as academic alignment, affordability pressure,
  evidence readiness, funding dependency, and timeline feasibility.

### Prohibited outputs

- Admission probability.
- Scholarship-win probability.
- Visa approval probability.
- “Overall success probability index.”
- Embassy strictness score.
- Rankings influenced by payments or partner commissions.
- LLM-generated eligibility verdicts.

### Priority

P0.

## Domain 5 — Discovery, details, shortlist, and portfolio

### Combined capabilities

From ScholarPath:

- programme and scholarship search;
- filters, verification freshness, match states, conditions, deadlines, saves,
  detail views, portfolio groups, and comparisons;
- neutral portfolio balancing.

From Global Mobility OS:

- country and programme recommendation report framing;
- limited free summary versus deeper execution workspace;
- report history and feedback collection.

### Canonical requirements

- Unified discovery with clear programme versus scholarship distinction.
- Filters based on real indexed facts.
- Detail pages with requirements, conditions, costs, funding, deadlines, sources,
  freshness, and update history.
- Save, remove, annotate, group, compare, and archive.
- Comparison across academic rules, funding dependency, net cost, deadlines,
  evidence gaps, and source confidence.
- No institution may purchase organic rank.
- A free summary may limit depth but not hide disqualifying facts or source truth.
- User feedback is captured as product research, not treated as outcome truth.

### Priority

P0 for discovery/save/compare; P1 for advanced portfolio balancing.

## Domain 6 — Applications, tasks, deadlines, and readiness

### Combined capabilities

From ScholarPath:

- application state machine;
- requirements, blockers, tasks, dependencies, milestones, deadlines, calendar,
  submission readiness, and activity history;
- one dominant next action.

From Global Mobility OS:

- action plans derived from profile gaps and report outputs;
- historical recommendation/profile event timeline;
- background-ready task and notification generation.

### Canonical requirements

- Create an application from a saved programme or scholarship.
- Link programme, scholarship, and external application workflows without assuming
  they are one submission.
- Materialize requirements from published rules.
- Allow operator/system tasks and personal tasks with clear ownership.
- Dependencies recalculate priority without silently changing user facts.
- Deadlines preserve timezone and official source context.
- Application states are explicit and transitions create events.
- Readiness separates academic, documents, writing, references, funding, fees, and
  submission review.
- ScholarPath never claims an application was officially submitted unless a
  supported integration or user-confirmed record proves it.

### Priority

P1 after verified discovery works.

## Domain 7 — Documents, writing, and recommenders

### Combined capabilities

From ScholarPath:

- reusable private document library;
- document-to-requirement matrix;
- application-specific acceptance states;
- guided writing, prompt breakdown, evidence/story bank, versions, and recommender
  status.

From Global Mobility OS:

- Supabase Storage boundary;
- file metadata, hashes, expiry, extraction reports, and worker-ready analysis;
- OpenAI service boundary and prompt/model versioning.

### Canonical requirements

- Store files in private object storage; store metadata and links in Postgres.
- Upload validation, malware scanning strategy, hashes, versions, expiry, and access
  logs.
- A document can be reused, but its acceptance state is application-specific.
- Automated checks begin with technical completeness and metadata, not legal
  authenticity claims.
- Writing tools help students outline, connect evidence, check requirements, and
  revise their own work.
- AI-generated text remains editable and traceable; final responsibility stays with
  the student.
- Recommender workflows show request and receipt status without exposing
  confidential recommendation content.

### Explicit exclusions

- Automatic bank-statement sufficiency verdicts.
- Guaranteed plagiarism detection.
- AI claims that an official document is authentic.
- Automatic final SOP/LOR submission.

### Priority

P1 for documents and requirement links; P2 for advanced writing assistance.

## Domain 8 — Funding, affordability, education ROI, offers, and decisions

### Combined capabilities

From ScholarPath:

- scholarship components, confirmed versus conditional funding, funding gaps,
  editable assumptions, offers, conditions, deposits, and decision dates.

From Global Mobility OS:

- cost categories, income-uplift concepts, payback framing, scenario history, and
  calculation reproducibility.

### Canonical requirements

- Separate tuition, living costs, insurance, travel, application fees, deposits,
  and setup costs.
- Separate student contribution, sponsor support, confirmed awards, conditional
  awards, loans, and unresolved funding.
- Store currency, exchange-rate source/date, ranges, and assumptions.
- Compare baseline, scholarship, and alternative-programme scenarios.
- Show funding gap and sensitivity rather than one definitive affordability score.
- Education ROI may show scenario ranges and payback assumptions, but not guaranteed
  salary or employment outcomes.
- Offers record conditions, confirmed funding, deposits, response dates, and user
  priorities.
- Decision comparison remains private and student-controlled.

### Education-only career context

Allowed:

- sourced graduate employment statistics;
- official post-study work duration;
- accreditation and professional-recognition notes;
- user-editable salary scenarios clearly labeled as assumptions.

Excluded:

- job matching;
- sponsorship likelihood;
- occupation migration ranking;
- job placement promises.

### Priority

P2 after application execution.

## Domain 9 — Notifications, support, corrections, and communication

### Combined capabilities

From ScholarPath:

- deadline, source-change, requirement, application, document, security, support,
  and correction notifications;
- correction tickets with visible status.

From Global Mobility OS:

- provider-agnostic notification service;
- background dispatch and retry posture;
- billing and report-completion events.

### Canonical requirements

- In-app notifications as the system record.
- Optional email/push channels with user preferences.
- Notification events reference the exact affected record.
- Quiet periods and severity rules prevent engagement spam.
- Correction reports attach to specific facts/sources where possible.
- Corrections enter research review, preserve history, and notify affected users
  after publication.
- Security and privacy support remain available regardless of payment tier.

### Priority

P1.

## Domain 10 — Research operations, administration, security, and learning

### Combined capabilities

From ScholarPath:

- source inbox, programme/scholarship editors, atomic rules, review/diff/publication,
  freshness/conflict queues, user support, corrections, security, audit, analytics,
  and platform settings.

From Global Mobility OS:

- strict admin-engine boundary;
- configurable formula/rule versions;
- prompt configuration and model metadata;
- immutable admin audit logs;
- user activity and recommendation analytics;
- worker and webhook operational visibility;
- payment operations.

### Canonical requirements

- Research operations and platform administration use separate permissions.
- Researchers cannot self-approve material they authored where separation is
  required.
- Every publish, archive, correction, rule change, role change, sensitive view, and
  billing action creates an audit event.
- Rule configurations require validation, versioning, effective dates, review, and
  rollback.
- AI prompts affecting user-visible explanations are versioned and evaluated.
- Analytics uses minimal necessary data and avoids copying sensitive profiles into
  event payloads.
- Operational dashboards show job failures, stale sources, conflicts, delivery
  failures, and security events.

### Priority

P0 for research publication, security, and audit foundations.
P1/P2 for broader operations and analytics.

## 6. Shared technical architecture absorbed from both projects

### Architecture

- Next.js App Router structured monolith.
- TypeScript strict mode.
- Supabase Postgres, Auth, Storage, and RLS.
- Domain modules own business rules.
- Services own providers and orchestration.
- Pages and route handlers remain thin.
- Zod validates external and domain boundaries.
- Worker-ready service functions support future queues.
- OpenAI is limited to controlled explanation, retrieval, and writing assistance.
- Stripe remains behind payment services.

### Recommended repository boundaries

```text
src/app                 delivery and API boundaries
src/components          interface components
src/modules/identity    users, roles, consent, entitlements
src/modules/profile     profile facts, evidence, snapshots, normalization
src/modules/catalogue   institutions, programmes, scholarships, cycles
src/modules/sources     source registry, facts, review, freshness
src/modules/rules       atomic rules, evaluation, explanations
src/modules/portfolio   saves, comparison, applications
src/modules/execution   requirements, tasks, deadlines, readiness
src/modules/documents   files, versions, requirement links
src/modules/funding     scenarios, awards, offers, decisions
src/modules/support     notifications, corrections, support
src/modules/admin       governance, audit, analytics
src/services            Supabase, storage, OpenAI, email, billing, workers
database                migrations, RLS, seed assets, database tests
docs                    canonical product and engineering context
```

## 7. Canonical data domains

### Identity

- users
- roles and memberships
- sessions/auth linkage
- consents
- preferences
- subscriptions and entitlements

### Student facts

- profiles
- nationalities/residences
- academic records
- exam/language records
- professional/research records
- financial records
- goals and constraints
- evidence records
- profile snapshots

### Education knowledge

- institutions
- programmes
- programme intakes/cycles
- scholarship providers
- scholarships and award cycles
- funding components
- origin qualifications
- subject and degree taxonomies
- cost assumptions
- education-linked destination facts

### Sources and rules

- sources
- source captures/versions
- atomic facts
- requirement rules
- rule sets/configurations
- reviews and publications
- conflicts
- freshness schedules

### Decisions

- evaluation reports
- opportunity outcomes
- hard-rule results
- suitability dimensions
- explanation records
- saved opportunities
- comparisons

### Execution

- portfolios
- applications
- application events
- requirements
- tasks and dependencies
- deadlines
- documents and versions
- requirement-document links
- writing items and versions
- recommenders and requests
- notifications
- support/correction cases

### Funding and outcomes

- cost scenarios
- funding sources/components
- offers and conditions
- decisions
- education outcomes

### Governance

- audit logs
- prompt/model configurations
- analytics events
- worker/job records
- billing transactions

## 8. Priority map

### P0 — First trustworthy education release

- Authentication, account security, consent, export, and deletion foundation.
- Pakistan, India, and Bangladesh profile capture.
- Original-grade storage and controlled qualification taxonomy.
- Institution, programme, scholarship, cycle, and funding-component models.
- Source registry and reviewed publication workflow.
- Atomic rule grammar and deterministic evaluation.
- Explainable eligibility with missing/unknown states.
- Ten representative reviewed opportunities.
- Discovery, details, save, and compare.
- Research/admin access controls, RLS, audit, and rule tests.
- Responsive web experience.

### P1 — Application execution value

- Portfolios and applications.
- Requirement matrix.
- Tasks, dependencies, milestones, and deadlines.
- Document vault and requirement linking.
- Notifications and corrections.
- Recommender tracking.
- Submission-readiness review and activity history.

### P2 — Funding and decision value

- Funding scenarios and sensitivity ranges.
- Guided writing and evidence bank.
- Offer comparison.
- Education ROI assumptions.
- Premium exports and entitlements.
- Outcome capture and product learning.

### P3 — Later ScholarPath extensions

- Undergraduate workflows.
- More origin and destination markets.
- Controlled source-change automation.
- Native iOS after backend contracts stabilize.
- Institution integrations where neutrality can be preserved.

### Separate future products—not ScholarPath roadmap items

- Career and job mobility.
- Skilled migration.
- Visa intelligence and case services.
- Family visa and relocation.
- Employer mobility compliance.
- Counselor marketplace.
- Community/social network.

## 9. Implementation status interpretation

Previous documents sometimes used “complete” for broad frontend coverage. The
canonical status vocabulary is:

- **Specified:** testable product behavior exists in documentation.
- **Prototyped:** interface or technical proof exists with demo/local data.
- **Implemented:** integrated behavior and persistence exist.
- **Verified:** automated and manual acceptance checks pass.
- **Released:** intended users can use it with monitoring and support.

Under this vocabulary:

- ScholarPath’s adaptive onboarding and assessment are functional prototypes.
- Most student workspace, research, and admin areas are UI prototypes.
- The Supabase migration is a database draft, not a connected production backend.
- Global Mobility OS contributes specifications and architecture patterns, not
  implemented engines.

## 10. ChatPRD canonical project structure

Use one active project:

**ScholarPath — Education Product**

### Project description

ScholarPath is a source-backed scholarship and admissions execution platform for
internationally mobile students. The active scope is education only. Jobs/career
mobility, general visa services, and family relocation are separate future products.

### Canonical documents

1. Product One-Pager and Decisions.
2. Canonical Education Product Scope (this document).
3. Truth System PRD.
4. Profile and Evidence PRD.
5. Eligibility and Explanation PRD.
6. Verified Discovery and Portfolio PRD.
7. Application Execution PRD.
8. Documents/Writing/Recommenders PRD.
9. Funding/Offers PRD.
10. Research Operations and Admin PRD.
11. Technical Design and Data Model.
12. MVP Release Criteria and Test Strategy.

### Global Mobility OS material

Upload or reference it as **Archived Research — Global Mobility OS**. It is not an
active roadmap. Any future reuse must pass the education-only boundary in this
document.

## 11. Founder decisions now resolved

- The active brand/product is ScholarPath.
- ScholarPath is education only.
- Useful education capabilities from both repositories are consolidated here.
- Jobs and career migration will be considered as a separate future product.
- General visa services/intelligence will be considered as a separate future
  product.
- Family visas and relocation will be considered as a separate future product.
- Shared technical foundations may be reused later without forcing one product or
  one user experience.

## 12. Immediate next action

The next build is not another frontend module. It is the **Truth System Proof**:

```text
official source
  -> captured source version
  -> normalized opportunity facts
  -> atomic requirement rules
  -> independent review and publication
  -> versioned profile snapshot
  -> deterministic evaluation
  -> explainable student result
  -> audit and reproducibility check
```

Exit only when one real programme or scholarship can complete this entire path.

## 13. Scholarship intelligence platform decision

ScholarPath's defensible technology is the source-backed scholarship knowledge,
eligibility, recommendation, and explanation platform—not a particular web
interface. The platform must therefore be designed API-first so the same governed
capabilities can serve:

- the ScholarPath web and future mobile applications;
- counselor and university workspaces;
- approved partner products and white-label experiences;
- future education integrations and SDKs;
- AI agents through a ScholarPath MCP server.

The core recommendation logic must remain independent from Codex, Antigravity,
any LLM provider, and the MCP protocol. API and MCP clients receive approved
results and evidence; they do not contain or own ScholarPath's ranking logic.

### Canonical platform boundary

```text
source ingestion and verification
  -> normalized scholarship knowledge
  -> versioned student profile and evidence
  -> deterministic eligibility rules
  -> candidate opportunity retrieval
  -> explainable suitability ranking
  -> recommendation report and feedback
  -> versioned ScholarPath Platform API
  -> web, mobile, partners, and MCP adapters
```

## 14. Recommendation system architecture

### 14.1 Scholarship knowledge base

Every opportunity must be represented as structured, versioned, source-backed
data. At minimum it captures:

- provider, institution, programme, country, degree level, and cycle;
- eligible nationalities, qualifications, fields, age rules, and exclusions;
- academic, language, experience, research, and financial-need requirements;
- tuition, stipend, travel, insurance, dependent, and other funding components;
- opening date, deadline, required documents, and application route;
- official source, source locator, effective dates, last verification, reviewer,
  publication status, and confidence.

Consequential values must remain atomic and traceable. A generated summary is
never the authoritative source for eligibility.

### 14.2 Deterministic eligibility engine

Hard requirements are evaluated before ranking. The engine produces one of:

- eligible;
- conditionally eligible;
- ineligible;
- missing information;
- unknown because the official evidence is insufficient or conflicting.

Every result includes machine-readable reason codes, failed or unresolved rules,
missing student facts, rule versions, and supporting source references. An LLM may
explain this output but cannot override it.

### 14.3 Candidate retrieval

Candidate generation combines structured database filters, full-text search, and
semantic retrieval where useful. Semantic similarity may expand discovery but
must not establish eligibility. This stage returns a bounded candidate set for
rule evaluation and ranking.

### 14.4 Suitability and ranking

Only candidates that survive hard-rule evaluation enter suitability ranking.
Initial ranking dimensions may include:

- academic and programme fit;
- funding coverage and affordability;
- student destination and subject preferences;
- deadline and document readiness;
- competition context where evidence exists;
- data completeness and source confidence;
- portfolio diversification.

Weights, thresholds, feature values, and configuration versions must be stored so
results are reproducible. Until validated outcome data supports calibrated
prediction, ScholarPath presents a **match score**, not an admission or scholarship
probability.

### 14.5 Evidence and explanation

Every recommendation must answer:

- why the opportunity was recommended;
- which requirements are satisfied;
- which requirements are conditional, failed, unknown, or missing;
- what evidence supports the result;
- when the information was last verified;
- what the student should do next.

Explanations must be generated from the stored evaluation report and approved
facts. They must not invent requirements, funding, deadlines, or probabilities.

### 14.6 Feedback and evaluation

The platform records privacy-safe feedback such as recommendation views,
shortlists, dismissals with reasons, application starts, submissions, verified
eligibility corrections, offers, and funding outcomes. This supports ranking
evaluation and later model development.

Before any learned ranking model affects production, it requires:

- a versioned training and evaluation dataset;
- leakage, bias, and subgroup analysis;
- offline relevance and calibration tests;
- comparison against deterministic baselines;
- controlled rollout and rollback;
- monitoring for source drift and performance degradation;
- documented human oversight.

## 15. ScholarPath Platform API

The web application must consume the same stable domain services that can later be
exposed to approved partners. Initial versioned contracts should include:

```text
GET  /v1/opportunities
GET  /v1/opportunities/{opportunity_id}
POST /v1/opportunities/search

POST /v1/eligibility/check
POST /v1/recommendations
GET  /v1/recommendations/{recommendation_id}
GET  /v1/recommendations/{recommendation_id}/explanation
POST /v1/recommendations/{recommendation_id}/feedback

GET  /v1/profiles/{profile_id}
POST /v1/profiles/{profile_id}/readiness
GET  /v1/profiles/{profile_id}/deadlines
```

### API requirements

- OpenAPI-described, versioned request and response contracts.
- Schema validation at every boundary.
- User, partner, tenant, and role-aware authorization.
- Row-level data isolation and least-privilege service credentials.
- Idempotency for appropriate mutations.
- Pagination, rate limits, quotas, and abuse protection.
- Audit records for consequential reads and writes.
- Stable reason codes in addition to human explanations.
- Webhooks for approved asynchronous partner workflows.
- Deprecation and migration policy before external release.
- Contract, integration, load, and security tests.

Public partner responses must expose approved facts, evaluation results, and
evidence—not internal ranking weights, fraud controls, unpublished records, raw
partner feeds, private counselor notes, or service credentials.

## 16. ScholarPath MCP strategy

MCP is an adapter over the ScholarPath Platform API for AI clients. It is not the
primary application API and does not contain the scholarship engine.

### 16.1 Initial read-only MCP tools

```text
search_scholarships
get_scholarship
check_eligibility
recommend_scholarships
explain_recommendation
compare_scholarships
get_required_documents
get_upcoming_deadlines
```

### 16.2 Later authenticated tools

```text
get_my_student_profile
add_to_shortlist
remove_from_shortlist
create_application_plan
update_application_status
record_recommendation_feedback
```

Write tools require explicit user authorization, narrow scopes, confirmation for
consequential actions, idempotency, and complete audit logs.

### 16.3 MCP resources

```text
scholarpath://methodology/eligibility
scholarpath://methodology/recommendations
scholarpath://countries/{country_code}
scholarpath://scholarships/{scholarship_id}
scholarpath://programmes/{programme_id}
scholarpath://requirements/{requirement_id}
```

### 16.4 MCP prompts

- Build a source-backed scholarship application plan.
- Compare a student's shortlisted opportunities.
- Identify missing evidence and documents.
- Explain a conditional or ineligible result.
- Prepare a scholarship-readiness report.

### 16.5 Transport and deployment

- Use TypeScript and the official Model Context Protocol SDK.
- Use `stdio` for local development with Codex and Antigravity.
- Use authenticated Streamable HTTP for a remote production server.
- Deploy the remote endpoint independently, for example at
  `https://mcp.scholarpath.com/mcp`.
- Keep database and Supabase service-role credentials only on trusted servers.
- Give clients revocable OAuth or scoped API credentials.
- Separate read, profile, shortlist, application, partner, and administrator
  scopes.
- Enforce tenant isolation, rate limits, timeouts, input limits, and audit logs.

The same remote MCP endpoint should be usable by Codex, Antigravity, and other
standards-compliant clients without changing the underlying recommendation
engine.

## 17. Platform delivery sequence

1. Finalize the canonical opportunity, source, fact, requirement, and cycle model.
2. Complete the source intake, independent review, publication, and freshness
   workflow.
3. Complete versioned profile snapshots and field-level provenance.
4. Implement atomic deterministic eligibility rules and reason codes.
5. Build candidate retrieval and an explainable deterministic ranking baseline.
6. Create golden evaluation cases and regression tests with expert review.
7. Publish the internal `/v1` Platform API and migrate the web application to it.
8. Add feedback and outcome capture without collecting unnecessary private data.
9. Build a read-only local MCP adapter and test it in Codex and Antigravity.
10. Deploy an authenticated remote MCP endpoint.
11. Add partner credentials, quotas, webhooks, SDKs, and commercial terms only
    after internal contracts are stable.
12. Introduce learned ranking only after outcome volume, governance, and
    evaluation quality justify it.

The immediate priority remains the Truth System Proof. MCP implementation begins
only after one real opportunity can travel reproducibly from official source to
student recommendation through the internal API.
