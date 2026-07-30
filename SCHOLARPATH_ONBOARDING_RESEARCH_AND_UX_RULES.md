# ScholarPath onboarding research and UX rules

## Product decision

ScholarPath onboarding is a guided profile conversation, not a conventional long form. The first version stays education-only. It gathers enough information to create an explainable pathway, then moves deeper verification and document uploads into the workspace.

The experience must support students without manipulating them. Encouragement can confirm progress, clarity, or effort. It must never imply admission, scholarship, funding, or visa success.

## Research basis

### Mobbin patterns used

- [Uxcel onboarding](https://mobbin.com/flows/452191b8-996a-4e8e-a17b-691e5c04f042): one focused question per screen, a persistent progress indicator, contextual microcopy after selection, and a getting-started checklist after onboarding.
- [Brilliant web setup](https://mobbin.com/flows/b85501ce-9a95-4348-aa9f-60b7ae60516e): value explanation is interleaved with questions so users understand why the profile is useful before account friction.
- [Coursera onboarding](https://mobbin.com/flows/db5898b3-df15-4cce-9532-e9e287058ceb): clear step language, goal-based personalization, and a direct transition into personalized learning content.
- [Brilliant iOS onboarding](https://mobbin.com/flows/20ad012b-2683-4c0c-beb8-8ff62c6f509e): short, responsive guidance changes with each answer and makes a long setup feel conversational.
- [Grammarly option-card screen](https://mobbin.com/screens/965e4e5e-731a-4408-9e18-9ff0df5ae986): large choices, explicit progress, and one obvious next action.
- [Uxcel selected-interest screen](https://mobbin.com/screens/9e7e615a-754a-45a9-af67-1fe7049b87c9): calm selected state plus a warm line of feedback rather than excessive celebration.

### Untitled UI Pro patterns used

Source file: `TfT1yGQcAt412Za4rjzYlB`.

- Inputs follow component `3531:402962`: 14 px labels, 16 px input text, 8 px corners, neutral borders, small shadow, and a visible blue focus state.
- Primary actions follow component `3287:428579`: 48 px family height, 8 px corners, semibold labels, and restrained inner-border depth.
- The page uses the grid-dot background `4933:390017`, softened so it does not compete with the question.
- Supporting labels follow blue badge `1046:5807`: pale blue surface, light blue border, dark blue text.
- Future document collection should follow modal `4057:415422`: focused upload area, progress state, success state, and clear file context.

## Implemented flow

The first profile uses one focused question or tightly related input pair per screen, grouped into five understandable sections. The interface emphasizes the five sections rather than exposing a large total-question count:

1. About you: name, citizenship, and residence are asked separately.
2. Academic record: qualification, academic context, original result, and degree status.
3. Goal and funding: intake, destination flexibility, funding dependency, and available contribution.
4. Evidence: English readiness, experience, research evidence, weekly capacity, and biggest blocker.
5. Review: facts, derived planning signals, conditions, and unknowns.

## Behaviour rules

- Show progress continuously, but describe the current question rather than making the student think about form length.
- Autosave locally and say so quietly.
- Keep Back available and preserve answers.
- Hide dependent fields until relevant.
- Explain why sensitive or consequential information is requested.
- Treat “none yet” as a valid answer and convert it into a task, not a red error.
- Use specific feedback: “Your funding dependency is now separate from admission fit” is better than “Amazing!”
- After two to four questions, show a compact value moment: what the latest answers now allow ScholarPath to do.
- Make the review screen distinguish user facts, derived planning signals, unresolved conditions, and unknowns.
- Ask for account creation only when it protects or synchronizes useful work; do not block the first explanation of value unnecessarily.
- Move detailed document upload and verification into the workspace where students have context for why each item matters.

## Voice system

Good phrases describe real progress:

- “Your academic signal is ready—without pretending it is an official equivalency.”
- “Halfway there. You just made the plan more realistic.”
- “One review left. Your plan can now fit your real week.”

Avoid false certainty or emotional pressure:

- Do not say “You are eligible” until a sourced rule has been evaluated.
- Do not say “You will win a scholarship.”
- Do not use scarcity, shame, streak loss, or celebratory effects to push disclosure.

## Next design pass

- Add searchable country, institution, and qualification selectors with keyboard support.
- Add optional “Why we ask” details for funding, residence, and grading data.
- Add a save-and-return account moment after the first pathway is visible.
- Build the evidence-upload flow from the Untitled UI upload modal states.
- Test completion time, abandonment by question, Back usage, error recovery, and whether students can accurately explain what a planning signal means.

## Student landing workspace

The first fold must answer four questions in this order:

1. Where am I in the process?
2. What are my strongest current fits?
3. Why do they fit, and what remains conditional?
4. What single action improves my options most?

The landing page uses a compact Untitled UI-style dashboard: profile completion, current fits, active applications, and next deadline appear as four metrics; upcoming opportunities use concise rows; the highest-impact action gets one prominent card; and a small fit strip keeps route state visible without explanations taking over the screen. It intentionally avoids a single acceptance-style percentage. Opening a route uses a modal that separates aligned evidence from unresolved conditions.

Mobbin references used for this workspace:

- [Coursera home](https://mobbin.com/screens/5cb6eee8-7490-4661-a3f1-69bf3483825e): continue-first hierarchy and a restrained supporting tracker.
- [Duolingo progress dashboard](https://mobbin.com/screens/0bb5fed7-839b-4978-8c3f-188ce57cf550): one obvious next action plus visible progress context.
- [Monarch recommendations](https://mobbin.com/screens/53631102-dc15-414f-92b8-e6802620d214): recommendations prioritized by the user instead of shown as an undifferentiated feed.
- [Glassdoor match explanation](https://mobbin.com/screens/81c19e3b-788c-44b1-a275-12ab6d39f57d): match reasons and missing qualifications are inspectable.
- [Pin candidate criteria](https://mobbin.com/screens/4822ebff-bc4e-4698-8c00-dd1e1a26af77): visible criteria checks make ranking auditable.

The onboarding helper line is now profile-aware. The preview computes it from local answer rules; the future recommendation service should return the same UI contract: concise insight text, evidence basis, confidence state, and optional next action.
