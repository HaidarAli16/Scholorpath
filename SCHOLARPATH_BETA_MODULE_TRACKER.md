# ScholarPath beta readiness

**Target:** Controlled invite-only beta on **14 August 2026**

**Updated:** 7 August 2026 · **7 calendar days remaining**

**Verdict:** Launch is feasible only with a strict beta scope. The product has strong local foundations but is not live-ready until Supabase, Auth and deployment are connected and tested.

**Status rule:** Done = built + connected + tested live. Partial = implementation exists but release proof is missing. Blocked = credentials or external action required.

## Module status

| Module | Status | Beta decision | Missing before beta |
|---|---|---|---|
| M00 Design system and shell | Partial | Ship | Founder sign-off and live desktop/mobile check |
| M01 Account, consent and security | Blocked | Must ship | MCP, project URL and publishable key are connected; server secret, Auth redirects, first admin, recovery, Terms/Privacy pages, versioned consent capture and two-user isolation remain |
| M02 Profile and evidence | Partial | Must ship | Live persistence and signed-in profile completion test |
| M03 Education truth system | Partial | Must ship | Migrations 009–011 are live; independently review 5 more current opportunities |
| M04 Eligibility engine | Partial | Must ship | Production catalogue regression and golden profiles |
| M05 Recommendation engine | Partial | Must ship | Thirty golden profiles, fairness review and live stored runs |
| M06 Discovery and details | Partial | Must ship | Ten live opportunities and production acceptance |
| M07 Portfolio and compare | Partial | Ship basic | Verify live save and comparison persistence |
| M08 Application tracker | Partial | Ship basic | Verify one live application and requirement journey |
| M09 Tasks and deadlines | Partial | Ship basic | Live task generation, movement and deadline test; defer automation |
| M10 Document vault | Partial | Optional | Live private-storage test or disable uploads during beta |
| M11 Notifications/support | Partial | Ship feedback only | Working feedback/support channel; defer email automation |
| M12 Operations/admin | Blocked | Must ship | Production admin, source-review exercise and Supabase advisors |
| M13 Writing/recommenders | Partial | Defer | Move after beta unless needed for one test case |
| M14 Funding/offers | Partial | Defer | Keep read-only planning; defer live offer workflow |
| M15 Shared API/iOS | Partial | Defer | No iOS or `/v1` work before beta |

## Verified position today

- `main` is clean at `331a7e4`; GitHub application and database gates pass.
- 21 unit tests, 9 pgTAP security assertions, 21 API routes and 10 migrations exist.
- Catalogue code has **2 published programmes + 3 published scholarships**; launch target is 10 reviewed opportunities.
- Country data covers 4 countries and 9 cities; directory has 12 institutions but only 4 ranking records.
- Production migrations are verified through 011, including catalogue text normalization.
- Local Supabase URL and publishable key are configured; the server-only secret is still missing.
- No Vercel link, GitHub deployment, repository secrets or `beta` environment exists.
- Live Auth can now be connected locally, but server-authoritative persistence and the signed-in acceptance journey remain blocked by the missing server secret and Auth configuration.

## Eight-day launch plan

| Date | Non-negotiable delivery | Exit test |
|---|---|---|
| 6 Aug | Restore Supabase access; verify production; apply 009–010; configure secrets | Live database and protected preview start |
| 7 Aug | Configure Auth redirects, first admin and roles | Two unrelated students pass isolation checks |
| 8 Aug | Connect profile → eligibility → recommendations | One student receives stored, explainable live results |
| 9 Aug | Add and review opportunities 6–8 | Every published fact has current official evidence |
| 10 Aug | Add and review opportunities 9–10; create 30 golden profiles | Engine regression and subgroup review pass |
| 11 Aug | Verify portfolio → application → tasks | One recommendation becomes a persistent action plan |
| 12 Aug | Mobile/accessibility/error QA; feedback and monitoring | No P0 defect; failures are observable |
| 13 Aug | Freeze release; smoke test; backup/rollback and invitations | Release candidate approved |
| 14 Aug | Invite 5–10 controlled testers | Monitor onboarding, errors and corrections live |

## Immediate blockers

1. Add the Supabase server-only secret securely; never commit or expose it to the browser.
2. Configure Supabase Auth redirects, email delivery, first admin and Vercel environment values.
3. Five more current opportunities need independent review.
4. Thirty golden profiles and one signed-in end-to-end test are missing.
5. A working support/feedback channel and error monitoring are missing.

## Launch boundary

- Invite only 5–10 testers; do not call this a public launch.
- Do not accept sensitive documents unless private storage and signed access pass live tests.
- Clearly label the catalogue as limited and recommendations as explainable research guidance.
- Defer writing, recommenders, offers, iOS, full rankings, semantic search and automated reminders.
- Do not add new features until all five blockers above are closed.
