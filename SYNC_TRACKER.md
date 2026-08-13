# ScholarPath — Backend ↔ Frontend Sync Tracker

**Backend Agent**: Antigravity (Google DeepMind)
**Frontend Agent**: Codex
**Last Updated**: 8 August 2026, Codex UI pass

---

# 🔴 CRITICAL ISSUES (Blocks MVP)

## CRITICAL-1: Nationality worldwide ✅ BACKEND DONE

**Area**: Student Onboarding
**What was wrong**: System only accepted Pakistan/India/Bangladesh across 9 layers

| Task | Owner | Status | File / Detail |
|---|---|---|---|
| DB: `profile_country` enum → `text` | Backend | ✅ Done | Migration 018 |
| DB: `submit_assessment()` cast removed | Backend | ✅ Done | Migration 018 |
| Types: `originOptions` (50 countries) | Backend | ✅ Done | `types.ts` |
| Types: `OriginCountry` → `string` | Backend | ✅ Done | `types.ts` |
| Types: `qualificationOptions` + `_default` | Backend | ✅ Done | `types.ts` — 6 generic worldwide qualifications |
| Types: `residenceOptions` (30 countries) | Backend | ✅ Done | `types.ts` |
| Types: `budgetCurrency` (20 currencies) | Backend | ✅ Done | `types.ts` |
| Zod: nationality → `z.string()` | Backend | ✅ Done | `schema.ts` |
| Zod: currentCountry → `z.string()` | Backend | ✅ Done | `schema.ts` |
| Zod: budgetCurrency → 20 options | Backend | ✅ Done | `schema.ts` |
| Zod: qualification fallback to `_default` | Backend | ✅ Done | `schema.ts` |
| **Onboarding Step 1**: Replace 3 flag buttons → searchable country picker | **Codex** | ✅ Code complete | Uses `originOptions`; searchable selected-state picker. |
| **Onboarding Step 2**: Expanded residence dropdown | **Codex** | ✅ Code complete | Uses `residenceOptions` (30 countries). |
| **Onboarding Step 3**: Qualification with fallback | **Codex** | ✅ Code complete | Uses `qualificationOptions[nationality] ?? qualificationOptions._default`. |
| **Onboarding Step 10**: 20 currencies in selector | **Codex** | ✅ Code complete | Uses all supported `budgetCurrency` values. |
| **Ad carousel**: "South Asian Focus" slide | **Codex** | ✅ Code complete | Replaced with worldwide coverage language. |

---

## CRITICAL-2: Destination preference worldwide ✅ BACKEND DONE

**Area**: Student Onboarding + Recommendations

| Task | Owner | Status | File / Detail |
|---|---|---|---|
| Zod: 12 destinations in schema | Backend | ✅ Done | `schema.ts` — suggest/World/UK/Germany/Europe/US/Canada/Australia/Japan/Korea/Singapore/Malaysia |
| Recommendation engine: scores all destinations | Backend | ✅ Done | `engine.ts` — Sprint 8 |
| **Onboarding Step 8**: Show all 12 destinations | **Codex** | ✅ Code complete | Grouped Smart start, Europe, Americas and Asia-Pacific grid. |

---

## CRITICAL-3: Dynamic worldwide pathways ✅ BACKEND DONE

**Area**: Student Report Page

| Task | Owner | Status | File / Detail |
|---|---|---|---|
| Engine: 10 pathway definitions | Backend | ✅ Done | `engine.ts` — UK/DE/Erasmus/US/CA/AU/JP/KR/SG/MY |
| Engine: `buildPathways()` dynamic | Backend | ✅ Done | Generates 3 lanes based on preference + profile |
| Engine: smart defaults for suggest/World | Backend | ✅ Done | full funding → US/Erasmus/DE, partial → UK/AU/CA |
| Types: `PathwayLane.id` → `string` | Backend | ✅ Done | `types.ts` |
| **Report page**: Render dynamic pathways | **Codex** | ✅ Code complete | No hard-coded UK/Germany/Erasmus ID checks in report rendering. |

