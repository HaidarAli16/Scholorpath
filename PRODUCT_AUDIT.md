# ScholarPath — End-to-End Product Audit

**Audited**: 8 August 2026
**Updated**: 8 August 2026 (Sprint 9 complete)
**Perspective**: Product Owner + Engineering Lead
**Scope**: Full student journey from landing → onboarding → recommendations → applications

---

## Executive Summary

ScholarPath has a solid technical foundation. **All 5 critical backend issues have been resolved in Sprint 9** — the DB enum restriction is gone, the schema accepts worldwide data, the assessment engine generates dynamic pathways for 10 destinations, and a detailed recommendations API is live. **The remaining work is frontend (Codex)**: updating the onboarding UI to show worldwide options, building a dedicated recommendations page, and connecting dashboard metrics to real data. See `SYNC_TRACKER.md` for the complete task-by-task breakdown with ownership.

**Current state**: 5 Critical backend ✅ → 14 Codex frontend tasks queued. 5 High → 3 need backend, 2 are frontend-only. 5 Medium → all need backend first.

---

## 🔴 CRITICAL: Blocks the MVP

### 1. Nationality is hard-coded to Pakistan/India/Bangladesh everywhere

The backend expansion (Sprint 8) removed restrictions from the live scholarships API and recommendation engine, but the following still enforce PK/IN/BD only:

