---
name: scholarpath-release-manager
description: Audit, plan, implement, verify, and report ScholarPath beta readiness. Use for ScholarPath status, missing work, module completion, release planning, Supabase or Vercel readiness, catalogue coverage, recommendation quality, testing, deployment, or deciding what to build next.
---

# ScholarPath release manager

Use the repository containing `SCHOLARPATH_BETA_MODULE_TRACKER.md`. Treat that file as the single status document.

## Fast workflow

1. Read the tracker first; load older research only when the task requires it.
2. Run `scripts/audit.ps1 -Repo <repository-root>`. Add `-Remote` only when current GitHub state matters.
3. Inspect only files relevant to changed claims.
4. Classify each module:
   - **Done:** implemented, connected, tested, and accepted in the target environment.
   - **Partial:** useful implementation exists but release proof remains.
   - **Blocked:** the next action needs credentials, user authentication, or an external decision.
   - **Not started:** no material implementation exists.
5. Update the tracker whenever evidence changes. Keep each module to one row and each gap specific.
6. Work on the highest release blocker before lower-priority polish.

## Truth rules

- Never call demo or fallback behavior live.
- Never call schema or UI alone complete.
- Treat production Supabase migration state as unknown until verified live.
- Treat catalogue records as launch-ready only when current, official-source-linked, reviewed, and published.
- Keep eligibility deterministic and explanations source-backed; never invent admission, scholarship, or visa probabilities.
- Never expose secrets. Report only whether required variable names exist.
- Require code checks plus a live acceptance journey before declaring beta ready.

## Required release evidence

- GitHub quality gates are green on `main`.
- Supabase migrations are current; Security and Performance Advisors are reviewed.
- RLS passes with two unrelated students and staff roles.
- Vercel production is configured and deployed.
- Auth -> profile -> recommendations -> portfolio -> application -> tasks works live.
- At least 10 current, independently reviewed opportunities exist.
- Thirty golden profiles pass eligibility/ranking regression and subgroup review.
- Email, support, and error monitoring work without leaking student evidence.
- Founder signs off desktop and mobile UX.

Use the 14 August 2026 invite-only beta date unless the user changes it.
