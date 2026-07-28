# ScholarPath Frontend Complete System Specification V1

**Status:** Research-complete implementation contract  
**Date:** 25 July 2026  
**Primary market:** Students from Pakistan, India, and Bangladesh applying abroad  
**Delivery order:** Responsive web first, iOS second  
**Current stack boundary:** Next.js frontend and Supabase-ready contracts; no paid external AI API dependency  

---

## 1. Product decision

ScholarPath should not become another scholarship list, admissions consultant marketplace, migration probability calculator, or generic AI chat wrapper.

It should be a **verified admissions and scholarship execution system** that helps a student:

1. describe their academic and financial reality accurately;
2. discover programmes and funding whose rules can be traced to official sources;
3. understand what is confirmed, conditional, missing, or unknown;
4. build a balanced application portfolio;
5. complete requirements, writing, documents, references, and deadlines;
6. compare offers and funding scenarios;
7. progress independently without paying a consultant.

The product replaces the consultant’s coordination and memory gap. It does not pretend to replace institutional decisions or qualified legal advice.

### Core promise

> “Tell us what you can prove. ScholarPath turns it into verified routes, visible gaps, and an ordered application plan.”

### Trust rule

ScholarPath never shows:

- invented admission probability;
- invented scholarship probability;
- invented visa probability;
- “AI says you are eligible” without rule and source evidence;
- a deadline without timezone and source date;
- a scholarship amount without coverage and renewal conditions;
- a programme rule without a visible verification state.

The system may show:

- confirmed;
- likely match;
- conditional;
- needs verification;
- not recommended;
- unavailable;
- stale source;
- conflicting sources.

---

## 2. Research conclusions

### 2.1 What the earlier build proved

The earlier build at `C:\Users\haida\Documents\New project` proved that the following concepts are useful:

- a multi-domain student profile;
- scholarship discovery and comparison;
- a document vault;
- an application journey;
- task orchestration;
- a content-management/admin surface;
- reusable SaaS page primitives;
- deterministic rules separated from explanation.

### 2.2 What must not be copied

| Earlier-build pattern | Decision | Reason |
|---|---|---|
| Global mobility scope including jobs, PR, families, counselors, and community | Reject for V1 | It weakens the student admissions promise and multiplies data risk. |
| “Success probability” and visa probability | Reject permanently | Institutional decisions cannot be represented honestly by a home-grown percentage. |
| Hard-coded demo identity and narrative | Reject | Every screen must render authenticated, empty, loading, error, and seeded demo states separately. |
| 20+ sidebar destinations | Reject | It creates navigation overload and hides the student’s next action. |
| Desktop-only fixed sidebar | Reject | Mobile and future iOS are primary design constraints. |
| Generic JSON-like admin record forms | Replace | Research data requires sources, versions, field-level confidence, review, conflicts, and publication control. |
| “AI-powered” document verification | Reject without evidence | File completeness checks and human-verifiable statuses come first. |
| Counselor marketplace and community | Defer | They reintroduce the consultant model and create moderation/quality burdens. |
| AI document generator | Replace with guided writing workspace | The student must remain the author; assistance must be structured, transparent, and reviewable. |
| 3D globe and visual spectacle | Reject | It consumes attention without helping a student complete an application. |

### 2.3 Current ScholarPath assessment

The current build has one route containing:

- a five-step adaptive assessment;
- origin-country qualification choices;
- funding and destination preferences;
- evidence capture;
- conditional/unknown pathway results;
- a basic action list;
- device-local draft behavior;
- VOIT-derived tokens and Urbanist.

This is a strong interaction prototype, not a complete product. It partially covers profile, academic context, goals, suggestions, report, and tasks. It does not yet cover the complete platform shell, discovery, saved portfolio, application cases, documents, writing, references, funding decisions, offers, notifications, corrections, support, research operations, or administration.

---

## 3. Target audience

### Primary

- Pakistani, Indian, and Bangladeshi students;
- ages approximately 17–35;
- undergraduate, taught postgraduate, research postgraduate, and selected doctoral paths;
- first-generation international applicants;
- applicants with incomplete knowledge of foreign admission systems;
- applicants who need scholarships, tuition reductions, assistantships, or mixed funding;
- applicants coordinating the process themselves.

### Secondary

- a parent or trusted supporter invited by the student;
- a teacher/recommender with a narrow request link;
- an internal research operator;
- an internal reviewer;
- platform administrator and support operator.

### Explicitly not primary