---

## CRITICAL-4: Detailed Recommendations API + Page ✅ BACKEND DONE

**Area**: Student Recommendations

| Task | Owner | Status | File / Detail |
|---|---|---|---|
| API: `GET /api/recommendations/detailed` | Backend | ✅ Done | `src/app/api/recommendations/detailed/route.ts` |
| Response shape documented | Backend | ✅ Done | See below |
| **Build `/recommendations` page** | **Codex** | ✅ Code complete | Calls `GET /api/recommendations/detailed`; renders score rings, component breakdown, state grouping, failed gates and next actions. Signed-in live-data proof remains. |
| **Nav sidebar**: Add Recommendations link | **Codex** | ✅ Code complete | Added after Discover; route is private student content. |

**API Response Shape** (`GET /api/recommendations/detailed`):
```json
{
  "run": { "id": "uuid", "engine_version": "v1", "generated_at": "ISO", "catalogue_version": "v1" },
  "profile": { "nationality": "...", "fieldFamily": "...", "fundingNeed": "...", ... },
  "summary": { "totalEvaluated": 12, "confirmed": 3, "conditional": 5, "failed": 2, "averageScore": 67.4 },
  "results": [
    {
      "entity_type": "scholarship",
      "entity_id": "uuid",
      "title": "Chevening Scholarship 2027-28",
      "provider": "FCDO",
      "country_code": "GB",
      "state": "confirmed",
      "final_score": 82.5,
      "score_components": { "eligibility": 30, "fit": 16, "funding": 10, ... },
      "reasons": ["Nationality eligible", "Field aligned"],
      "failed_gates": [],
      "open_checks": ["Upload English score"],
      "next_actions": ["Verify 2-year work experience"],
      "deadline_at": "2027-01-15T00:00:00Z",
      "application_url": "https://..."
    }
  ]
}
```

---

## CRITICAL-5: Dynamic intake options ✅ BACKEND DONE

**Area**: Student Onboarding

| Task | Owner | Status | File / Detail |
|---|---|---|---|
| Types: `intakeOptions` dynamic generator | Backend | ✅ Done | `types.ts` — auto-computes from current year |
| Zod: intake → `z.string()` | Backend | ✅ Done | `schema.ts` |
| **Onboarding Step 7**: Use dynamic options | **Codex** | ✅ Code complete | Existing UI renders dynamic `intakeOptions`; verified during type/build check. |

---

# 🟡 HIGH ISSUES

## HIGH-6: No way to retake/update assessment

**Area**: Student Profile

| Task | Owner | Status | Detail |
|---|---|---|---|
| API: `POST /api/assessment` already supports re-submission | Backend | ✅ Already works | `submit_assessment()` creates new version, supersedes previous |
| **"Update profile" button on `/profile` page** | **Codex** | ✅ Code complete | “Update pathway” opens the assessment in update mode. |
| **Pre-fill onboarding from existing assessment** | **Codex** | ✅ Code complete | Update mode loads the authenticated user’s latest assessment answers from the workspace contract. |
| **Re-run recommendations after update** | **Codex** | ✅ Code complete | Assessment submission already persists a fresh assessment and invokes catalogue evaluation/recommendation generation. |

---

## HIGH-7: No notification system ✅ BACKEND DONE

**Area**: Student Dashboard

| Task | Owner | Status | Detail |
|---|---|---|---|
| DB: notifications table | Backend | ✅ Done | Table already existed. Added unique index on `(user_id, event_key)` for deduplication |
| API: `GET /api/notifications` | Backend | ✅ Done | Returns `{ notifications[], unread_count }`. Params: `unread_only`, `limit`, `offset` |
| API: `PATCH /api/notifications` | Backend | ✅ Done | Body: `{ ids: string[] }` or `{ all: true }` to mark as read |
| Trigger: scholarship publish → notify matching users | Backend | ✅ Done | Migration 019. DB trigger fires on `scholarships.state = 'published'` |
| Trigger: programme publish → notify matching users | Backend | ✅ Done | Migration 019. Same for programmes table |
| `create_notification()` reusable helper | Backend | ✅ Done | PL/pgSQL function — Resend hook point. High/critical priority → outbox event for email |
| Outbox event for Resend email | Backend | ✅ Done | `notification.email_requested` event in outbox. Just connect Resend consumer later |
| **Notifications page UI** | **Codex** | ✅ Code complete | Calls `GET /api/notifications`; shows category/state and marks items read. Signed-in acceptance proof remains. |
| **Bell badge: unread count** | **Codex** | ✅ Code complete | Calls the unread-count endpoint for authenticated students. |

