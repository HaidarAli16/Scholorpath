# ScholarPath UI/UX direction

Decision date: 30 July 2026

## Decision

Build ScholarPath as a **guided decision workspace**, not an LMS, generic admin dashboard, or chatbot wrapper.

Keep VOIT as the component/token foundation and Urbanist as the product typeface, but create ScholarPath-specific layouts. Borrow interaction patterns selectively from UI8 references; do not copy a full kit or its assets.

## Reference verdict

| Reference | Useful for | Do not copy |
| --- | --- | --- |
| [Cursimm](https://ui8.net/yossi-guetta/products/cursimm---education-platform-dashboard-kit) | Desktop information architecture, onboarding choices, readable card/table density | Course marketplace structure and teacher/student LMS language |
| [Tutrio](https://ui8.net/heloxone/products/tutrio--ai-education-app-ui-kit-for-figma) | Mobile onboarding pace, simple cards, bottom navigation | Childlike illustrations and course-learning framing |
| [Zyra](https://ui8.net/ui8/products/zyra--chat-ai-dashboard-ui-kit-coded) | Assistant composer, contextual follow-up controls, organized workspace patterns | Chat as the home screen and purple AI-product styling |
| [Spinex](https://ui8.net/unpixel/products/spinex---ai-dashboard-ui-kit) | Clean prompt/action chips, spacious hierarchy, assistant interaction details | Blank ask-anything experience and generic AI dashboard navigation |
| [CoachAI](https://ui8.net/gendesign-studio/products/coach-ai) | Small examples of encouraging feedback | Neon palette, 3D characters, gamification, and entertainment tone |

No UI8 purchase is required yet. If a reference kit is later needed for production speed, Cursimm is the strongest first candidate for desktop patterns; it still needs substantial ScholarPath adaptation.

## The ScholarPath screen grammar

Every major screen must answer these questions above the fold:

- **Where am I?** Current stage, intake, and destination context.
- **What did the system find?** A direct result, not a generic greeting.
- **Why is this the result?** Evidence-backed reasons and relevant profile facts.
- **What is uncertain or missing?** Unknown data, conditions, blockers, and source freshness.
- **What should I do now?** One dominant next action with expected impact.

### Desktop

- Left navigation: Today, Discover, Portfolio, Applications, Workspace.
- Central canvas: the student's current decision or task.
- Right Path Guide: contextual insight, explanation, evidence, and next action.
- The Path Guide follows the active item; it is not a detached chatbot.

### Mobile and future iOS

- Five-item bottom navigation with a prominent Today state.
- One primary decision/task per screen.
- Path Guide opens as a draggable bottom sheet and preserves the current context.
- Comparison becomes horizontally paged cards or a focused two-item view, never a crushed desktop table.

## Priority screens

### 1. Guided onboarding

- One decision per step with search, chips, pickers, and dropdowns instead of avoidable free text.
- Immediate system response below consequential answers: what changed and why it matters.
- Smart defaults from citizenship, qualification, budget, and intake; all remain editable.
- Progressive questions: only request detail when it can change eligibility, ranking, or the next action.
- A live profile-quality meter distinguishes complete, uncertain, and evidence-backed information.

### 2. Today

- One dominant next action with deadline, reason, time estimate, and impact.
- Small pathway pulse: applications at risk, new verified matches, and recently changed sources.
- Continue cards return the student to the exact unfinished step.
- No vanity charts or large greeting banner.

### 3. Discover and recommendations

- Result cards show match state, funding outlook, deadline readiness, top reasons, missing facts, and verification date.
- Use honest states: Strong fit, Possible with conditions, Needs information, and Not suitable now.
- Sorting explains itself: “Ranked higher because…” rather than displaying an unexplained score.
- Each important claim opens its source, rule, date checked, and affected profile field.

### 4. Opportunity detail

- Sticky decision summary and a single Save/Start action.
- Eligibility, funding, requirements, timeline, documents, and sources are scannable sections.
- “What this means for you” translates published rules into the student's profile context.
- Conflicts and unknowns remain visible instead of being hidden behind optimistic copy.

### 5. Compare

- Compare no more than four opportunities on desktop and two at a time on mobile.
- Pin decisive rows: total funding gap, eligibility conditions, deadlines, required tests, and missing evidence.
- Highlight differences, not identical fields.
- Let the student set personal priorities and recompute the ordering transparently.

### 6. Application workspace

- Timeline and readiness are derived from verified requirements and the student's evidence.
- Tasks include owner, due date, dependency, proof, and completion rule.
- Writing, documents, references, finances, and submission checks are connected to the same application.
- The system explains every blocked or newly reprioritized task.

### 7. Path Guide

- Opens with contextual quick actions such as Explain this match, What is missing?, and Show my next step.
- Answers first from ScholarPath's structured profile, rules, sources, and application state.
- Shows the data used, freshness, uncertainty, and a correction route.
- Conversation history is secondary; the resulting decision or task is written back into the workspace.

## Motion rules

- Use motion to explain state change, hierarchy, progress, or causality; never as decoration.
- Target 160–220 ms for common state changes and 240–320 ms for sheets or major context changes.
- Use directional transitions between onboarding steps so progress has spatial continuity.
- Animate changed recommendation factors once, then settle; never keep scores or cards floating.
- Show immediate pressed/selected feedback, optimistic save state, then Saved or a recoverable error.
- Use skeletons only for real latency and preserve the page structure to prevent layout jumping.
- Do not simulate “AI thinking” for deterministic checks; show the actual check or data phase instead.
- Respect iOS Reduce Motion by replacing movement with short fades and retaining all textual feedback.
- Haptics are reserved for meaningful completion, warning, and selection feedback in the future iOS app.

Apple's guidance supports purposeful, brief, optional motion and feedback that makes status, results, and next actions clear: [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback), and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility/).

## Visual direction

- Urbanist at readable sizes: 16 px default body, 14 px only for metadata, 18–20 px card titles, and 28–36 px page headings.
- Warm off-white canvas, high-contrast ink, restrained VOIT accent, and semantic success/warning/error colors.
- Cards use whitespace and grouping instead of excessive borders.
- Scholarship imagery is optional and never competes with eligibility, cost, or deadline data.
- Icons always have labels in primary navigation and unfamiliar actions.

## Non-negotiable product rule

The system must never make a student ask a blank chatbot to discover what to do. ScholarPath should proactively surface the relevant conclusion, evidence, uncertainty, and next action; the assistant exists to explain or refine that conclusion.

## First design slice

Design and validate this connected flow before expanding other modules:

1. Guided onboarding decision and instant system response.
2. Generated pathway report with evidence and uncertainty.
3. Today dashboard with one dominant next action.
4. Recommendation list and opportunity detail.
5. Contextual Path Guide on desktop and mobile.

This slice tests the product's central promise: structured student data becomes transparent guidance and executable progress.