- immigration consultants;
- paid admissions consultants;
- recruiters purchasing student leads;
- universities buying preferential rankings;
- professionals seeking jobs or permanent migration;
- an open social community.

---

## 4. Roles and permissions

| Role | Main ability | Explicit restriction |
|---|---|---|
| Guest | Explore methodology, sample opportunities, and start assessment | Cannot save or upload |
| Student | Own profile, portfolio, applications, documents, writing, tasks, and decisions | Cannot edit verified catalogue facts |
| Supporter | View selected plan/tasks and optionally mark assigned support tasks | Cannot view private documents unless separately granted |
| Recommender | Respond to a single request and upload/confirm a letter | Cannot browse the student workspace |
| Research operator | Capture source facts and create draft programme/scholarship records | Cannot publish own changes |
| Reviewer | Compare source evidence, resolve conflicts, approve/reject/version records | Cannot change platform security |
| Support operator | Handle tickets and view minimum required account context | No unrestricted document access |
| Administrator | Manage users, taxonomies, templates, permissions, and platform settings | Cannot silently override audit history |
| System | Evaluate deterministic rules, generate tasks, detect staleness, and send scheduled notices | Cannot invent missing facts |

---

## 5. Information architecture

### 5.1 Public

- Home
- How ScholarPath works
- Explore opportunities preview
- Methodology and trust
- Source and correction policy
- Pricing/plan boundary
- Sign up
- Log in
- Password recovery
- Verify email
- Privacy
- Terms
- Cookie preferences

### 5.2 Student navigation

Use five primary destinations, not a long module list:

1. **Today**
2. **Discover**
3. **Portfolio**
4. **Applications**
5. **Workspace**

Secondary destinations live under the profile/menu:

- Profile and evidence
- Notifications
- Help and corrections
- Settings
- Privacy and data export

`Workspace` opens a compact section switcher:

- Tasks
- Documents
- Writing
- Funding
- Offers

### 5.3 Research operations

- Operations overview
- Source inbox
- Source registry
- Programmes
- Scholarships and cycles
- Institutions
- Rules and requirements
- Taxonomies and equivalencies
- Conflict queue
- Review queue
- Change log

### 5.4 Administration

- Admin overview
- Users
- Roles and access
- Support and corrections
- Notification templates
- Content display configuration
- Analytics and funnels
- Security events
- Audit log
- Platform settings

---

## 6. Global frontend foundations

### 6.1 Design-system rule

The VOIT design system is the visual source of truth. ScholarPath may add product-specific compositions but should not create a parallel component language.

Required foundations:

- Urbanist for interface typography;
- token-based color, spacing, radius, shadow, border, and motion;
- semantic status colors independent of brand color;
- 8-point spacing rhythm with 4-point exceptions;
- minimum 44 × 44 point mobile touch targets;
- visible keyboard focus;
- AA contrast minimum;
- reduced-motion support;
- dynamic text and reflow support;
- no essential meaning conveyed by color alone.

### 6.2 Core components

- App shell
- Mobile tab bar
- Desktop navigation rail
- Page header
- Context bar
- Command/search palette
- Button
- Icon button
- Link
- Text field
- Number field
- Searchable select
- Native select fallback
- Combobox
- Radio card
- Checkbox row
- Segmented control
- Date and deadline control
- Currency control
- File uploader
- Stepper
- Progress bar
- Tabs
- Filter chips
- Filter drawer
- Sort menu
- Opportunity card
- Requirement row
- Source citation
- Verification badge
- Status badge
- Deadline badge
- Funding coverage badge
- Task row
- Timeline
- Summary card
- Comparison table
- Empty state
- Skeleton
- Inline validation
- Error summary
- Toast/status region
- Confirmation dialog
- Bottom sheet
- Side panel
- Data table
- Pagination/infinite result boundary

### 6.3 Universal states

Every route must be designed and implemented for:

- initial loading;
- background refresh;
- populated;
- zero data;
- zero search results;
- partial data;
- stale data;
- source conflict;
- action success;
- recoverable action error;
- page-level error;
- offline;
- expired session;
- permission denied;
- destructive-action confirmation;
- mobile keyboard open;
- reduced motion;
- long text and large type.

### 6.4 Status vocabulary

One vocabulary must be reused everywhere.

#### Opportunity verification

- Verified
- Review due
- Stale
- Conflicting
- Draft
- Archived

#### Student rule result

- Confirmed match
- Conditional match
- Needs verification
- Not a match
- Not evaluated

#### Application state