---

## HIGH-8: Portfolio grouping is hard-coded

**Area**: Student Portfolio

| Task | Owner | Status | Detail |
|---|---|---|---|
| Backend data already available | Backend | ✅ Done | `recommendation_components` has `state` and `score_components` |
| **Dynamic portfolio groups** | **Codex** | ⬜ TODO | Replace hard-coded "Realistic/Funding-first/Needs research" with groups computed from recommendation `state`: Confirmed → "Strong fit", Conditional → "Needs evidence", Failed → "Not eligible". Use `score_components.funding` to identify funding-first items |

---

## HIGH-9: Today dashboard metrics connected

**Area**: Student Dashboard

| Task | Owner | Status | Detail |
|---|---|---|---|
| Backend data already available | Backend | ✅ Done | Assessment `readiness` dimensions and recommendation results are stored |
| **Evidence coverage**: pull from assessment readiness | **Codex** | ✅ Done | Uses the current pathway report evidence dimension; verified in the live Today screen. |
| **Application/pathway readiness** | **Codex** | ✅ Done | Uses the average of the current report readiness dimensions; no hard-coded percentage remains. |
| **Profile alignment bars**: pull from readiness | **Codex** | ✅ Done | Academic, language, funding and evidence bars use the current report readiness scores. |
| **Priority move**: pull from action plan | **Codex** | ✅ Done | Uses the first current report action instead of the former hard-coded mathematics task. |

---

## HIGH-10: Live discovery "Deadline unverified" mixed with real data

**Area**: Student Discover Page

| Task | Owner | Status | Detail |
|---|---|---|---|
| Backend: WorqNow API doesn't provide deadlines | Backend | ⬜ N/A | Can't fix — external API limitation |
| **Separate discovery leads from catalogue** | **Codex** | ⬜ TODO | In Discover page, show two sections: "Verified catalogue" (items with `freshness === "Verified"` or from catalogue API) at top, then "Live discovery leads" section below with a disclaimer badge. Currently they're mixed in one grid |
| **Discovery card visual distinction** | **Codex** | ⬜ TODO | Add a "Discovery lead" badge/ribbon to cards from WorqNow. Use `item.deadlineNote` containing "Live discovery lead" to detect |

---

# 🟢 MEDIUM ISSUES

## MEDIUM-11: GPA normalization ✅ BACKEND DONE

**Area**: Recommendation Engine (Backend)

| Task | Owner | Status | Detail |
|---|---|---|---|
| DB: `grade_systems` lookup table | Backend | ✅ Done | Migration 020. 13 education systems (PK, IN, BD, UK, US, DE, CN, JP, KR, AU, TR + percentile variants) |
| Engine: `normalizeGrade()` function | Backend | ✅ Done | Scale-aware conversion: GPA/4→percentile, CGPA/10→percentile, German inverted scale, etc. |
| Integrated into recommendation scoring | Backend | ✅ Done | Replaces raw `gradeValue / gradeMaximum * 100` with education-system-aware normalization |
| **No frontend task** | — | — | Pure backend engine improvement |

---

## MEDIUM-12: Institution autocomplete ✅ BACKEND DONE

**Area**: Student Onboarding Step 4

| Task | Owner | Status | Detail |
|---|---|---|---|
| API: `GET /api/institutions/search?q=&country=&limit=` | Backend | ✅ Done | Fuzzy ilike search on `official_name` and `short_name`. Returns `{ results: [{ id, slug, official_name, short_name, country_code, institution_type }] }` |
| **Typeahead in onboarding Step 4** | **Codex** | ✅ Code complete | Debounced autocomplete calls `/api/institutions/search` with country context and stores `official_name`. |

