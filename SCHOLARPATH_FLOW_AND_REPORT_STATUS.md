# ScholarPath flow and report status

Updated: 9 August 2026

## End-to-end product flow

| # | Flow | Status | Running now | Missing before production confidence |
|---|---|---|---|---|
| 1 | Landing -> guided onboarding | Live | 17-step responsive assessment, validation, autosaved guest draft, contextual guidance and review step. | Mobile founder acceptance and analytics for abandonment by step. |
| 2 | Answers -> normalized profile | Live | Country, qualification, grade scale, funding, English, experience and evidence answers are schema-validated and normalized. | More country-specific qualification mappings and edge-case regression profiles. |
| 3 | Profile -> assessment report | Live | Deterministic assessment engine creates snapshot, readiness, evidence gaps, pathways, actions and an auditable intelligence report. | Broader verified rule/catalogue coverage; the engine cannot compensate for missing source facts. |
| 4 | Assessment -> saved account record | Live for signed-in users | Assessment, profile snapshot, pathway report and generated tasks save atomically in Supabase. Guest users retain the result in the browser session. | Two-student isolation acceptance and production retry/monitoring proof. |
| 5 | Report -> detailed web report | Live | Executive conclusion, decision readiness, programme rules, evidence confidence, simulations, portfolio balance, pathways, funding radar, actions and audit trail. Saved reports can now reopen from Supabase. | Signed-in production-browser acceptance with a real account. |
| 6 | Report -> downloadable PDF | Live | A real server-generated A4 PDF contains the executive snapshot, readiness, evidence gaps, pathways, action plan, safeguards and audit summary. | Optional long-term storage/version list and email delivery are not implemented. |
| 7 | Report -> recommendations | Partial | Hard rules, score components, failed gates, open checks, reasons and next actions are explainable and persisted. | Current reviewed catalogue depth and 30 golden-profile/subgroup regression tests. |
| 8 | Recommendations -> Discover | Partial | Search, filters, verification state, source freshness and opportunity detail are connected to the live catalogue API. | More reviewed programmes/scholarships across priority countries; discovery leads still require official-source adoption. |
| 9 | Discover -> portfolio | Live | Authenticated students can save/remove live programmes and scholarships. | Full multi-device acceptance and empty/error analytics. |
| 10 | Portfolio -> application | Partial | Private application records can be created and linked to official portals. | Programme-specific requirement ingestion, generated readiness snapshots and a fully proven submit lifecycle. |
| 11 | Application gaps -> task system | Live core | Ranked Today view, Kanban, calendar, deadlines, dependencies, evidence checklist, impact and status transitions use the task API. | Notification delivery, dependency edge cases and production acceptance. |
| 12 | Documents and references | Live core | Private uploads use user-scoped storage and signed downloads; confidential reference links have a separate privacy boundary. | Malware scanning, retention policy acceptance and email invitation delivery. |
| 13 | Country intelligence | Partial | Dedicated country routes, visa steps, proof-of-funds, budget conversion, city costs and lifestyle signals are supported. | Complete current facts, cities and immigration-source review across target countries. |
| 14 | Institution directory | Partial | Institutions, campuses, rankings, origin equivalence and requirements have production-ready UI/schema. | Production-scale university/course catalogue, intake availability and verified Pakistan/India/Bangladesh equivalence. |
| 15 | Writing, funding and offers | Partial | Useful workspace UX exists and some records persist. | Remove remaining prototype content and complete application-linked calculations/workflows. |
| 16 | Admin ingestion | Live core | Official sources, scheduled fetches, snapshots, change review, structured scoring, approval and confirmed publishing exist. | More source-specific parsers, operational alerts and worldwide coverage review capacity. |
| 17 | Auth, security and deployment | Partial | Supabase auth, role gates, mutation guards, RLS migrations, zero dependency vulnerabilities and local quality checks are in place. | Security/Performance Advisor review, leaked-password setting, role-matrix test, production Vercel deploy, monitoring and backup/retention review. |

## Student report contract

The user report is generated immediately after the final onboarding review. It must always show:

1. One plain-language conclusion and the highest-impact next action.
2. Profile completeness and evidence confidence, explicitly labelled as preparation signals.
3. Academic, language, funding, evidence and execution readiness.
4. Each researched pathway with why it surfaced and every open condition.
5. Programme-level rule results, source version and evidence confidence when data exists.
6. Missing evidence converted into ordered tasks.
7. Funding and deadline uncertainty kept separate from academic fit.
8. A reproducible audit summary with generation date and engine version.
9. A real PDF download generated from the same report object as the web view.
10. A visible disclaimer that ScholarPath does not predict admission, scholarship or visa outcomes.

## Report UX decisions from Mobbin research

- [Codecademy benchmark report](https://mobbin.com/screens/fc2dd380-28af-4459-95ba-a21396c65286): lead with the result, then show targeted recommendations and allow detailed results to expand.
- [Midjourney personality result](https://mobbin.com/screens/d67edcbf-f204-46e9-816b-3cf245781313): use multiple understandable dimensions instead of hiding the result behind one score.
- [Vanta risk snapshot](https://mobbin.com/screens/6c39c2e4-6df9-487b-b50e-5035d4dbe9d2): make snapshot date and download actions explicit and keep the exported result auditable.
- [Uxcel assessment flow](https://mobbin.com/flows/3bd46208-f782-4338-b6a7-debc1e96cb6a): connect assessment completion directly to personalized recommendations and the next learning/action loop.

## Immediate priorities

1. Publish a sufficient independently reviewed catalogue for real recommendations.
2. Run 30 golden profiles and subgroup checks against the recommendation engine.
3. Complete programme-specific application requirement and readiness generation.
4. Finish signed-in student/admin browser acceptance and Supabase security proof.
5. Deploy to Vercel with monitoring, alerting and recovery procedures.