- Considering
- Preparing
- Ready for review
- Ready to submit
- Submitted
- Awaiting result
- Interview
- Offer received
- Unsuccessful
- Withdrawn
- Closed

#### Document state

- Missing
- Requested
- Uploaded
- Needs replacement
- Needs review
- Accepted for this application
- Expired
- Not applicable

#### Task state

- To do
- In progress
- Blocked
- Waiting on someone
- Done
- Skipped

---

## 7. Screen inventory and behavior

## Module A — Public, account, consent, and recovery

### Screens

1. Home
2. How it works
3. Methodology and trust
4. Explore preview
5. Pricing
6. Sign up
7. Log in
8. Verify email
9. Forgot password
10. Reset password
11. Consent and privacy choices
12. Account blocked/session expired

### UX requirements

- Home CTA starts a lightweight profile, not a generic registration wall.
- Explain verified sources, conditional results, and no-probability policy above the fold.
- Social proof cannot use fabricated students or outcomes.
- Sign-up form supports email/password first; Apple/Google may be added when configured.
- Password requirements appear before error.
- Preserve pre-auth assessment draft after sign-up.
- Consent for product data, analytics, and marketing are separate.
- All auth error states explain recovery.

### Responsive

- Mobile uses one-column pages and a persistent safe-area-aware CTA where useful.
- Desktop auth may use a two-panel composition but the form remains the primary visual object.

---

## Module B — Adaptive onboarding and student profile

### Screens

1. Assessment welcome
2. Origin and residency
3. Academic level
4. Qualification type
5. Institution
6. Grading system and result
7. Subject/field taxonomy
8. English evidence
9. Research/project evidence
10. Intended degree and intake
11. Destination flexibility
12. Funding requirement and available contribution
13. Constraints and preferences
14. Review answers
15. Profile processing
16. Initial pathway report
17. Full profile
18. Edit profile section
19. Evidence completeness

### Interaction model

- Ask one conceptual question per mobile screen.
- Combine only tightly related controls.
- Prefer controlled selections where a taxonomy exists.
- Permit “I cannot find mine” and “I do not know.”
- Never force an applicant to translate grades into a foreign GPA.
- Save after meaningful changes and show last-saved status.
- Explain why sensitive or unfamiliar information is requested.
- Use system suggestions after a user answer, not before.
- Let the student change a prior answer without losing later valid answers.
- Show a section review before final processing.

### System-involvement moments

- Suggest recognized local qualification labels based on origin.
- Detect implausible grade ranges for the selected grading system.
- Suggest adjacent field categories without changing the student’s answer.
- Explain how funding dependency changes portfolio construction.
- Flag missing evidence that affects research confidence.
- Recommend intake realism based on time remaining and known task lead times.
- Show “what this changes” after high-impact answers.

### Motion

- 180–240 ms directional step transitions.
- Selected cards use restrained border/fill/scale feedback.
- Progress movement is animated unless reduced motion is enabled.
- Processing shows named stages, not fake percentage progress.

---

## Module C — Today dashboard

### Screens

1. First-day dashboard
2. Active-journey dashboard
3. Deadline-risk dashboard
4. Waiting-for-results dashboard
5. Offer-decision dashboard

### Sections

- next best action;
- applications needing attention;
- deadlines in the student’s timezone;
- blocked tasks;
- document requests;
- recommender status;
- new verified matches;
- source changes affecting saved items;
- funding gap summary;
- progress by application, not an invented “success score.”

### Rules

- One dominant action.
- No more than five urgent items before “view all.”
- Empty dashboard teaches the next useful action.
- A completed task disappears from “Today” with reversible undo.
- Cards deep-link to the exact application, requirement, or document.

---

## Module D — Discovery

### Screens

1. Discovery home
2. Programme results
3. Scholarship results
4. Programme detail
5. Scholarship detail
6. Institution detail
7. Search history/recent searches
8. Saved search
9. Zero-result recovery

### Search and filters

Programme filters:

- destination;
- degree level;
- subject;
- intake;
- tuition range;
- language;
- delivery mode;
- duration;
- funding availability;
- verified/review state;
- profile match state.

Scholarship filters:

- origin eligibility;
- destination;
- degree level;
- subject;
- funding coverage;
- separate application vs automatic consideration;
- deadline;
- applicant stage;
- verified/review state.

### Result-card content

- title;
- institution/funder;
- country;
- degree or award type;
- tuition/coverage;
- deadline with timezone;
- verification freshness;
- match state;
- two strongest fit facts;
- highest-impact unknown/condition;
- save action;
- compare action.

