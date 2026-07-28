# Scholarship & Admissions Execution Platform

## Product Blueprint, Module Map, Research, Architecture, and Delivery Plan

## 1. Executive decision

We will build a new product from scratch.

The previous “Global Mobility OS” repository is not the base product. It is a concept library that can inform interface patterns, user flows, and data-model ideas. No old scholarship probability formula, demo data, hardcoded rule, security shortcut, or broad immigration feature should be carried forward as product truth.

The new product is:

> A verified scholarship and foreign-university application execution platform for students from Pakistan, India, and Bangladesh.

The platform will not sell consultancy calls or route students to commission-driven counsellors. It will help a student understand their position, identify verified opportunities, build realistic pathways, complete requirements, manage documents, meet deadlines, and track applications.

The differentiator is not “AI.” It is:

1. South Asian profile understanding.
2. Source-linked and explainable eligibility.
3. Detailed, actionable pathway reports.
4. Application execution support.
5. Transparent uncertainty.
6. No institution-placement bias.
7. A strong mobile experience.

## 2. Product thesis

Scholarship and international-admission journeys are fragmented across scholarship portals, university pages, government sites, PDFs, application systems, emails, spreadsheets, messaging groups, and consultants.

Students usually have four separate problems:

1. They do not know which opportunities are genuinely relevant.
2. They cannot translate published requirements into a decision about their own profile.
3. They do not know the correct sequence of actions.
4. They lose progress across documents, deadlines, references, essays, tests, and portals.

Most existing products concentrate on discovery, lead generation, university placement, counselling, or generic matching. Our product should concentrate on the student’s execution layer: “What applies to me, what is missing, what happens next, and where is the evidence?”

## 3. Product promise

After completing a structured profile, the student receives:

- A readiness diagnosis.
- Eligible, conditionally eligible, ineligible, and unverified opportunities.
- Reasons for every result.
- Missing information and missing requirements.
- Destination and degree pathways.
- Scholarship and admission dependencies.
- A prioritized action plan.
- A document matrix.
- A deadline plan.
- A funding-gap view.
- A workspace for each application.
- Progress, blocker, and next-action updates.

The product must never promise admission, scholarship selection, or visa approval.

## 4. Target audience

### 4.1 Primary market

- Pakistani students.
- Indian students.
- Bangladeshi students.
- Students applying from their home country or currently residing abroad.
- Final-year undergraduate students.
- Recent graduates.
- Early- and mid-career professionals seeking a master’s degree.
- Research candidates seeking funded master’s or doctoral routes.

### 4.2 Initial degree focus

The best first scope is:

- Taught master’s programmes.
- Research master’s programmes where rules can be verified.
- Major fully funded or substantially funded master’s scholarships.
- Selected doctoral funding routes after the master’s workflow is stable.

Undergraduate admissions should not be the first full execution market because parental involvement, school credentials, country-specific boards, application systems, and financial-aid processes create a separate product. We may include limited undergraduate discovery before building a dedicated undergraduate workflow.

### 4.3 Initial destination focus

Recommended first destination order:

1. United Kingdom.
2. Germany.
3. Erasmus Mundus and multi-country European programmes.
4. United States graduate programmes and major fellowships.
5. Australia.
6. Selected European destinations.

Canada can remain in the research backlog until current policy volatility, institutional quality, and programme data can be handled with sufficient confidence.

### 4.4 Core user segments

#### Segment A: Scholarship-dependent applicant

- Cannot proceed without full or substantial funding.
- Needs funding coverage broken into tuition, living cost, travel, visa, insurance, and exclusions.
- Needs early deadlines and multiple parallel applications.

#### Segment B: Mixed-funding applicant

- Can contribute part of the cost.
- Needs scholarships, tuition waivers, assistantships, and affordable programme combinations.
- Needs a true funding-gap calculation rather than a “fully funded” marketing label.

#### Segment C: Admission-first applicant

- Can self-fund or has a sponsor.
- Needs programme fit, eligibility, timeline, documents, and application management.
- May pursue institutional scholarships after admission.

#### Segment D: Research applicant

- Needs research-fit evaluation, supervisor requirements, proposal readiness, publication evidence, and funding routes.
- Requires a different workflow from taught master’s candidates.

#### Segment E: Early planner

- Is 12–24 months away from applying.
- Needs a gap-closing plan for GPA context, English testing, work experience, research, portfolio, references, and savings.

## 5. Jobs to be done

### 5.1 Discovery job

“Show me opportunities that accept someone with my nationality, education, field, experience, finances, and intended intake.”

### 5.2 Eligibility job

“Tell me whether I meet every mandatory requirement, which requirement is uncertain, and where the rule came from.”

### 5.3 Planning job

“Turn my goals into a realistic sequence of tests, documents, applications, and deadlines.”

### 5.4 Execution job

“Keep all my applications, tasks, documents, references, essays, submissions, and decisions organized.”

### 5.5 Improvement job

“Tell me what I can improve before the next cycle and how that changes my available pathways.”

### 5.6 Trust job

“Let me verify the information myself and show me when it was last checked.”

## 6. Research findings that shape the product

### 6.1 Scholarship processes are structurally different

