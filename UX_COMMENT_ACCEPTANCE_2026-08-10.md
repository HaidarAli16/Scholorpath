# ScholarPath UX comment acceptance

Updated: 10 August 2026

All 29 annotated comments are implemented and accepted in the live local product at the target 1294 × 1032 viewport.

| # | Area | Acceptance result | Status |
|---:|---|---|---|
| 1 | Report hero | Today-style multi-colour result hero with primary actions and score ring | Done |
| 2 | Report readiness | Scan-first score cards replace the long text block | Done |
| 3 | Report pathways | Compact comparison cards replace verbose opportunity paragraphs | Done |
| 4 | Report length | Quick view is default; full evidence is optional | Done |
| 5 | Discover sort | Styled single select control with clear label and focus state | Done |
| 6 | Discover filters | Active filters remain visible as removable chips | Done |
| 7 | Verification badge | Badge is aligned in the card header | Done |
| 8 | Funding and deadline | Human-readable labels and dates replace raw values | Done |
| 9 | Discover cards | Student-first hierarchy, clearer spacing, next check and primary action | Done |
| 10 | Match explanation | Compact icon-led modal with profile match percentage | Done |
| 11 | Match percentage | Driven by the deterministic recommendation evaluation | Done |
| 12 | Opportunity hero | Uses the product gradient palette | Done |
| 13 | Opportunity flag | Real flag asset with safe icon fallback | Done |
| 14 | Country identity | Proper flag and country name shown together | Done |
| 15 | Opportunity title | Responsive display size reduced | Done |
| 16 | Funding label | Raw `full_award` is shown as “Full award” | Done |
| 17 | Detail navigation | Tabs are pill controls | Done |
| 18 | Why surfaced | Colour-coded aligned/open-condition cards | Done |
| 19 | Next actions | Short numbered action cards with direct verbs | Done |
| 20 | Country detail | Dedicated country route; no other-country selector on detail | Done |
| 21 | Budget input | Bounded slider prevents arbitrary values | Done |
| 22 | Institution cards | Compact, fully clickable cards with reduced copy | Done |
| 23 | Institution chevrons | Decorative open arrows removed | Done |
| 24 | Verification date | Presented as a compact verification badge | Done |
| 25 | Campus/programmes | Consistent icon-and-count metadata row | Done |
| 26 | Ranking | Compact rank fact only | Done |
| 27 | Equivalence | Compact origin-equivalence state only | Done |
| 28 | Funding drawer | Correct panel width, spacing, grouped content and fixed actions | Done |
| 29 | Task workspace | Ambiguous Supabase joins fixed; live task board loads and duplicate active gaps are reconciled | Done |

## Flow acceptance

- Guest onboarding completes into Report, Today and Recommendations without a login redirect.
- Discover loads 15 live catalogue records; Countries loads 16 records; Institutions loads 12 records.
- Recommendations use the current assessment and show evaluated routes without falling back to login.
- Authenticated Workspace loads 8 active deduplicated tasks with Today, Board, Calendar and All tasks views.
- Funding scenario details open in the corrected drawer layout.

## Evidence

Browser screenshots are stored in `output/ux-comment-acceptance-2026-08-10/`.