### Detail-page structure

1. Summary
2. Why it appears for this student
3. Confirmed requirements
4. Conditional/unknown requirements
5. Costs or funding coverage
6. Deadlines and stages
7. Required documents
8. Source citations and last verification
9. Change history affecting applicants
10. Save/add-to-portfolio action

### Research-derived UX rule

Keep filters visible on wide screens and in a bottom sheet/drawer on mobile. Show applied filters as removable chips. Never hide the result count or silently reset filters.

---

## Module E — Portfolio and comparison

### Screens

1. Saved portfolio
2. Portfolio balance
3. Programme comparison
4. Scholarship comparison
5. Combined route comparison
6. Archived saves

### Portfolio groups

- Ambitious
- Realistic
- Safer
- Funding-first
- Needs research

These are planning labels, not probability claims.

### Comparison dimensions

- qualification match;
- subject prerequisites;
- language evidence;
- tuition;
- living-cost assumption;
- scholarship coverage;
- application fee;
- deadline;
- documents;
- separate scholarship application;
- source freshness;
- known conditions;
- student notes.

### Interaction rules

- Compare 2–4 items.
- Freeze the first column on desktop.
- Use stacked cards or dimension-by-dimension paging on mobile.
- Highlight differences, not a single winner.
- Let the student export/print a clean comparison later.

---

## Module F — Applications

### Screens

1. Applications overview
2. Create application from portfolio
3. Application detail
4. Requirements
5. Tasks
6. Documents
7. Writing
8. References
9. Submission review
10. Submission record
11. Result/decision
12. Application activity

### Application detail anatomy

- header: programme, institution, intake, deadline, status;
- readiness summary;
- blocking requirements;
- next task;
- timeline;
- requirement matrix;
- documents;
- writing items;
- recommenders;
- fees and funding;
- source changes;
- student notes;
- activity log.

### State transitions

Transitions require explicit student action except system-derived readiness:

`Considering → Preparing → Ready for review → Ready to submit → Submitted → Awaiting result → Interview/Offer/Unsuccessful`

The student may also withdraw or close an application. Submission must record:

- submitted timestamp;
- student timezone;
- portal/reference number;
- final document snapshot;
- fee/payment note;
- optional proof screenshot/file.

### Readiness

Show counts:

- complete;
- action required;
- waiting;
- unknown;
- not applicable.

Do not collapse readiness into a misleading percentage unless the denominator and categories remain visible.

---

## Module G — Tasks and calendar

### Screens

1. Task list
2. Today
3. Upcoming
4. Calendar
5. Task detail
6. Create/edit personal task
7. Blocked tasks
8. Completed tasks

### Task fields

- title;
- application;
- requirement;
- owner;
- due date/time/timezone;
- estimated effort;
- state;
- dependency;
- blocking reason;
- evidence/attachment;
- reminder settings;
- notes;
- source/system rationale.

### System tasks

System-generated tasks must state why they exist and what completion means. The student may reschedule, add notes, or dismiss non-mandatory guidance, but cannot silently dismiss a verified application requirement.

### Calendar behavior

- Month and agenda on web.
- Agenda-first on mobile/iOS.
- Timezone always visible near critical deadlines.
- Deadline changes create an alert and preserve previous value in activity.

---

## Module H — Documents

### Screens

1. Document home
2. Upload flow
3. Document detail
4. Replace/version flow
5. Application document matrix
6. Missing documents
7. Expiring documents
8. Shared/recommender documents

### Categories

- identity;
- academic;
- language;
- financial;
- employment/experience;
- research;
- writing;
- references;
- application receipts;
- offer and visa-stage documents.

### Upload flow

1. Select category or enter from a requirement.
2. Choose/capture file.
3. Show upload progress.
4. Confirm document type and owner.
5. Capture issue/expiry date where relevant.
6. Preview.
7. Link to one or more requirements.
8. Show acceptance state per application.

### Frontend checks

- file type;
- file size;
- number of pages when available;
- encrypted/unreadable file;
- image orientation;
- duplicate checksum response;
- expired/soon-to-expire metadata;
- required front/back indication.

No claim of authenticity or institutional acceptance is made automatically.

### Privacy UX

- Private by default.
- Explain who can access each document.
- Separate supporter/recommender sharing.
- Provide remove, export, and access-history controls.

---

## Module I — Writing and recommenders

### Screens

1. Writing workspace
2. Writing item detail
3. Prompt and requirements
4. Outline builder
5. Draft editor
6. Version history
7. Review checklist
8. Recommenders overview
9. Invite recommender
10. Recommender status
11. Recommender request portal