---

## MEDIUM-13: Persistent draft save ✅ BACKEND DONE

**Area**: Student Onboarding

| Task | Owner | Status | Detail |
|---|---|---|---|
| API: `GET /api/assessment/draft` | Backend | ✅ Done | Returns `{ draft: {...partial answers} }` or `{ draft: null }` for authenticated users |
| API: `PUT /api/assessment/draft` | Backend | ✅ Done | Saves partial answers as `status='draft'` in assessments table |
| **Draft save indicator** | **Codex** | ⬜ TODO | For authenticated users: auto-save draft on each step change via `PUT /api/assessment/draft`. On return visit, call `GET /api/assessment/draft` to restore. Show "Draft saved to account" indicator. For unauthenticated: keep localStorage approach |

---

## MEDIUM-14: Application tracking ✅ BACKEND DONE

**Area**: Student Applications Page

| Task | Owner | Status | Detail |
|---|---|---|---|
| API: `GET /api/applications` | Backend | ✅ Done | Lists user's applications with requirement summary |
| API: `POST /api/applications` | Backend | ✅ Done | Create application. Body: `{ title, provider_name, programme_id?, scholarship_id?, deadline_at?, official_portal_url? }` |
| API: `GET /api/applications/[id]` | Backend | ✅ Done | Returns full application + requirements array |
| API: `PATCH /api/applications/[id]` | Backend | ✅ Done | Update state, deadline, submitted_at, etc. |
| API: `DELETE /api/applications/[id]` | Backend | ✅ Done | Soft delete application |
| API: `GET /api/applications/[id]/readiness` | Backend | ✅ Already existed | Readiness check for application |
| **Applications page: connect to live data** | **Codex** | ⬜ TODO | Replace demo `applications` import with `fetch('/api/applications')`. Use `application.state` for status badges. Show requirements checklist from `GET /api/applications/[id]` |
| **"Start application" from Discover/Portfolio** | **Codex** | ⬜ TODO | Add button on opportunity cards. On click: `POST /api/applications` with `{ title, provider_name, programme_id or scholarship_id }` |

---

## MEDIUM-15: Country/Institution pages linked to recommendations ✅ BACKEND DONE

**Area**: Student Countries + Institutions Pages

| Task | Owner | Status | Detail |
|---|---|---|---|
| API: `/api/catalogue?country=GB` filter | Backend | ✅ Already existed | Catalogue API already accepts `?country=GB` param |
| API: `/api/institutions/search?country=GB` | Backend | ✅ Done | Institution search accepts `?country=` param |
| **Country detail: "Matching scholarships" section** | **Codex** | ⬜ TODO | Call `GET /api/catalogue?country={countryCode}`. Show matching scholarships/programmes on country page |
| **Institution detail: "Available programmes" section** | **Codex** | ⬜ TODO | Call `GET /api/catalogue?q={institution_name}`. Show matching programmes on institution page |

---

# 📋 CODEX TASK SUMMARY (ALL BACKEND DONE ✅)

> **Every backend API, migration, trigger, and engine update is complete.**
> **All Codex tasks below are unblocked and ready for implementation.**

## 🔴 Critical (Onboarding + Core Pages)

| Issue # | Page | Task | API / Data Source |
|---|---|---|---|
| 1 | Onboarding Step 1 | Searchable country picker | `originOptions` from `types.ts` (50 countries) |
| 1 | Onboarding Step 2 | Expanded residence dropdown | `residenceOptions` from `types.ts` (30 countries) |
| 1 | Onboarding Step 3 | Qualification with `_default` fallback | `qualificationOptions[nationality] ?? qualificationOptions._default` |
| 1 | Onboarding Step 10 | 20 currencies in selector | `budgetCurrency` type from `types.ts` |
| 1 | Onboarding carousel | "South Asian Focus" → "Worldwide Coverage" | Text change only |
| 2 | Onboarding Step 8 | 12 destination options (grouped by region) | `destinationPreference` type from `types.ts` |
| 3 | Report page | Handle any `PathwayLane.id` string | No hard-coded uk/germany/erasmus checks |
| 4 | NEW `/recommendations` | Build recommendations page with scoring UI | `GET /api/recommendations/detailed` |
| 4 | Nav sidebar | Add "Recommendations" link | `{ href: "/recommendations", label: "Recommendations", icon: Sparkles }` |
| 5 | Onboarding Step 7 | Verify dynamic `intakeOptions` renders | `intakeOptions` from `types.ts` (auto-computed) |

