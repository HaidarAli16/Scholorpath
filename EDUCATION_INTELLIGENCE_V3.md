# ScholarPath Education Intelligence V3

## Purpose

ScholarPath converts a validated South Asian student profile into source-aware programme research, evidence gaps, improvement simulations, a balanced portfolio and executable tasks. It does not predict admission, scholarship or visa outcomes.

## Decision pipeline

```text
Validated student facts
  -> normalized academic and readiness signals
  -> evidence claim confidence
  -> programme and scholarship requirements
  -> hard gate / conditional / unknown evaluation
  -> funding, deadline, evidence and source feasibility
  -> research-priority ordering
  -> portfolio role optimization
  -> improvement simulations
  -> evidence-linked tasks and audit trail
```

## Implemented modules

- Profile validation: country-specific qualifications, grade scales, English-score ranges, degree timing and funding consistency.
- Evidence confidence: each claim is `declared`, `verified` or `missing`, with the document needed and downstream decisions affected.
- Requirement engine: evaluates academic, language, funding, experience and evidence requirements independently.
- Hard-gate handling: failed gates block research ranking; missing evidence stays visible as unknown instead of being guessed.
- Recommendation components: academic, language, funding, deadline, evidence and source freshness remain separately inspectable.
- Improvement simulation: shows which routes and readiness dimensions change when evidence improves.
- Portfolio optimizer: preserves preference while adding lower-cost, funding-first and verification-risk lanes.
- Task generation: unresolved high-impact requirements become ordered tasks with evidence requirements.
- Auditability: engine version, source versions, rule outcomes, actual values and expected values are retained.
- Research operations: source capture, atomic facts, independent review, conflicts, freshness and downstream impact are represented in the operations workspace.
- Country feasibility: immigration, proof-of-funds, healthcare, work, post-study, city cost, housing, transport, safety context, climate and community signals are independently sourced and review-dated.
- Institution intelligence: universities, campuses, ranking facts, origin-country equivalencies and document requirements are stored separately from programmes.
- Ranking guardrail: prestige is shown as an optional sourced fact and never overrides eligibility, affordability, evidence, deadline or visa feasibility.

## Data policy

- Official university, government and consortium sources are the truth layer.
- Third-party APIs are discovery feeds only.
- A discovered scholarship cannot become a confirmed match until an official source, current cycle and deadline are attached.
- Academic normalization is only a planning aid.
- Historical recommendation runs remain reproducible through versioned rules and source snapshots.

## Persistence

Migration `202608030005_005_intelligence_engine.sql` adds:

- `intelligence_runs`
- `evidence_claims`
- `requirement_evaluations`
- `improvement_simulations`
- `store_intelligence_report(...)`

All tables use row-level security. Students can read only their records; writes occur through the controlled database function.

Migrations `202608040007_007_education_directory.sql` and `202608040008_008_beta_education_data.sql` add the country, city, institution, campus, ranking, equivalency, requirement and intake truth layers plus the reviewed four-country beta dataset.

## UX research applied

- Compatibility is split into strengths and improvements rather than compressed into a single unexplained score.
- High-impact recommendations show their affected factor and required action.
- Scenario controls and results remain visible together.
- Research review uses an impact-ordered queue with explicit approval state, freshness and audit history.