### Writing model

ScholarPath guides the student through:

- prompt decomposition;
- evidence/story bank;
- institution-specific points;
- structured outline;
- draft;
- self-review;
- final application-specific copy.

The product does not present generated text as the student’s authentic work. Any future local assistance must be optional, attributable, and constrained to suggestions, structure, clarity, and checks.

### Editor requirements

- autosave;
- word/character limit;
- prompt pinned nearby;
- version labels;
- comments/checklist;
- application-specific duplication warning;
- export/copy;
- mobile safe draft editing;
- offline draft queue where feasible in iOS.

### Recommenders

- Invite with email and role.
- Show request status without exposing confidential content.
- Provide deadline, instructions, and upload/confirmation.
- Reminders must be student-controlled and rate-limited.
- Allow replacement of recommender with an auditable state change.

---

## Module J — Funding and affordability

### Screens

1. Funding overview
2. Cost assumptions
3. Funding sources
4. Funding scenarios
5. Application fee plan
6. Scholarship dependency map
7. Funding gap
8. Funding evidence checklist

### Calculations

Use editable scenarios:

- tuition;
- mandatory fees;
- living-cost estimate;
- travel;
- health/insurance;
- application fees;
- deposit;
- confirmed awards;
- conditional awards;
- family/personal contribution;
- documented funds;
- remaining gap.

Every number must show currency, period, source/assumption, and update date. Exchange rates are display assumptions, not guaranteed costs.

### Scenario labels

- Fully funded if all required costs are confirmed covered
- Tuition covered
- Partially funded
- Self-funded with documented gap
- Funding unresolved

---

## Module K — Offers and decisions

### Screens

1. Offers overview
2. Add offer
3. Offer detail
4. Offer condition checklist
5. Offer comparison
6. Decision timeline
7. Accept/decline record
8. Deposit record

### Comparison

- academic fit;
- offer conditions;
- tuition;
- confirmed award;
- net first-year cost;
- deposit;
- response deadline;
- refund terms;
- location/living assumption;
- student priorities;
- unresolved risks.

ScholarPath should help the student reason; it must not choose an offer on the student’s behalf.

---

## Module L — Notifications, support, and corrections

### Screens

1. Notification center
2. Notification preferences
3. Help center
4. Contact support
5. Ticket detail
6. Report incorrect information
7. Correction status
8. System status

### Notification types

- approaching deadline;
- task blocked;
- recommender waiting;
- document expiring;
- saved opportunity changed;
- source became stale/conflicting;
- scholarship cycle opened/closed;
- application action;
- support reply;
- security event.

### Correction flow

1. Start from the exact field/source.
2. Choose issue type.
3. Add explanation and optional official link/evidence.
4. Receive ticket ID.
5. Track received/in review/resolved/rejected.
6. See public record change only after review.

---

## Module M — Settings, privacy, and account

### Screens

1. Account
2. Profile preferences
3. Country/currency/timezone
4. Notification preferences
5. Connected supporters
6. Privacy and consent
7. Data export
8. Delete account
9. Sessions/devices

### Requirements

- Timezone is explicit and editable.
- Account deletion explains retention and irreversible effects.
- Data export is asynchronous with visible status.
- Session revocation is available.
- Marketing consent is never bundled with product notifications.

---

## Module N — Research operations

### Screens

1. Operations dashboard
2. Source inbox
3. Source detail
4. Source capture
5. Institution records
6. Programme records
7. Scholarship programmes
8. Scholarship cycles
9. Atomic rules
10. Requirement templates
11. Taxonomies/equivalencies
12. Conflict queue
13. Review queue
14. Diff and approval
15. Publication history
16. Freshness calendar

### Source registry fields

- source title;
- official owner;
- canonical URL;
- source type;
- destination;
- institution/funder;
- programme/scholarship relation;
- effective date;
- captured date;
- next review date;
- access notes;
- archived snapshot reference;
- operator;
- verification state.

### Atomic fact model

A record is not one undifferentiated blob. Each material fact has:

- normalized value;
- display value;
- source;
- source excerpt/reference location;
- effective date;
- verification state;
- operator;
- reviewer;
- version;
- conflict state.

### Review flow

`Captured → Normalized → Rule-linked → Review requested → Approved/Rejected → Published → Review due → Archived`

An operator cannot approve their own material change. A published record retains previous versions.

### Admin-form UX