## 🟡 High (Dashboard + Discovery)

| Issue # | Page | Task | API / Data Source |
|---|---|---|---|
| 6 | Profile page | "Retake assessment" button + pre-fill | `GET /api/assessment/draft` to load, navigate to onboarding |
| 7 | Notifications page | Render notification list, mark read on click | `GET /api/notifications`, `PATCH /api/notifications` |
| 7 | Bell icon (all pages) | Unread badge count | `GET /api/notifications?unread_only=true&limit=1` → `unread_count` |
| 8 | Portfolio page | Dynamic groups from recommendation state | `recommendation_components.state` + `score_components` |
| 9 | Today dashboard | Real readiness scores | `handoff.report.readiness` dimensions |
| 9 | Today dashboard | Real priority move | `GET /api/tasks` → first incomplete task |
| 10 | Discover page | Separate discovery leads from verified catalogue | Check `item.deadlineNote` for "Live discovery lead" |

## 🟢 Medium (Polish)

| Issue # | Page | Task | API / Data Source |
|---|---|---|---|
| 12 | Onboarding Step 4 | Institution typeahead autocomplete | `GET /api/institutions/search?q={input}&limit=8` |
| 13 | Onboarding | Auto-save draft for authenticated users | `PUT /api/assessment/draft`, `GET /api/assessment/draft` |
| 14 | Applications page | Connect to live data, replace demo import | `GET/POST/PATCH/DELETE /api/applications` |
| 14 | Discover/Portfolio | "Start application" button | `POST /api/applications { title, provider_name, programme_id }` |
| 15 | Country pages | "Matching scholarships" section | `GET /api/catalogue?country={code}` |
| 15 | Institution pages | "Available programmes" section | `GET /api/catalogue?q={name}` |

---

# Codex UI delivery — 8 August 2026

This update overrides earlier `TODO` labels for the rows below. “Code complete” means the route is implemented and the project typecheck/production build pass; “acceptance pending” means it still needs a signed-in browser journey with real Supabase records.

| Area | Result | Status | Evidence / remaining proof |
|---|---|---|---|
| Onboarding Step 1 | Searchable worldwide citizenship picker with selected state and automatic matching local currency | Code complete | `assessment-experience.tsx`; responsive UI follows search-first, selection-visible pattern. |
| Onboarding Step 2 | Residence uses expanded `residenceOptions` | Code complete | Existing dynamic list verified in source. |
| Onboarding Step 3 | Qualification uses `qualificationOptions[nationality] ?? qualificationOptions._default` | Code complete | No three-country restriction remains in the UI. |
| Onboarding Step 4 | Institution typeahead queries `/api/institutions/search` with country context | Code complete | Needs signed-in/real-directory browser proof. |
| Onboarding Step 7 | Intake options use dynamic `intakeOptions` | Code complete | Existing dynamic generator verified. |
| Onboarding Step 8 | All 12 destinations grouped by Smart start, Europe, Americas and Asia-Pacific | Code complete | Needs founder UX acceptance. |
| Onboarding Step 10 | All 20 backend-supported currencies available | Code complete | Existing backend validation remains source of truth. |
| Onboarding promo | Regional-only carousel wording replaced with worldwide coverage language | Code complete | Copy only. |
| Student report | Pathway cards use arbitrary `PathwayLane.id` values; no country-ID branching found | Code complete | Needs real US/JP/SG pathway acceptance proof. |
| `/recommendations` | New authenticated page: average score, state groups, score components, reasons, unresolved gates, tasks and official links | Code complete | Fetches `GET /api/recommendations/detailed`; needs a signed-in student with published opportunities to verify live results. |
| Student navigation | Recommendations added immediately after Discover and protected as private student content | Code complete | Route + access guard added. |