Chevening eligibility includes nationality/residency context, a return-home commitment, post-degree work experience, and applications to three eligible UK courses. This is not representable as a simple GPA-and-country filter. See [Chevening eligibility guidance](https://www.chevening.org/resource-hub/guidance/eligibility/).

Commonwealth Master’s Scholarships may involve a nominating body as well as the central application system. Nominators can add their own criteria and deadlines. This means the product needs parallel deadlines, nomination routes, and source precedence. See [Commonwealth Master’s Scholarships](https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/).

Erasmus Mundus students apply directly to the institution or consortium running a programme, and each programme publishes its own entry requirements and process. The catalogue changes over time. See [Erasmus Mundus Joint Masters](https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters).

DAAD operates an official scholarship database for DAAD programmes and selected external funders. DAAD also warns users to confirm current terms with the named provider for third-party offers. This supports our decision to store source provenance, verification dates, and uncertainty. See the [DAAD scholarship database](https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/).

### 6.2 Application requirements vary at multiple levels

EducationUSA states that U.S. graduate requirements can vary by institution and may separately include institutional and departmental requirements. The product therefore needs reusable requirement templates plus programme-specific overrides. See [EducationUSA graduate application guidance](https://educationusa.state.gov/complete-your-us-application-graduate).

UCAS is a centralized service for UK undergraduate applications, while postgraduate processes are often direct and programme-specific. The platform must model application channels instead of assuming one universal form. See [UCAS international guidance](https://www.ucas.com/international).

### 6.3 Funding is component-based

“Fully funded” is not a sufficient data field. Erasmus Mundus describes participation-cost coverage and contributions to travel, visa, and living costs. Commonwealth funding separately describes tuition, airfare, stipend, and other allowances. U.S. graduate funding may combine scholarships, assistantships, waivers, and personal funding. See [EducationUSA graduate finance guidance](https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies/graduate).

Our data model must store each funding component, its amount or rule, duration, currency, limits, and exclusions.

### 6.4 Local academic identity matters

Pakistan’s HEC process distinguishes degrees, transcripts, provisional certificates, attestation, and equivalence. It requires consistent document information and institutional verification. See [HEC degree attestation](https://www.hec.gov.pk/english/services/students/das/Pages/Degree-Attestation.aspx).

The product must store the original qualification system and evidence. It must not pretend that a universal GPA conversion is authoritative. Where a university publishes a country-specific equivalency, that rule should take precedence. Where it does not, the result must remain conditional or require institutional confirmation.

### 6.5 Existing platforms leave room for a neutral execution product

Yocket markets university shortlisting, document support, scholarships, visa help, community, and premium counselling. See [Yocket](https://yocket.com/).

LeapScholar offers shortlisting, financing, test preparation, document support, and end-to-end expert assistance. See [LeapScholar](https://leapscholar.com/home).

ApplyBoard combines programme discovery, application submission and tracking, recruitment partners, and related services. See [ApplyBoard](https://www.applyboard.com/).

ScholarshipOwl concentrates on scholarship matching and simplified application reuse, primarily in a different market context. See [ScholarshipOwl](https://scholarshipowl.com/).

Our strategic space is:

- No counsellor dependency.
- No university-placement commission influencing rankings.
- Stronger official-source evidence.
- South Asian academic and document context.
- Deterministic eligibility instead of unexplained admission probability.
- Stronger application execution than a scholarship directory.

## 7. Product principles

### 7.1 Evidence before confidence

Every material eligibility statement must be connected to:

- A source.
- A source type.
- A verification status.
- A checked time.
- A rule interpretation.
- A responsible reviewer.

### 7.2 No fake probability

Do not show “82% scholarship chance” without a valid outcome dataset and calibrated model.

Allowed concepts:

- Eligibility status.
- Fit dimension.
- Priority score.
- Readiness score.
- Data confidence.
- Competition context, if the provider publishes it.

### 7.3 Missing data is not a passing value

If GPA, English score, graduation date, experience, nationality, or another required attribute is missing, the system returns “insufficient information,” not an assumed average.

### 7.4 Separate facts, interpretations, and recommendations

- Fact: “The provider requires two years of post-degree work experience.”
- Interpretation: “Your recorded experience appears to meet the duration rule.”
- Recommendation: “Upload employer evidence before treating this requirement as complete.”

### 7.5 Student remains the applicant

The platform supports the student but does not impersonate them, fabricate material, submit without explicit authorization, or write dishonest statements.

### 7.6 Mobile-first, not mobile-shrunk

The web product must be designed for 360–430 px widths from the beginning. The future iOS app will use the same backend, rules, content, and application state.

### 7.7 Neutrality

Rankings cannot be influenced by university commission, affiliate payment, or hidden commercial preference. Any sponsored placement must be clearly labelled and separated from eligibility and priority calculations.

## 8. End-to-end user journey

### Stage 1: Explore

- View public scholarship and pathway information.
- Use a limited guest eligibility preview.
- Understand what data is required for a complete report.

### Stage 2: Create profile

- Create an account.
- Select home country, current residence, degree level, target intake, and funding need.
- Complete progressive profile sections.
- Upload optional evidence.

### Stage 3: Receive readiness report

- View profile completeness.
- See facts and assumptions.
- See academic, language, experience, research, documentation, and financial readiness.
- See pathway categories.
- See missing data.

### Stage 4: Discover and evaluate

- Search scholarships, programmes, and university routes.
- See eligibility status and reasons.
- Inspect official sources.
- Compare funding and requirements.
- Save opportunities.

### Stage 5: Build portfolio

- Choose a balanced application portfolio.
- Assign priority.
- Check workload and deadline collisions.
- Create application workspaces.

### Stage 6: Prepare

- Complete tasks.
- Upload and classify documents.
- Manage references.
- Draft and revise application answers.
- Prepare tests, proposals, portfolios, and interviews.

### Stage 7: Submit and track

- Record portal submissions.
- Store confirmation evidence.
- Track references and decisions.
- Handle requests for additional information.

### Stage 8: Decide

- Compare offers and funding.
- Calculate remaining cost.
- Record conditions and response deadlines.
- Prepare the next administrative stage.

### Stage 9: Learn

- Record outcome.
- Analyze rejection or deferral if evidence is available.
- Roll incomplete work into the next cycle.
- Improve the profile and portfolio.

## 9. Complete module map

## Module 0: Platform foundation

### Purpose

Provide the shared foundation used by the web product, admin system, and future iOS application.

### Features

- Supabase authentication.
- Email verification.
- Password reset.
- Optional magic links.
- Sign in with Apple for iOS.
- Session and device management.
- User roles.
- Account status.
- Feature flags.
- Localization foundation.
- Consent records.
- Account export and deletion.
- Audit events.

### Primary entities

- `profiles`
- `user_roles`
- `user_consents`
- `user_sessions_metadata`
- `feature_flags`
- `audit_events`

## Module 1: Student profile and assessment

### Purpose

Build a structured representation of the student without forcing them to finish everything in one session.

### Sections

- Identity.
- Citizenship and residence.
- Academic history.
- Current studies.
- Standardized tests.
- English tests.
- Employment.
- Leadership and volunteering.
- Research.
- Publications.
- Awards.
- Portfolio.
- Financial capacity.
- Dependants.
- Accessibility needs.
- Target degrees, countries, fields, and intakes.
- Previous international study.
- Previous scholarship outcomes.

### Features

- Progressive save.
- Profile completeness by pathway.
- Evidence status for important claims.
- Country-specific questions.
- Multiple qualifications.
- Multiple grading systems.
- Separate completed and predicted results.
- Profile timeline.
- Change history.

## Module 2: Academic normalization and qualification context

### Purpose

Interpret qualifications without claiming an unofficial universal equivalency.

### Features

- Original grade format storage.
- Percentage, CGPA, class/division, and transcript support.
- Institution and awarding-body recognition.
- Degree duration and education-years context.
- Country-specific qualification taxonomies.
- Published university-equivalency rules.
- Rule precedence.
- Manual-review status.
- Explainable conversions used only when an official rule exists.

### Non-negotiable rule

Store the original value and scale. A normalized value may support sorting, but it must never replace the original academic record or override a university’s published country-specific rule.

## Module 3: Goals, constraints, and planning assumptions

### Purpose

Understand what “suitable” means for the individual student.

### Features

- Intended field.
- Degree level.
- Intake.
- Destination preferences.
- Maximum personal contribution.
- Funding dependency.
- Family constraints.
- Timeline constraints.
- Work-experience plans.
- Research versus taught preference.
- Career and development goals.
- Must-have and avoid criteria.

## Module 4: Scholarship catalogue

### Purpose

Provide structured, source-backed scholarship discovery.

### Features

- Keyword and semantic taxonomy search without external AI.
- Country and nationality filters.
- Degree-level filters.
- Field filters.
- Funding-component filters.
- Application-channel filters.
- Deadline filters.
- Recurrence/cycle filters.
- Provider-type filters.
- Save and compare.
- Official-source access.
- Verification and freshness labels.
- Change notifications.

### Important distinction

The product stores a scholarship programme separately from a scholarship cycle. A recurring scholarship may change deadline, funding, documents, fields, or eligible nationalities in every cycle.

## Module 5: University and programme catalogue

### Purpose

Model the admission target connected to scholarships.

### Features

- Institution records.
- Campus records.
- Programme records.
- Degree award and level.
- Department.
- Intake.
- Duration.
- Delivery mode.
- Tuition and mandatory fees.
- Country-specific entry requirements.
- English requirements.
- Test requirements.
- Portfolio/research requirements.
- Application fee.
- Application channel.
- Accreditation/recognition sources.
- Institutional scholarships.
- Programme-scholarship relationships.

## Module 6: Source registry and provenance

### Purpose

Make data trust a product capability.

### Source hierarchy

1. Scholarship provider or government page.
2. Official university programme page.
3. Official application-system page.
4. Official downloadable guide or terms.
5. Official national education/recognition body.
6. Trusted secondary source used only as a lead.

### Features

- Canonical URL.
- Source owner.
- Source type.
- Page title.
- Region/language.
- Access status.
- Relevant excerpt.
- Captured file or snapshot metadata where legally appropriate.
- Effective cycle.
- Last checked.
- Next review due.
- Reviewer.
- Source confidence.
- Contradiction records.
- Superseded source tracking.

## Module 7: Data intake and verification operations

### Purpose

Operate the catalogue without depending on external commercial APIs.

### Workflow

1. Discover a candidate official source.
2. Register the source.
3. Create or connect the provider, scholarship, institution, or programme.
4. Extract proposed facts.
5. Normalize terms.
6. Translate facts into atomic rules.
7. Perform a second-person review for high-impact rules.
8. Publish.
9. Schedule re-verification.
10. Detect and review changes.
11. Archive expired cycles without deleting history.

### Ingestion methods

- Manual entry for initial high-value opportunities.
- Structured CSV import from internally researched records.
- Controlled crawling of permitted public official pages later.
- Email/newsletter monitoring later.
- PDF extraction with human review.
- Student-submitted leads that remain unpublished until verified.

### Publishing statuses

- Draft.
- In review.
- Verified.
- Verified with ambiguity.
- Needs recheck.
- Expired.
- Withdrawn.
- Archived.

## Module 8: Eligibility rule engine

### Purpose

Evaluate mandatory and conditional rules in a deterministic and testable way.

### Rule families

- Citizenship.
- Residence.
- Age where legally relevant.
- Degree level.
- Degree completion.
- Graduation timing.
- Field.
- Grade.
- Work experience.
- Post-degree work experience.
- English score.
- Test score.
- Research experience.
- Programme admission.
- University offer.
- Financial need.
- Return-home commitment.
- Prior award.
- Concurrent funding.
- Application limit.
- Nomination.
- Employer approval.
- Document.
- Deadline.

### Rule states

- Pass.
- Fail.
- Conditional pass.
- Unknown.
- Not applicable.
- Manual verification required.

### Opportunity-level result

- Eligible.
- Conditionally eligible.
- Likely ineligible.
- Insufficient information.
- Source verification required.

### Explainability output

Every result includes:

- Rule statement.
- Student value.
- Evaluation.
- Reason.
- Source.
- Evidence status.
- Remediation, if possible.

## Module 9: Fit and priority engine

### Purpose

Help students choose where to spend effort without pretending to know selection probability.

### Dimensions

- Mandatory eligibility.
- Funding coverage.
- Deadline readiness.
- Document readiness.
- Field alignment.
- Career/development alignment.
- Research alignment.
- Student preference.
- Personal funding gap.
- Estimated application workload.
- Data confidence.

### Output

- High priority.
- Worth considering.
- Aspirational.
- Backup.
- Not actionable now.

The priority formula must be visible in plain language and must not use provider payments.

## Module 10: Detailed pathway report

### Purpose

Give the student a complete, actionable diagnosis after profile entry.

### Report sections

1. Executive summary.
2. Profile completeness.
3. Verified student facts.
4. Missing information.
5. Academic context.
6. English and testing readiness.
7. Experience and leadership readiness.
8. Research readiness.
9. Financial readiness.
10. Documentation readiness.
11. Recommended pathway families.
12. Eligible opportunities.
13. Conditional opportunities.
14. Current ineligibilities.
15. Requirement-gap matrix.
16. Funding-gap scenarios.
17. 30-, 60-, 90-, and 180-day action plan.
18. Application-portfolio recommendation.
19. Risks and uncertainty.
20. Source and verification appendix.

### Report behavior

- Recalculates when profile or rules change.
- Preserves previous versions.
- Shows changed sections.
- Allows export.
- Never hides failing rules behind an overall score.

## Module 11: Shortlist and portfolio builder

### Purpose

Turn discovery into an intentional application portfolio.

### Features

- Save.
- Tag.
- Compare.
- Personal priority.
- Application effort estimate.
- Deadline collision detection.
- Funding mix.
- Country mix.
- Ambition balance.
- Duplicate programme detection.
- Scholarship/programme dependency view.
- Portfolio warnings.

## Module 12: Application workspace

### Purpose

Create one operational record for every application.

### Features

- Application type.
- Scholarship and programme links.
- Application channel.
- Current stage.
- Status history.
- Owner.
- Deadline set.
- Tasks.
- Requirements.
- Documents.
- References.
- Written responses.
- Fees.
- Submission evidence.
- Messages and notes.
- Decision.
- Conditions.
- Funding outcome.

### Standard stages

- Considering.
- Preparing.
- Waiting on documents.
- Waiting on recommender.
- Ready for review.
- Ready to submit.
- Submitted.
- Additional information requested.
- Interview.
- Waitlisted.
- Offered.
- Rejected.
- Withdrawn.
- Accepted.
- Declined.

## Module 13: Tasks, milestones, and deadline engine

### Purpose

Convert complex applications into next actions.

### Features

- Rule-generated tasks.
- Template-generated tasks.
- User-created tasks.
- Dependencies.
- Blocking tasks.
- Milestones.
- Internal deadline versus official deadline.
- Time-zone storage.
- Reminder schedule.
- Recurring tasks.
- Evidence of completion.
- Overdue escalation.
- Rescheduling.
- Workload calendar.

## Module 14: Document vault and evidence

### Purpose

Securely store and reuse student-controlled documents.

### Document types

- Passport.
- National identity.
- Degree.
- Provisional certificate.
- Transcript.
- Mark sheet.
- Attestation.
- Equivalence.
- English score.
- GRE/GMAT or other test.
- CV.
- Employment letter.
- Payslip.
- Research proposal.
- Publication.
- Portfolio.
- Award evidence.
- Financial evidence.
- Recommendation letter where student access is permitted.
- Offer and admission correspondence.

### Features

- Private Supabase Storage buckets.
- RLS owner access.
- Signed URLs.
- Versioning.
- Expiry.
- Verification status.
- Requirement reuse.
- Redaction guidance.
- Malware scanning workflow.
- File metadata.
- Access audit.
- Delete/export.

## Module 15: Requirement-to-document matrix

### Purpose

Show exactly which document satisfies which application requirement.

### Features

- One document linked to multiple requirements.
- Requirement-specific format.
- Translation/certification requirement.
- Maximum file size.
- Accepted file types.
- Naming guidance.
- Validity period.
- Missing pages.
- Upload destination.
- Completion confidence.

## Module 16: Writing workspace

### Purpose

Support authentic student writing without becoming a ghostwriting engine.

### Features

- Prompt library.
- Word/character limits.
- Outline builder.
- Evidence bank.
- STAR/story bank.
- Version history.
- Requirement checklist.
- Self-review rubric.
- Consistency checks.
- Plagiarism-awareness guidance.
- Export.

### Explicit exclusions

- No fabricated achievements.
- No automatic recommender impersonation.
- No one-click generated personal statement presented as the student’s own work.
- No promise that writing assistance increases acceptance probability.

## Module 17: Recommender management

### Purpose

Help students manage reference logistics without accessing confidential submissions.

### Features

- Recommender records.
- Relationship and role.
- Request status.
- Deadline.
- Institution-specific instructions.
- Draft briefing pack.
- Reminder plan.
- Submission confirmation.
- Confidentiality marker.
- Recommender workload view.

## Module 18: Funding and affordability

### Purpose

Show the real funding position.

### Features

- Funding components.
- Tuition coverage.
- Mandatory fee coverage.
- Stipend.
- Travel.
- Visa.
- Insurance.
- Research allowance.
- Dependants.
- Duration.
- Currency.
- Personal contribution.
- Sponsor contribution.
- Funding gap.
- Scenario comparison.
- Exchange-rate timestamp and disclaimer if rates are shown.

## Module 19: Notifications and communication

### Purpose

Surface important changes without creating noise.

### Events

- Deadline approaching.
- Source changed.
- Rule changed.
- Eligibility result changed.
- Missing document.
- Document expiring.
- Recommender pending.
- Task blocked.
- New cycle published.
- Application status changed.

### Channels

- In-app.
- Email.
- Push notifications in iOS.
- Optional calendar export later.

## Module 20: Progress support system

### Purpose

Replace the consultant follow-up function with structured assistance.

### Features

- Weekly progress summary.
- Current blockers.
- Next three actions.
- Workload risk.
- Deadline risk.
- Profile gaps.
- Stalled application detection.
- Contextual help articles.
- “Why am I seeing this?” explanations.
- Support tickets for platform/data issues.

This module does not provide personalized legal, immigration, or guaranteed-admission advice.

## Module 21: Offer and decision workspace

### Purpose

Help students compare outcomes and complete conditions.

### Features

- Offer type.
- Academic conditions.
- English conditions.
- Deposit.
- Response deadline.
- Scholarship result.
- Net funding gap.
- Programme comparison.
- Offer acceptance tasks.
- Deferral.
- Decline.

## Module 22: Admin content operations

### Purpose

Operate the source, catalogue, and guidance system.

### Workspaces

- Research queue.
- Source registry.
- Providers.
- Scholarships.
- Cycles.
- Institutions.
- Programmes.
- Requirements.
- Rules.
- Funding.
- Review assignments.
- Change queue.
- Expiry queue.
- Contradictions.
- Student-reported issues.

### Required controls

- Draft/publish separation.
- Four-eyes review for critical eligibility rules.
- Change diffs.
- Reason for override.
- Audit history.
- Rollback.
- Reviewer performance.
- Stale-data reports.

## Module 23: Rule builder and test console

### Purpose

Allow trained administrators to maintain deterministic rules safely.

### Features

- Typed rule templates.
- AND/OR groups.
- Effective cycle.
- Source attachment.
- Precedence.
- Test profiles.
- Expected results.
- Regression suite.
- Impact preview.
- Publish approval.
- Version history.

Free-form executable code should not be entered through the admin UI.

## Module 24: Support, corrections, and disputes

### Purpose

Let students challenge incorrect data or interpretation.

### Features

- Report incorrect opportunity.
- Submit official source.
- Challenge profile evaluation.
- Request data correction.
- Track resolution.
- Admin evidence response.
- Correction notification to affected users.

## Module 25: Billing and entitlements

### Purpose

Monetize advanced execution without hiding basic truth.

### Free

- Profile.
- Limited report.
- Public catalogue.
- Basic eligibility.
- Limited saves.
- Source access.

### Paid

- Full pathway report.
- Unlimited portfolio.
- Multiple application workspaces.
- Advanced deadlines.
- Document matrix.
- Funding scenarios.
- Change alerts.
- Report exports.
- Historical versions.

### Principles

- Never charge to reveal an ineligibility after encouraging an application.
- Never rank paid partner institutions above better-fit options.
- Clearly disclose renewal and cancellation.

## Module 26: Analytics and product learning

### Purpose

Improve usability and workflow effectiveness without converting correlation into admission probability.

### Metrics

- Profile completion.
- Report completion.
- Save-to-workspace conversion.
- Task completion.
- Deadline adherence.
- Document readiness.
- Submission rate.
- Outcome reporting.
- Retention by application stage.
- Data-error rate.
- Source freshness.
- Support resolution.

### Outcome data

Outcome data may later support research, but it must be checked for selection bias, missing outcomes, small samples, changing policies, and self-reporting errors before any predictive use.

## Module 27: Security, privacy, and compliance

### Purpose

Protect identity, academic, financial, and application data.

### Controls

- RLS on every user-owned table.
- Private file buckets.
- Service-role key only on trusted backend.
- Admin least privilege.
- MFA for administrators.
- No hardcoded admin emails.
- Audit trails.
- Secret management.
- Encryption in transit and at rest through managed services.
- Data minimization.
- Consent.
- Retention schedules.
- Export and deletion.
- Security incident process.
- Dependency scanning.
- Rate limiting.
- Abuse monitoring.

Supabase supports row-level policies integrated with authentication. See [Supabase RLS](https://supabase.com/features/row-level-security). Supabase Storage also uses RLS-based access control and warns that service keys bypass those controls. See [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## Module 28: iOS application

### Purpose

Provide a focused mobile execution experience after the web product and API contracts stabilize.

### Recommended iOS scope

- Sign in.
- Dashboard.
- Profile progress.
- Report reading.
- Opportunity discovery.
- Save and compare.
- Application workspaces.
- Tasks.
- Deadline notifications.
- Document capture/upload.
- Status updates.

### Features better retained on web initially

- Dense admin interfaces.
- Complex rule editing.
- Large comparison tables.
- Bulk data operations.
- Advanced report editing.

Supabase provides Swift authentication support and mobile deep-linking patterns, which supports a shared backend. See [Supabase Swift Auth](https://supabase.com/docs/reference/swift/auth-api) and [native mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking).

Apple requires apps with account creation to let users initiate account deletion in the app. This must be planned before iOS release. See [Apple account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app).

## 10. Detailed report decision logic

### 10.1 Evaluation order

1. Check source availability and freshness.
2. Check student profile completeness for the opportunity.
3. Evaluate hard eligibility rules.
4. Evaluate conditional requirements.
5. Evaluate application dependencies.
6. Evaluate document readiness.
7. Evaluate deadline readiness.
8. Calculate funding gap.
9. Calculate transparent priority.
10. Generate explanations and actions.

### 10.2 Rule precedence

Recommended precedence:

1. Current scholarship-cycle rule.
2. Current programme-specific rule.
3. Current university country-specific rule.
4. Current university general rule.
5. Scholarship-provider general rule.
6. Official national guidance.
7. Internal interpretation marked as such.

Contradictions are not silently resolved. They are stored, surfaced to administrators, and shown as uncertainty when material.

### 10.3 Example

Scholarship rule:

> Applicant must have at least 2,800 hours of post-degree work experience.

Student record:

- Degree completion recorded.
- Two employment periods recorded.
- One period started before graduation.
- Total post-degree verified duration: 2,520 hours.
- An additional 400 hours are claimed but not evidenced.

Result:

- Status: Conditionally eligible.
- Passed: Citizenship and degree.
- Not yet proven: Required post-degree hours.
- Action: Add acceptable evidence for at least 280 additional hours.
- Source: Official eligibility page.

This is more useful and honest than a “76% match.”

## 11. Data model domains

### 11.1 Identity and access

- `profiles`
- `user_roles`
- `user_consents`
- `admin_role_assignments`
- `audit_events`

### 11.2 Student profile

- `student_identities`
- `student_citizenships`
- `student_residences`
- `academic_records`
- `academic_results`
- `test_scores`
- `employment_records`
- `research_records`
- `publication_records`
- `leadership_records`
- `award_records`
- `financial_profiles`
- `student_goals`
- `profile_evidence_links`

### 11.3 Catalogue

- `providers`
- `scholarships`
- `scholarship_cycles`
- `institutions`
- `campuses`
- `programmes`
- `programme_intakes`
- `application_channels`
- `funding_packages`
- `funding_components`

### 11.4 Sources

- `sources`
- `source_versions`
- `source_claims`
- `source_reviews`
- `source_conflicts`
- `verification_schedules`

### 11.5 Rules

- `rule_definitions`
- `rule_groups`
- `rule_bindings`
- `rule_versions`
- `rule_sources`
- `rule_test_cases`
- `rule_test_runs`

### 11.6 Recommendations and reports

- `evaluation_runs`
- `rule_evaluation_results`
- `opportunity_priorities`
- `pathway_reports`
- `pathway_report_versions`
- `report_actions`

### 11.7 Execution

- `saved_opportunities`
- `portfolio_items`
- `applications`
- `application_status_events`
- `application_requirements`
- `tasks`
- `task_dependencies`
- `milestones`
- `deadlines`
- `recommenders`
- `recommendation_requests`
- `writing_projects`
- `writing_versions`
- `offers`

### 11.8 Documents

- `documents`
- `document_versions`
- `document_requirements`
- `document_verifications`
- `document_access_events`

### 11.9 Product operations

- `notifications`
- `notification_preferences`
- `support_tickets`
- `data_correction_requests`
- `subscriptions`
- `entitlements`
- `analytics_events`

## 12. Supabase architecture

### 12.1 Recommended stack

- Next.js and TypeScript for the web product and admin.
- Supabase Postgres as the system of record.
- Supabase Auth.
- Supabase Storage.
- SQL migrations committed to the repository.
- Database functions for tightly scoped atomic operations.
- Row Level Security.
- Background jobs for reminders, re-verification queues, exports, and source checks.
- SwiftUI iOS client later.

### 12.2 Architectural boundaries

#### Client

- Presentation.
- Form state.
- Local validation.
- Optimistic UI where safe.
- No service-role credentials.
- No authoritative eligibility calculation.

#### Server/domain

- Eligibility evaluation.
- Priority calculation.
- Report assembly.
- Publishing workflow.
- Billing entitlements.
- Sensitive exports.
- Admin operations.

#### Database

- Constraints.
- RLS.
- Versioned facts.
- Auditability.
- Referential integrity.
- Immutable critical history where appropriate.

### 12.3 Supabase versus additional hosting

The current Supabase Pro subscription is sufficient for the initial database, authentication, storage, and backend foundation. Hostinger is not required for this phase.

The web frontend can be deployed separately to a platform suited to Next.js. The future iOS application will connect to the same Supabase project and approved server endpoints.

### 12.4 Repository structure

Recommended structure:

```text
apps/
  web/
  admin/
  ios/
packages/
  domain/
  eligibility-engine/
  report-engine/
  database-types/
  design-system/
  validation/
supabase/
  migrations/
  seed/
  tests/
  functions/
docs/
  product/
  data-operations/
  architecture/
```

The iOS directory should be added only when native development starts. Shared concepts should be expressed as API contracts and database types, not by trying to share React code with SwiftUI.

## 13. API and event boundaries

### Public/read APIs

- Browse verified opportunities.
- Read public scholarship details.
- Read public university/programme details.
- Read sources and freshness.

### Student APIs

- Manage profile.
- Run eligibility.
- Generate report.
- Save opportunities.
- Manage portfolio.
- Manage applications.
- Manage tasks.
- Manage documents.
- Manage recommenders.
- Record outcomes.

### Admin APIs

- Manage sources.
- Create proposed facts.
- Manage catalogue.
- Build rules.
- Run tests.
- Review/publish.
- Resolve conflicts.
- Handle corrections.

### Domain events

- `profile.updated`
- `source.changed`
- `rule.published`
- `eligibility.changed`
- `application.created`
- `deadline.approaching`
- `document.expiring`
- `task.blocked`
- `application.submitted`
- `application.outcome_recorded`

## 14. UX information architecture

### Student navigation

- Home.
- My report.
- Discover.
- Shortlist.
- Applications.
- Tasks.
- Documents.
- Profile.
- Notifications.

### Application workspace navigation

- Overview.
- Requirements.
- Tasks.
- Documents.
- Writing.
- References.
- Submission.
- Timeline.
- Decision.

### Admin navigation

- Operations dashboard.
- Research queue.
- Sources.
- Scholarships.
- Universities.
- Programmes.
- Rules.
- Reviews.
- Changes.
- Corrections.
- Users.
- Audit.
- Settings.

### Mobile dashboard

The mobile home screen should answer:

1. What needs attention today?
2. What deadline is closest?
3. What is blocked?
4. What changed?
5. What should I do next?

## 15. Build phases

## Phase 0: Product and data foundation

### Deliverables

- Product specification.
- Design principles.
- Source policy.
- Scholarship data dictionary.
- Rule grammar.
- Initial schema.
- RLS design.
- Migration workflow.
- Design system.
- Initial 30–50 authoritative opportunities.

### Exit condition

The team can take one official scholarship source, encode it, test it against sample profiles, and produce an explainable result.

## Phase 1: Readiness and verified discovery

### Deliverables

- Authentication.
- Student profile.
- Academic/test/employment/financial records.
- Scholarship catalogue.
- University/programme basics.
- Source registry.
- Admin research workflow.
- Eligibility engine.
- Detailed report v1.
- Save and compare.
- Responsive web experience.

### Exit condition

A student can complete a profile, receive honest eligibility results, verify sources, and understand missing requirements.

## Phase 2: Application execution

### Deliverables

- Portfolio builder.
- Application workspace.
- Requirements.
- Tasks and milestones.
- Deadlines.
- Document vault.
- Requirement-document matrix.
- Recommender tracking.
- Notifications.

### Exit condition

A student can manage multiple real applications without a spreadsheet or consultant follow-up.

## Phase 3: Funding and writing support

### Deliverables

- Funding components.
- Funding-gap scenarios.
- Writing workspace.
- Evidence/story bank.
- Offer comparison.
- Paid entitlements.
- Report export.

### Exit condition

The product supports the full path from profile through submitted application and decision.

## Phase 4: iOS

### Deliverables

- SwiftUI application.
- Shared authentication.
- Deep links.
- Push notifications.
- Profile and report.
- Discovery.
- Applications and tasks.
- Document capture.
- Account deletion.

### Exit condition

Core execution workflows work natively without creating a separate source of truth.

## Phase 5: Scale and intelligence

### Deliverables

- Controlled source-change detection.
- Broader destination coverage.
- Outcome research.
- Advanced portfolio optimization.
- Institution/account integrations only where strategically justified.
- Multilingual help content.

## 16. MVP feature priority

### P0: Required for first trustworthy release

- Auth and account security.
- Pakistani, Indian, and Bangladeshi student profile.
- Original-grade storage.
- Scholarship/provider/cycle model.
- University/programme model.
- Source registry.
- Rule engine.
- Explainable eligibility.
- Detailed report.
- Admin review/publish workflow.
- Saves and shortlist.
- Responsive/mobile UX.
- RLS and private storage design.
- Audit logs.
- Rule tests.
- Account deletion.

### P1: Required for execution value

- Application workspaces.
- Tasks and milestones.
- Deadlines.
- Document vault.
- Requirement-document mapping.
- Notifications.
- Recommender tracking.
- Portfolio balancing.

### P2: Growth and monetization

- Funding scenarios.
- Writing workspace.
- Offer comparison.
- Premium exports.
- Change alerts.
- iOS application.

### P3: Later

- Undergraduate-specific product.
- Visa execution.
- Community.
- Institutional accounts.
- Outcome-based models.
- Controlled crawlers.
- Calendar integrations.

## 17. Testing strategy

### Rule tests

- One test per mandatory rule.
- Boundary-value tests.
- Missing-data tests.
- Contradiction tests.
- Cycle-change regression tests.
- Country-specific qualification tests.

### Database tests

- RLS isolation.
- Admin permissions.
- Immutability/history.
- Cascade behavior.
- Storage ownership.

### Product tests

- Mobile widths.
- Keyboard navigation.
- Screen readers.
- Slow networks.
- Interrupted onboarding.
- Deadline time zones.
- Upload failures.
- Report change behavior.

### Data quality tests

- Missing source.
- Stale verification.
- Invalid deadline.
- Currency without effective date.
- Contradictory nationality rules.
- Scholarship without cycle.
- Programme without application channel.

## 18. Success metrics

### Trust

- Percentage of published rules with primary sources.
- Percentage of opportunities verified within policy.
- Correction rate.
- Median correction time.
- Student source-click rate.

### Student value

- Profile completion rate.
- Report-to-shortlist conversion.
- Shortlist-to-workspace conversion.
- Requirement completion.
- On-time submission.
- Deadline-miss rate.
- Weekly active applicants.

### Business

- Free-to-paid conversion.
- Paid retention during active cycles.
- Revenue per active applicant.
- Support cost per active applicant.

### Guardrail metrics

- False-eligible reports found during review.
- Eligibility changes caused by stale data.
- Security incidents.
- Student complaints about misleading certainty.
- Sponsored-ranking violations.

## 19. Monetization recommendation

Start with a freemium student subscription.

### Free trust layer

- Public verified catalogue.
- Source access.
- Basic profile.
- Basic eligibility explanation.
- Limited shortlist.

### Paid execution layer

- Complete pathway report.
- Unlimited opportunities and applications.
- Advanced tasks and deadlines.
- Document matrix.
- Funding scenarios.
- Change notifications.
- Exports.

Do not start with university commissions. Even if introduced later, commercial relationships must not influence eligibility or organic priority.

## 20. Major risks and mitigations

### Risk: Stale scholarship data

Mitigation:

- Scholarship cycles.
- Verification schedules.
- Expiry.
- Source-change queue.
- Visible last-checked information.

### Risk: False eligibility

Mitigation:

- Atomic rules.
- Unknown state.
- No default passing values.
- Rule tests.
- Source evidence.
- Second review for high-impact rules.

### Risk: Scope explosion

Mitigation:

- Master’s-first.
- Limited destinations.
- Scholarship and admission execution only.
- Visa, jobs, community, and counselling excluded initially.

### Risk: Students expect guarantees

Mitigation:

- Clear terminology.
- No acceptance probability.
- Explain provider discretion.
- Separate eligibility from competitiveness.

### Risk: Sensitive documents

Mitigation:

- Private buckets.
- RLS.
- Signed URLs.
- Minimal retention.
- Access logs.
- Deletion.

### Risk: Founder/admin security shortcuts

Mitigation:

- Database-managed roles.
- MFA.
- Least privilege.
- No email-based auto-promotion.
- Full admin audit.

### Risk: Data team becomes bottleneck

Mitigation:

- Typed templates.
- Reusable rule families.
- Review queues.
- Data-quality dashboards.
- Start with high-value opportunities, not maximum volume.

### Risk: iOS duplicates business logic

Mitigation:

- Server-authoritative rules.
- Versioned APIs.
- Shared database.
- Native presentation only.

## 21. Concept reuse from the previous application

### Concepts worth retaining

- Progressive assessment.
- Scholarship discovery layout.
- Comparison concept.
- Requirements report.
- Application journey.
- Tasks and milestones.
- Document vault.
- Admin content areas.
- Notification concept.

### Concepts to redesign

- Mobility DNA becomes student readiness.
- AI match becomes deterministic eligibility plus priority.
- Country recommendation becomes pathway planning.
- Generic CMS becomes source and verification operations.
- Journey progress becomes application-specific execution.
- AI document generation becomes an authentic writing workspace.

### Concepts to reject

- Fake acceptance probabilities.
- “Easy Win” labels.
- Missing-data defaults.
- Static seed data as truth.
- Demo profile fallbacks in real reports.
- Counsellor marketplace.
- Jobs, PR, and broad immigration scope.
- Hardcoded founder administration.
- Client-supplied authoritative scholarship snapshots.

## 22. Immediate implementation sequence

1. Approve the product scope and non-goals.
2. Define the scholarship and cycle data dictionary.
3. Define the source-verification policy.
4. Define the eligibility rule grammar.
5. Design the Supabase schema and RLS matrix.
6. Select 10 representative scholarships covering different workflow types.
7. Encode their sources, rules, funding, documents, and deadlines.
8. Build the student profile required for those 10 scholarships.
9. Build the rule test console.
10. Build the detailed report.
11. Validate results manually against sample profiles.
12. Build discovery and shortlist.
13. Add application execution.

## 23. Decisions requiring founder approval

- Product name.
- Whether the first release supports master’s only or master’s plus limited PhD.
- First destination-country order.
- Initial scholarship set.
- Free versus paid report boundaries.
- Whether research staff will be hired or the founder will operate the initial data pipeline.
- Whether the first mobile app will be native SwiftUI or a later cross-platform decision. Native SwiftUI is recommended if iOS quality is the priority.
- Whether university commercial partnerships are prohibited permanently or allowed with strict separation and disclosure.

## 24. Final recommendation

The product should not attempt to become the largest scholarship database. It should become the most reliable execution system for a defined student population.

Winning means:

- Better input for Pakistani, Indian, and Bangladeshi students.
- Better source operations.
- Better eligibility explanations.
- Better pathway reporting.
- Better application execution.
- Better mobile UX.
- Fewer misleading claims.

The correct first technical milestone is not a beautiful discovery page. It is a working chain from official source, to normalized rule, to student fact, to tested eligibility result, to transparent action.

## 25. Authoritative research links

### Scholarship programmes and funding

- [Chevening eligibility](https://www.chevening.org/resource-hub/guidance/eligibility/)
- [Commonwealth Master’s Scholarships](https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/)
- [Commonwealth scholarship country search](https://cscuk.fcdo.gov.uk/scholarships-filter-search/)
- [Erasmus Mundus Joint Masters](https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters)
- [DAAD scholarship database](https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/)
- [USEFP Pakistan](https://www.usefp.org/)
- [Fulbright-Nehru Master’s Fellowships](https://www.usief.org.in/fulbright-fellowships/fellowships-for-indian-citizen/fulbright-nehru-masters-fellowships/)

### Admissions and qualification context

- [EducationUSA five-step process](https://educationusa.state.gov/your-5-steps-us-study)
- [EducationUSA graduate applications](https://educationusa.state.gov/complete-your-us-application-graduate)
- [EducationUSA graduate finance](https://educationusa.state.gov/your-5-steps-us-study/finance-your-studies/graduate)
- [UCAS international guidance](https://www.ucas.com/international)
- [Pakistan HEC degree attestation](https://www.hec.gov.pk/english/services/students/das/Pages/Degree-Attestation.aspx)
- [UK ENIC Statement of Comparability](https://www.enic.org.uk/individuals/statement-of-comparability)

### Technical and iOS

- [Supabase Row Level Security](https://supabase.com/features/row-level-security)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Swift authentication](https://supabase.com/docs/reference/swift/auth-api)
- [Supabase native mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app)

### Competitor references

- [Yocket](https://yocket.com/)
- [LeapScholar](https://leapscholar.com/home)
- [ApplyBoard](https://www.applyboard.com/)
- [ScholarshipOwl](https://scholarshipowl.com/)