- Use taxonomies/selects for structured fields.
- Use text only where truly open-ended.
- Show source beside the fact being edited.
- Show before/after diff.
- Require rationale for material changes.
- Warn about affected saved opportunities and active applications.
- Permit scheduled publication where a future cycle has known dates.

---

## Module O — Administration

### Screens

1. Admin overview
2. Users
3. User detail
4. Roles and permissions
5. Support queue
6. Correction queue
7. Notification templates
8. Display/featured content
9. Product analytics
10. Funnel analytics
11. Security events
12. Audit log
13. System settings
14. Feature flags

### Admin overview

Show operational health, not vanity metrics:

- records due for review;
- unresolved conflicts;
- failed publication jobs;
- students affected by changed deadlines;
- support SLA;
- failed notifications;
- unusual auth/security events;
- onboarding completion;
- discovery-to-portfolio;
- portfolio-to-application;
- application task completion;
- correction resolution.

### User detail privacy

- show only minimum necessary context;
- document access requires explicit elevated action and reason;
- every sensitive access is audited;
- impersonation, if ever added, is highly visible and audited;
- support notes are separate from student-authored data.

---

## 8. Cross-module journeys

### 8.1 New student to first useful result

`Landing → assessment draft → sign up → verify → review answers → pathway processing → initial report → save first opportunity → Today`

### 8.2 Discovery to active application

`Discover → detail → sources/conditions → save → portfolio group → compare → add application → generated requirement matrix → next task`

### 8.3 Document reuse

`Application requirement → upload → metadata confirmation → document library → link to requirement → accepted for application → reuse on second application with separate status`

### 8.4 Scholarship dependency

`Funding profile → scholarship result → verify origin/degree rules → save → connect to programme/application → separate deadline/tasks → award result → funding scenario update`

### 8.5 Source change

`Research operator captures change → reviewer approves → record version published → affected saved/application records identified → student notified → task/deadline updated with history`

### 8.6 Offer decision

`Offer received → conditions captured → documents/tasks created → funding scenario updated → compare offers → student records decision → deposit/response deadline tracked`

---

## 9. Frontend data contracts

The frontend can be completed with typed mock repositories before backend wiring. Components must consume interfaces, not hard-coded page constants.

### Core envelope

```ts
type ApiResult<T> =
  | { ok: true; data: T; meta?: { generatedAt: string; stale?: boolean } }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```

### Source-backed fact

```ts
type VerifiedFact<T> = {
  value: T | null;
  displayValue?: string;
  status: "verified" | "review_due" | "stale" | "conflicting" | "draft";
  sourceIds: string[];
  effectiveFrom?: string;
  effectiveTo?: string;
  verifiedAt?: string;
  nextReviewAt?: string;
};
```

### Rule outcome

```ts
type RuleOutcome = {
  ruleId: string;
  state: "confirmed" | "conditional" | "needs_verification" | "not_match" | "not_evaluated";
  reason: string;
  studentFactIds: string[];
  sourceFactIds: string[];
  missingInputs: string[];
  actions: string[];
};
```

### Opportunity summary

```ts
type OpportunitySummary = {
  id: string;
  kind: "programme" | "scholarship";
  title: string;
  provider: string;
  country: string;
  deadline?: VerifiedFact<string>;
  costOrCoverage: VerifiedFact<string>;
  matchState: RuleOutcome["state"];
  fitReasons: string[];
  conditions: string[];
  verificationStatus: VerifiedFact<unknown>["status"];
  saved: boolean;
};
```

### Application

```ts
type ApplicationCase = {
  id: string;
  programmeId: string;
  scholarshipIds: string[];
  status: "considering" | "preparing" | "ready_review" | "ready_submit" |
    "submitted" | "awaiting_result" | "interview" | "offer" |
    "unsuccessful" | "withdrawn" | "closed";
  deadline: VerifiedFact<string>;
  requirements: RequirementItem[];
  taskIds: string[];
  documentLinks: DocumentRequirementLink[];
  writingItemIds: string[];
  recommenderRequestIds: string[];
  activity: ActivityEvent[];
};
```

### State fixtures required per feature

Every feature repository must include fixtures for:

- `default`;
- `empty`;
- `loading` via delayed adapter;
- `partial`;
- `stale`;
- `conflict`;
- `error`;
- `long_content`;
- `mobile_dense`;
- `permission_denied` where applicable.

---

## 10. Responsive and future iOS behavior

### Web breakpoints

- Compact: under 768 px
- Medium: 768–1199 px
- Wide: 1200 px and above