## Still assigned to Codex — not started

| Priority | Task | Backend ready | Why it remains open |
|---|---|---|---|
| High | Profile retake, assessment prefill and re-run recommendation action | Yes — code complete | Update mode loads the latest assessment and the existing submit flow persists and re-evaluates recommendations; needs signed-in acceptance proof. |
| High | Notifications list, mark-as-read and header unread badge | Yes — code complete | Live list, category filters, mark-read action and header count now call the notification API; needs signed-in acceptance proof. |
| High | Portfolio grouping from recommendation state | Yes | Must replace existing demo groups without mixing datasets. |
| High | Today dashboard live readiness and next task | Yes | Must replace hard-coded metrics with assessment/task API values. |
| High | Discover separation: verified catalogue vs discovery leads | Yes | Requires clear source/freshness treatment in existing cards. |
| Medium | Persistent authenticated onboarding drafts | Yes | Needs UI save-state and restore acceptance. |
| Medium | Live applications and start-application actions | Yes | Existing demo application experience must be replaced end-to-end. |
| Medium | Country/institution opportunity sections | Yes | Needs catalogue API integration and empty/freshness states. |

## Verification this pass

- `npm run typecheck` passed.
- `npm run build` passed.
- Cross-check completed: each `✅ Code complete` Codex row has a corresponding rendered component, route or API integration in the worktree.
- Local development server restarted successfully at `http://localhost:3000` (HTTP 200).
- Mobbin study applied: searchable selected-state input patterns and action-led explainable result cards.
- Signed-in student acceptance is still required for live Supabase result, notification and reassessment proof; those modules remain `Partial` in the team tracker until tested with real data.

## Codex UI correction pass — 9 August 2026

| Surface | Status | Delivered evidence | Still open |
|---|---|---|---|
| Authentication | Code complete; live provider acceptance pending | Autoplay three-slide product story, Google OAuth action, Terms/Privacy links, and one accessible focus ring. Browser-verified on `/auth`. | Enable/confirm Google provider and redirect URLs in Supabase, then complete real OAuth acceptance. |
| Discover | Code complete; catalogue coverage partial | Shorter page intro and compact cards with real flag images plus country names; duplicate no-op verification block removed. Browser-verified with no mojibake. | Scale reviewed catalogue and prove signed-in save/start-application journeys. |
| Country intelligence UI | Code complete; data depth partial | Country-code routes such as `/countries/gb`, flag-image navigation, compact hero copy, four differentiated life-card gradients and invalid epoch-date suppression. | Expand cited city/community/salary facts and opportunity sections. |
| Institution directory UI | Code complete; data depth partial | Corrupt stored flags ignored; official country flag images, country names and gradient card covers render across all 12 current cards. | Scale institution/programme/intake records and add available-programme sections. |

Verification: `npm run typecheck` passed; `npm test` passed (24/24); clean `npm run build` passed with pre-existing warnings only; ScholarPath restarted on `http://localhost:3001` (HTTP 200). Mobbin research informed progressive disclosure, social-login hierarchy and visual destination-card treatment.

### Onboarding completion redirect — 9 August 2026

- Fixed: guest onboarding can now open `/report` using the report already saved in browser session storage.
- Security boundary updated: `/today` and `/recommendations` support the post-onboarding browser-session journey; portfolio mutations, applications, tasks, documents, profile and settings still require authentication.
- Verified: unauthenticated `/report` returns HTTP 200 instead of redirecting to `/auth`; typecheck and 24/24 tests pass.

## Production security and data-truth pass — 9 August 2026