| Layer | Location | Restriction |
|---|---|---|
| **DB Enum** | `CREATE TYPE profile_country AS ENUM ('Pakistan','India','Bangladesh')` in [001_foundation.sql](file:///c:/Users/haida/Documents/APP/supabase/migrations/202607310001_001_foundation.sql) | `student_profiles.nationality` column uses this enum |
| **Zod Schema** | `nationality: z.enum(["Pakistan","India","Bangladesh"])` in [schema.ts:6](file:///c:/Users/haida/Documents/APP/src/modules/assessment/schema.ts#L6) | API rejects any other nationality |
| **Types** | `originOptions = ["Pakistan","India","Bangladesh"]` in [types.ts:3](file:///c:/Users/haida/Documents/APP/src/modules/assessment/types.ts#L3) | TypeScript blocks other values |
| **Onboarding UI** | Step 1 nationality buttons are only PK/IN/BD in [assessment-experience.tsx](file:///c:/Users/haida/Documents/APP/src/components/assessment/assessment-experience.tsx) | Student can't select any other country |
| **Qualifications** | `qualificationOptions` only maps PK/IN/BD degree systems in [types.ts:17-39](file:///c:/Users/haida/Documents/APP/src/modules/assessment/types.ts#L17-L39) | No degree options for other countries |
| **Currency** | `budgetCurrency: z.enum(["PKR","INR","BDT","USD"])` in [schema.ts:17](file:///c:/Users/haida/Documents/APP/src/modules/assessment/schema.ts#L17) | Missing EUR, GBP, CAD, AUD, JPY, etc. |
| **Residence** | `residenceOptions` is only 8 options (3 South Asian + Gulf + UK + Other) in [types.ts:6-15](file:///c:/Users/haida/Documents/APP/src/modules/assessment/types.ts#L6-L15) | No worldwide residence options |
| **submit_assessment()** | Casts nationality to `profile_country` enum in [004_production_backend.sql:255](file:///c:/Users/haida/Documents/APP/supabase/migrations/202607310004_004_production_backend.sql#L255) | DB write fails for non-PK/IN/BD |
| **equivalencies table** | `origin_country profile_country` column in [007_education_directory.sql:146](file:///c:/Users/haida/Documents/APP/supabase/migrations/202608040007_007_education_directory.sql#L146) | Only stores equivalencies for 3 countries |

> **Impact**: A student from Nigeria, Turkey, or Indonesia literally cannot use ScholarPath. The entire onboarding fails at Step 1.

---

### 2. Destination preference is too limited in onboarding

The Zod schema only allows `["suggest","UK","Germany","Europe"]` for `destinationPreference` ([schema.ts:19](file:///c:/Users/haida/Documents/APP/src/modules/assessment/schema.ts#L19)), but the backend (types.ts, engine, live API) already supports 12 destinations. The onboarding UI only shows 4 choice buttons.

> **Impact**: A student wanting to study in Japan, Korea, US, or Canada can't express this preference during onboarding. They'd have to pick "suggest" and hope for the best.

---

### 3. Pathways only cover UK, Germany, Erasmus

The assessment report generator ([engine.ts:73-154](file:///c:/Users/haida/Documents/APP/src/modules/assessment/engine.ts#L73-L154)) hard-codes exactly 3 pathways:
- `PathwayLane.id: "uk" | "germany" | "erasmus"`

There are no pathways for US, Canada, Australia, Japan, Korea, or any other destination. The intelligence engine similarly only evaluates 4 specific opportunities (Leeds, Saarland, Erasmus DSAI, UK Leadership).

> **Impact**: After completing onboarding, a student interested in the US gets a report saying "United Kingdom is your strongest research lane right now" even if they chose "suggest". The entire assessment report is UK/Germany/EU centric.

---

### 4. No dedicated Recommendations page

The recommendation engine evaluates all published scholarships against the student profile and produces detailed scores with 10 components, reason codes, evidence confidence, and audit traces. But **there is no student-facing page that shows these results**.

- `GET /api/recommendations/latest` is called from `useOpportunities` and mixed into the generic Discover grid
- The Discover page shows a simple "Confirmed match" / "Conditional match" / "Needs verification" badge — that's it
- None of the rich scoring data (eligibility %, funding signal, deadline risk, evidence confidence, specific failed gates) is visible to the student
- The `recommendation_components` table stores `score_components`, `reasons`, `failed_gates`, `open_checks`, `next_actions` — but the student only sees `match` and `condition` strings

> **Impact**: The most valuable part of ScholarPath (personalized recommendations with explainable scoring) is invisible. Students have no idea why one scholarship ranks higher than another, what they need to fix, or how their profile aligns.

---

### 5. Intake options are static and will expire

[types.ts:54-59](file:///c:/Users/haida/Documents/APP/src/modules/assessment/types.ts#L54-L59):
```typescript
export const intakeOptions = [
  "September 2027",
  "January 2028",
  "September 2028",
  "I am flexible",
] as const;
```

These are hard-coded dates. By October 2027, "September 2027" will have passed.

> **Impact**: The app will feel broken/outdated when these dates expire. Needs dynamic generation based on current date.

---

## 🟡 HIGH: Significantly weakens the MVP

### 6. Assessment report is a one-shot — no way to retake or update

Once a student submits the assessment, there's no UI to edit their profile and re-run the assessment. The onboarding flow is a one-way funnel: Landing → Assessment → Report → Dashboard. If a student's English test score changes, or they complete their degree, they can't update their assessment.

> **Fix**: Add a "Retake assessment" or "Update profile" action that pre-fills the form with their existing answers.

---

### 7. No email/notification system for new scholarships

When a new scholarship is published that matches a student's profile, there's no way to notify them. The `Bell` icon in the nav leads to `/notifications` but that page renders an empty state.

> **Fix**: Build a notification system that triggers when new catalogue items match a student's recommendation profile.

---

### 8. Portfolio comparison is static demo data

The Portfolio page groups items into "Realistic", "Funding-first", "Needs research" — but these groupings are hard-coded visual labels, not computed from recommendation data:
```tsx
["Realistic", "Funding-first", "Needs research"].map((group, groupIndex) => (
  portfolioItems.slice(groupIndex === 0 ? 0 : groupIndex + 1, ...)
))
```

> **Fix**: Use recommendation `state` and `score_components.funding` to dynamically group portfolio items.

---

### 9. Today dashboard has hard-coded metrics

The Today page shows:
- "Evidence coverage: 82%" — hard-coded
- "Application readiness: 62%" — hard-coded
- "14 of 17 facts verified" — hard-coded
- Profile alignment bars (Academic: 100%, Subject: 100%, Funding: 62%, Language: 38%) — hard-coded

None of these come from the actual assessment or recommendation data.

> **Fix**: Pull readiness dimensions from the stored assessment report. Calculate evidence coverage from actual uploaded documents vs required documents.

---

### 10. Live discovery items show "Deadline unverified" for everything

Every WorqNow discovery item gets `deadline: "Deadline unverified"` because the external API doesn't provide deadline data. These items appear alongside verified catalogue items with real deadlines, creating a confusing mixed experience.

> **Fix**: Visually separate "Live discovery leads" from "Verified catalogue" in the Discover page with distinct sections and clearer labels.

---

### 11. GPA scale normalization is too simplistic

The engine converts grades with `(gradeValue / gradeMaximum) * 100`. This means:
- 3.4/4.0 GPA = 85% — reasonable
- 7.5/10.0 CGPA = 75% — reasonable  
- 65/100 percentage = 65% — correct

But there's no mapping to scholarship requirements. A GKS scholarship rule says `gradeValue gte 80`, but a Pakistani student with 3.2/4.0 (= 80%) passes while the same 80% on a 100-point scale might mean different things across education systems.

> **Fix**: Add a normalization layer that maps (nationality, gradeScale, gradeValue) → standardized percentile for cross-system comparisons.

---

## 🟢 MEDIUM: Would improve the experience

### 12. No search autocomplete for institutions

Step 4 asks for institution name as a plain text input. There's no autocomplete from the `institutions` table (which has 12+ entries). Students type free-form text like "NUST" or "uni of punjab" with no standardization.

> **Fix**: Add typeahead search against the institutions directory with fuzzy matching.

---

### 13. No "Save draft" on long onboarding flow

The 17-step onboarding has no persistent save. If a student closes their browser at step 12, they start over. The UI shows a "save status indicator" but it only uses `localStorage` (lost on browser clear).

> **Fix**: For authenticated users, persist draft answers to Supabase. For unauthenticated, the localStorage approach is fine but should be more prominent ("Your progress is saved locally").

---

### 14. Application tracking is entirely demo data

The `/applications` page renders from static `applications` imported from [demo-data.ts](file:///c:/Users/haida/Documents/APP/src/modules/product/demo-data.ts). There's no live application tracking even though the DB has `applications` and `application_requirements` tables.

> **Fix**: Connect the applications page to the Supabase `applications` table and let students create/track real applications.

---

### 15. Country and Institution pages exist but aren't linked to recommendations

`/countries` shows the Country Intelligence Center and `/institutions` shows the Institution Directory — both with real Supabase data. But there's no link between "this country has moderate visa difficulty" and "here are scholarships in this country that match your profile".

> **Fix**: Add a "Matching scholarships" section to each country/institution page that filters the recommendation results.

---

## 📋 Full Restriction Map (What must change for worldwide)

| Component | Current State | Worldwide State |
|---|---|---|
| `profile_country` DB enum | PK/IN/BD only | Change to `text` column |
| `student_profiles.nationality` | `profile_country` enum | `text not null` |
| `equivalencies.origin_country` | `profile_country` enum | `text` |
| `assessmentInputSchema.nationality` | `z.enum(3)` | `z.string()` + autocomplete |
| `originOptions` | 3 countries | Remove or make dynamic |
| `residenceOptions` | 8 options | Expanded list or free text |
| `qualificationOptions` | 3 country maps | Generic worldwide qualifications |
| `budgetCurrency` | PKR/INR/BDT/USD | Add EUR/GBP/CAD/AUD/JPY/CNY/KRW/SGD/MYR/TRY... |
| `destinationPreference` schema | 4 options | Match types.ts (12 options) |
| `destinationPreference` UI | 4 buttons | Expandable grid or searchable |
| `PathwayLane.id` | uk/germany/erasmus | Dynamic from countries table |
| `buildPathways()` | 3 hard-coded lanes | Generate from published countries |
| `intelligence` report | 4 hard-coded opportunities | Generate from catalogue |
| `submit_assessment()` SQL | Cast to `profile_country` | Cast to `text` |
| Onboarding Step 1 UI | 3 flag buttons | Country search/select |

---

## 🚀 Recommended MVP Improvement Roadmap

### Phase 1: Worldwide Onboarding (Unblocks all students)
1. Change `profile_country` enum → `text` in DB
2. Open nationality to worldwide country list with search
3. Add generic qualification options (Bachelor's 3yr/4yr, Master's, PhD, Professional)
4. Expand currency options (top 20 world currencies)
5. Expand destination preference to match the backend's 12 options
6. Make intake options dynamic (compute from current date)
7. Generate pathways dynamically from published countries

### Phase 2: Recommendations Experience (Shows value)
8. Build a dedicated `/recommendations` page showing:
   - Overall match score with ring chart
   - Score component breakdown (eligibility, fit, funding, deadline, etc.)
   - Grouped by state: Confirmed → Conditional → Open checks → Failed
   - Failed gates with specific "what to fix" actions
   - Evidence confidence percentage
9. Add "Why this recommendation" expandable on each card
10. Add "Re-run recommendations" button after profile changes

### Phase 3: Live Dashboard (Retention)
11. Replace hard-coded Today metrics with real assessment data
12. Build notification system for new matching scholarships
13. Connect portfolio grouping to recommendation scores
14. Connect application tracking to Supabase tables
15. Link country/institution pages to filtered recommendations

---

## Architecture Health Check

| System | Status | Notes |
|---|---|---|
| Ingestion pipeline | ✅ Healthy | 60 sources, pg_cron scheduler, structured scoring |
| Review/Publish flow | ✅ Healthy | Auto-rules on publish, validation gates |
| Recommendation engine | ✅ Healthy | 10-component scoring, rule evaluation, persistence |
| Assessment engine | ⚠️ Needs update | Hardcoded PK/IN/BD + UK/DE/EU pathways |
| Student onboarding | 🔴 Blocks worldwide | Nationality/qualification/currency restrictions |
| Recommendations UI | 🔴 Missing | No dedicated page, scoring not visible |
| Today dashboard | ⚠️ Demo data | Hard-coded metrics, not connected to backend |
| Portfolio | ⚠️ Partially demo | Grouping logic is static |
| Applications | 🔴 Fully demo | Not connected to Supabase |
| Notifications | 🔴 Not built | Bell icon leads to empty state |