### Compact navigation

- Bottom tabs: Today, Discover, Portfolio, Applications, Workspace.
- Profile/avatar in top bar.
- Search opens a full-screen surface.
- Filters and secondary actions use bottom sheets.
- Primary form CTA respects safe area.

### Wide navigation

- Compact left rail with the same five destinations.
- Search/command entry in header.
- Contextual secondary navigation inside the current module.
- Details may use a side panel only when the URL and back behavior remain predictable.

### iOS translation

- SwiftUI or React Native can consume the same contracts later.
- Use native navigation stacks, sheets, share sheet, document picker, camera scan, notifications, and secure local storage.
- Avoid web-only hover dependence.
- Use agenda-first tasks and bottom-tab navigation.
- Deep links target application, task, document request, and opportunity.
- Cache the current application summary, urgent tasks, and draft writing locally.
- Never cache sensitive documents unencrypted.

---

## 11. Motion and micro-interactions

Motion supports comprehension:

- route transition: subtle fade/translate;
- step transition: directional;
- save state: “Saving → Saved” status region;
- task completion: check/fill plus undo;
- upload: real byte progress;
- filter changes: result count refresh without layout jump;
- comparison differences: restrained highlight;
- deadline change: attention pulse once, never continuous;
- empty state: static or subtle illustration, no distracting loops.

Rules:

- 120–240 ms for control/section transitions;
- longer only for meaningful route transitions;
- no fake processing percentages;
- no celebratory confetti for sensitive outcomes;
- honor `prefers-reduced-motion`;
- animations never delay the next action.

---

## 12. Accessibility and form-quality contract

- One visible label per control.
- Helper text is not a substitute for a label.
- Error summary links to invalid fields.
- Inline errors state the problem and correction.
- Do not erase valid answers after a validation failure.
- Use `autocomplete` for identity/contact fields.
- Changing a selection does not unexpectedly navigate.
- Status messages use appropriate live regions.
- Focus moves deliberately after route, modal, error, and dynamic-step changes.
- Keyboard operation is complete.
- Pointer targets meet minimum spacing/size.
- Review answers provides a Change action per section.
- “Not provided” is explicit.