| Area | Status | Verified outcome | Remaining |
|---|---|---|---|
| Demo/fallback APIs | Done | Core data APIs fail closed with 401/503 or return genuine live empty results; no fixture substitution. | Remove prototype-only presentation content in the UI pass. |
| Applications | Code complete | Active page reads authenticated workspace applications and opportunity detail creates a live record. | Detailed requirement actions and card-level shortcut are UI work. |
| Private data isolation | Verified for anonymous role | Profiles, assessments, applications, tasks, documents and notifications reject anonymous reads/inserts with `42501`. | Repeat with two real students. |
| Database RLS | Static verified | All 57 tables created by migrations have RLS enabled. | Run Security Advisor and role-matrix acceptance. |
| Definer lockdown | Live verified | Migration 021 fixes search paths and revokes browser execution; anonymous notification RPC probe returns `42501`. | Record through normal migration workflow on next DB push. |
| API hardening | Code complete | Origin checks, DB rate limits, bounded Zod inputs and generic server errors cover sensitive mutations. | Authenticated IDOR/abuse suite. |
| Dependencies | Done | `npm audit` reports 0 vulnerabilities. | Automate audit in CI. |
| Verification | Done locally | 24/24 tests, typecheck and production build pass. | Vercel smoke test and observability. |

Security note: an untracked migration helper contained a hard-coded Supabase management credential. It was removed; rotate that management token.

## Codex student-first UX pass — 9 August 2026

| Surface | Status | Delivered | Still open |
|---|---|---|---|
| Post-onboarding continuity | Code complete; browser verified | Today and Recommendations no longer navigate to login; guest recommendations reuse the assessment handoff. | Signed-in cross-device acceptance. |
| Pathway report | Code complete; browser verified | New multi-colour hero, Quick view by default, Full evidence toggle, compact readiness and pathway summaries. | Founder mobile acceptance. |
| Discover and match explanation | Code complete; live-data depth partial | Match percentage, readable funding/deadline facts, friendly priority cue, progressive open-check details and compact modal. | Reviewed catalogue breadth. |
| Opportunity detail | Code complete | Gradient hero, real country flag component, humanised funding, match score, pill tabs and action-led overview. | Accept with a currently published live opportunity after catalogue availability is stable. |
| Country and institution UX | Code complete; data depth partial | Dedicated country detail without the global switcher, bounded budget slider, compact clickable institution cards and verification badges. | More current country/institution facts. |
| Funding and tasks | Code complete; live acceptance pending | Drawer spacing corrected; task failure now explains session recovery in student-friendly language. | Diagnose any remaining live task API failure with an authenticated account. |

Verification: lint has no errors; typecheck, 25/25 tests and production build pass. Browser evidence is saved under `output/ux-audit-2026-08-09/`.

## CandidRoute release-flow and platform hardening — 13 August 2026

| Task | Owner | Status | Evidence |
|---|---|---|---|
| Remove Vercel login wall | Codex | Done | Public production auth-status endpoint returns HTTP 200 without Vercel SSO. |
| Assessment → account → saved report | Codex | Code complete | Guest handoff is preserved, auth redirects to `/report`, and the authenticated client replays the validated assessment with a stable idempotency key. |
| Free/Pro access contract | Codex | Code complete + DB live | Free report: readiness, top 3 routes, top 3 gaps, 3 country previews, 3 institution previews and limited PDF. Premium modules read a server-derived entitlement. |
| Subscription entitlement security | Codex | Done | RLS table live; one self-read policy; no client insert/update policy; PDF endpoint checks plan on the server. |
| CandidRoute executable branding | Codex | Done | Runtime source and package identity no longer render ScholarPath. Historical research docs retain old naming for audit history. |
| Supabase migration parity | Codex | Done | 32 local/remote versions, zero mismatches. |
| Supabase advisors | Codex | Verified/partial remediation | Schema lint clean; advisor access works; public execution of internal rule generation revoked. Leaked-password protection and remaining warnings are recorded follow-up. |
| Verification | Codex | Done locally | Typecheck, 25/25 tests and production build pass. |
| GitHub push + Vercel deploy | Codex | In progress | Complete after final diff/security audit. |