This follows current guidance from the [Apple Human Interface Guidelines for onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [GOV.UK check-answers pattern](https://design-system.service.gov.uk/patterns/check-answers/), and [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

---

## 13. Research and data-source operating policy

### Source priority

1. institution/funder official programme or scholarship page;
2. official application portal or downloadable regulation;
3. government or intergovernmental source;
4. recognized official aggregator for discovery;
5. secondary source only as an unverified lead.

### Discovery sources, not automatic truth

- UCAS can support UK course discovery, while each institution remains authoritative for programme-specific international requirements. UCAS itself notes that courses and institutions have differing requirements: [UCAS entry requirements](https://www.ucas.com/applying/you-apply/what-and-where-study/entry-requirements).
- DAAD provides an official scholarship database but explicitly advises applicants to confirm third-party offers with the named provider: [DAAD scholarship database](https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/).
- EducationUSA provides an official U.S. financial-aid discovery surface: [EducationUSA financial aid](https://educationusa.state.gov/find-financial-aid).
- Chevening publishes cycle-specific dates and document stages that must be stored by cycle, not overwritten globally: [Chevening application timeline](https://www.chevening.org/scholarships/application-timeline/).
- Erasmus Mundus and other consortium scholarships require programme-level verification because each consortium controls its criteria and timeline.

### Data intake rule

No external API is required for the initial operating model. The platform can use:

- researcher capture from official pages;
- structured imports from permitted official files;
- source snapshots/references;
- reviewer approval;
- scheduled freshness checks;
- student correction reports.

Automated scraping must not be assumed to be legally or technically permitted. Terms, robots policy, rate limits, and licensing must be checked per source before automation.

---

## 14. Analytics without dark patterns

### Product outcomes

- assessment completion;
- time to first verified saved opportunity;
- percentage of saved items with unresolved conditions;
- portfolio-to-application conversion;
- application requirement completion;
- missed-deadline prevention;
- document reuse;
- recommender completion;
- offer comparison completion;
- correction resolution time.

### Research operations

- source freshness;
- review backlog;
- conflict age;
- change-to-publication time;
- affected-student notification success;
- correction acceptance rate;
- fields without primary sources.

### Never optimize

- engagement time for its own sake;
- number of applications regardless of fit;
- fear-based notification clicks;
- consultant lead sales;
- biased featured rankings.

---

## 15. Complete implementation sequence

### Phase 0 — Frontend foundation

- confirm VOIT component inventory from Figma;
- finalize tokens, Urbanist, responsive shell, five-item navigation;
- create typed repositories and scenario fixtures;
- build global loading/error/empty/offline patterns;
- add accessibility and visual regression harness.

### Phase 1 — Profile to verified discovery

- auth/public shell;
- adaptive onboarding;
- profile/evidence;
- Today first-use state;
- programme/scholarship discovery;
- detail/source displays;
- save and portfolio;
- compare.

### Phase 2 — Application execution

- application creation/detail;
- requirement matrix;
- tasks/calendar;
- documents;
- submission review and record;
- notifications.

### Phase 3 — Funding, writing, and decisions

- writing workspace;
- recommenders;
- funding scenarios;
- offers;
- support/corrections;
- settings/privacy.

### Phase 4 — Research and admin operations

- source registry/inbox;
- programme and scholarship editors;
- atomic rules;
- review/diff/publication;
- conflict/freshness queues;
- user/support/security admin;
- audit and analytics.

### Phase 5 — iOS

- native shell and auth;
- Today;
- discovery/save;
- applications/tasks;
- document capture;
- writing drafts;
- notifications/deep links;
- offline-safe states;
- App Store privacy and accessibility QA.

---

## 16. Definition of frontend complete

A module is not “complete” because its happy-path page exists. It is complete only when:

- all listed screens exist;
- navigation and back behavior are correct;
- desktop, tablet, and mobile layouts are verified;
- loading, empty, partial, stale, conflict, error, offline, and permission states exist;
- forms validate and preserve data;
- destructive actions require confirmation;
- keyboard and screen-reader semantics are checked;
- reduced-motion behavior works;
- realistic long content is tested;
- typed contracts replace page-local mock objects;
- source and trust states are visible;
- all primary actions lead somewhere real;
- build, lint, type checks, and browser QA pass.

---

## 17. Approval gates before feature implementation

The product direction is now sufficiently defined. Before Phase 0 implementation, confirm only:

1. **Brand name:** keep ScholarPath or rename before the shell spreads the name everywhere.
2. **Initial destination depth:** recommended first set is UK, Germany, Erasmus Mundus routes, and a deliberately limited U.S. funding subset.
3. **Initial study levels:** recommended first release is postgraduate taught plus selected research master’s; undergraduate can follow after origin-qualification rules are deeper.
4. **Commercial boundary:** recommended free profile plus limited verified results, with paid execution workspace later; no consultant marketplace.
5. **Figma access:** the shared canvas is accessible and the selected navigation family was visually audited. Exact inspect-mode properties remain unavailable without a signed-in Figma Dev Mode session, so implementation uses the already extracted VOIT variables for exact token values and the visible canvas for component composition.

Everything else in this specification can proceed without inventing product behavior during implementation.

---

## 18. UX reference notes

The following references were studied as patterns, not copied:

- [Coursera course filtering on Mobbin](https://mobbin.com/flows/d797e8f0-4061-4d09-8721-edf5cbe6af59): persistent filters, visible sorting, result cards.
- [Coursera search on Mobbin](https://mobbin.com/flows/03a17ff1-7b49-4a1d-ae65-7da85bb0db06): query-led discovery.
- [Brilliant onboarding on Mobbin](https://mobbin.com/flows/7ffbd4f0-78d1-49be-bf0d-9c90cac00e8c): one decision per mobile screen, visible progress, full-width CTA.
- [Juicebox task workflow on Mobbin](https://mobbin.com/flows/b5288f2a-f847-401b-b38e-ceca72fc73b3): project context with nearby task visibility.
- [Ghost page-management workflow on Mobbin](https://mobbin.com/flows/f4392b23-c044-47fe-9991-aae221611931): clear content navigation and first-use states.
- [Dropbox document screen on Mobbin](https://mobbin.com/screens/c33e3023-0229-4693-b6ef-53e432b4d51b): upload-first document actions and familiar file organization.
- [Deel mobile task dashboard on Mobbin](https://mobbin.com/screens/63e34f8f-acb6-4620-bfd6-dbb38ef1508d): focused “for you today” tasks with progress.
- [ClickUp mobile task dashboard on Mobbin](https://mobbin.com/screens/f0cd9de1-bd23-40ac-b1e5-8ab3e369817d): agenda-like overdue grouping.

Dribbble references are permitted only for composition, interaction inspiration, and motion. They are not evidence for admissions rules, accessibility, or product truth.
