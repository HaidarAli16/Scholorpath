import type { AssessmentInput } from "@/modules/assessment/types";

export type IntelligenceState = "aligned" | "conditional" | "blocked" | "stale";
export type RequirementOutcome = "pass" | "fail" | "unknown" | "conditional";
export type EvidenceConfidence = "verified" | "declared" | "missing";

export interface EvidenceClaim {
  id: string;
  category: "academic" | "language" | "experience" | "research" | "funding";
  label: string;
  state: EvidenceConfidence;
  confidence: number;
  sourceNeeded: string;
  affects: string[];
}

export interface RequirementEvaluation {
  id: string;
  group: "academic" | "language" | "funding" | "experience" | "evidence";
  label: string;
  expected: string;
  actual: string;
  outcome: RequirementOutcome;
  hard: boolean;
  impact: "critical" | "high" | "medium";
  explanation: string;
  evidenceClaimId?: string;
}

export interface IntelligenceOpportunity {
  id: string;
  kind: "programme" | "scholarship";
  title: string;
  provider: string;
  country: string;
  portfolioRole: "preferred" | "lower-cost" | "funding-first" | "verification-backlog";
  state: IntelligenceState;
  researchPriority: number;
  confidence: number;
  components: { academic: number; language: number; funding: number; deadline: number; evidence: number; source: number };
  requirements: RequirementEvaluation[];
  strengths: string[];
  blockers: string[];
  nextActions: string[];
  deadline: string;
  source: { label: string; url: string; state: "verified" | "review_due"; reviewedAt: string; version: string };
}

export interface IntelligenceSimulation {
  id: "english" | "academic-evidence" | "research";
  title: string;
  change: string;
  readinessDelta: number;
  confidenceDelta: number;
  affectedRoutes: string[];
  explanation: string;
  action: string;
}

export interface IntelligenceReport {
  engineVersion: string;
  evaluatedAt: string;
  evidenceConfidence: number;
  evidenceClaims: EvidenceClaim[];
  opportunities: IntelligenceOpportunity[];
  simulations: IntelligenceSimulation[];
  portfolio: {
    balance: "balanced" | "concentrated";
    coverage: number;
    slots: Array<{ role: IntelligenceOpportunity["portfolioRole"]; opportunityId: string; reason: string }>;
    warning?: string;
  };
  audit: {
    evaluatedRules: number;
    passedRules: number;
    failedRules: number;
    unknownRules: number;
    sourceVersions: string[];
    trace: string[];
  };
}

type ModelRequirement = {
  id: string;
  group: RequirementEvaluation["group"];
  label: string;
  expected: string;
  evaluator: "grade70" | "computing" | "english" | "degree_complete" | "academic_docs" | "math_credits" | "ects_mapping" | "research" | "leadership" | "nationality";
  hard: boolean;
  impact: RequirementEvaluation["impact"];
  evidenceClaimId?: string;
};

type OpportunityModel = {
  id: string;
  kind: IntelligenceOpportunity["kind"];
  title: string;
  provider: string;
  country: string;
  role: IntelligenceOpportunity["portfolioRole"];
  deadline: string;
  fundingBase: number;
  source: IntelligenceOpportunity["source"];
  requirements: ModelRequirement[];
};

export const intelligenceEngineVersion = "education-intelligence-3.0.0";

const models: OpportunityModel[] = [
  {
    id: "msc-data-leeds", kind: "programme", title: "MSc Data Science and Analytics", provider: "University of Leeds", country: "United Kingdom", role: "preferred", deadline: "2027-06-30", fundingBase: 28,
    source: { label: "University programme page", url: "https://courses.leeds.ac.uk/", state: "review_due", reviewedAt: "2026-07-25", version: "leeds-dsa-2026.07" },
    requirements: [
      { id: "leeds-grade", group: "academic", label: "Academic result", expected: "Current programme threshold", evaluator: "grade70", hard: true, impact: "critical", evidenceClaimId: "academic-result" },
      { id: "leeds-field", group: "academic", label: "Relevant academic background", expected: "Computing or quantitatively relevant degree", evaluator: "computing", hard: true, impact: "critical", evidenceClaimId: "degree-field" },
      { id: "leeds-maths", group: "academic", label: "Mathematics module coverage", expected: "Programme-specific modules verified from transcript", evaluator: "math_credits", hard: true, impact: "critical", evidenceClaimId: "module-evidence" },
      { id: "leeds-english", group: "language", label: "Accepted English evidence", expected: "Current programme-level test threshold", evaluator: "english", hard: true, impact: "high", evidenceClaimId: "english-score" },
    ],
  },
  {
    id: "msc-ai-saarland", kind: "programme", title: "MSc Artificial Intelligence", provider: "Saarland University", country: "Germany", role: "lower-cost", deadline: "2027-05-15", fundingBase: 76,
    source: { label: "University admissions page", url: "https://www.uni-saarland.de/en/study/programmes/master/artificial-intelligence.html", state: "review_due", reviewedAt: "2026-07-25", version: "saarland-ai-2026.07" },
    requirements: [
      { id: "saar-field", group: "academic", label: "Subject alignment", expected: "Computer-science foundation", evaluator: "computing", hard: true, impact: "critical", evidenceClaimId: "degree-field" },
      { id: "saar-ects", group: "academic", label: "Course and credit mapping", expected: "Official course descriptions and credits", evaluator: "ects_mapping", hard: true, impact: "critical", evidenceClaimId: "module-evidence" },
      { id: "saar-degree", group: "academic", label: "Completed qualifying award", expected: "Final award evidence", evaluator: "degree_complete", hard: true, impact: "high", evidenceClaimId: "degree-award" },
      { id: "saar-language", group: "language", label: "Accepted language evidence", expected: "Current published route-specific evidence", evaluator: "english", hard: false, impact: "high", evidenceClaimId: "english-score" },
    ],
  },
  {
    id: "erasmus-dsai", kind: "scholarship", title: "Erasmus Mundus Data and AI research lane", provider: "Consortium-specific application", country: "Europe", role: "funding-first", deadline: "2027-01-12", fundingBase: 94,
    source: { label: "Erasmus Mundus catalogue and consortium page", url: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters", state: "review_due", reviewedAt: "2026-07-25", version: "erasmus-lane-2026.07" },
    requirements: [
      { id: "erasmus-grade", group: "academic", label: "Academic competitiveness evidence", expected: "Consortium-specific academic threshold", evaluator: "grade70", hard: false, impact: "high", evidenceClaimId: "academic-result" },
      { id: "erasmus-research", group: "evidence", label: "Research or project evidence", expected: "Documented evidence relevant to the selected consortium", evaluator: "research", hard: false, impact: "high", evidenceClaimId: "research-evidence" },
      { id: "erasmus-docs", group: "evidence", label: "Academic evidence pack", expected: "Transcript, award and grading context", evaluator: "academic_docs", hard: true, impact: "critical", evidenceClaimId: "academic-documents" },
    ],
  },
  {
    id: "uk-leadership-award", kind: "scholarship", title: "UK leadership scholarship research lane", provider: "Official award cycle required", country: "United Kingdom", role: "verification-backlog", deadline: "2026-10-06", fundingBase: 96,
    source: { label: "Official scholarship cycle", url: "https://www.chevening.org/scholarships/", state: "review_due", reviewedAt: "2026-07-25", version: "uk-leadership-2026.07" },
    requirements: [
      { id: "uk-award-origin", group: "evidence", label: "Territory and cycle eligibility", expected: "Confirmed on the current official cycle", evaluator: "nationality", hard: true, impact: "critical", evidenceClaimId: "nationality" },
      { id: "uk-award-leadership", group: "experience", label: "Leadership and impact evidence", expected: "Specific, documentable examples", evaluator: "leadership", hard: false, impact: "high", evidenceClaimId: "experience-evidence" },
      { id: "uk-award-docs", group: "evidence", label: "Academic evidence pack", expected: "Verified degree and transcript records", evaluator: "academic_docs", hard: true, impact: "critical", evidenceClaimId: "academic-documents" },
    ],
  },
];

function gradePercent(input: AssessmentInput) { return Math.round((input.gradeValue / input.gradeMaximum) * 100); }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

function buildClaims(input: AssessmentInput): EvidenceClaim[] {
  const researchCount = input.researchEvidence.includes("none") ? 0 : input.researchEvidence.length;
  return [
    { id: "nationality", category: "academic", label: "Nationality", state: "declared", confidence: 55, sourceNeeded: "Passport identity page", affects: ["Scholarship territory rules"] },
    { id: "academic-result", category: "academic", label: "Academic result and grading scale", state: "declared", confidence: 48, sourceNeeded: "Official transcript and grading-scale note", affects: ["Academic thresholds", "Merit funding"] },
    { id: "degree-field", category: "academic", label: "Degree title and field", state: "declared", confidence: 52, sourceNeeded: "Degree certificate and transcript", affects: ["Subject alignment"] },
    { id: "degree-award", category: "academic", label: "Degree completion", state: input.completionStatus === "completed" ? "declared" : "missing", confidence: input.completionStatus === "completed" ? 50 : 18, sourceNeeded: "Final degree certificate or completion letter", affects: ["Final-award requirements"] },
    { id: "module-evidence", category: "academic", label: "Modules, credits and course content", state: "missing", confidence: 8, sourceNeeded: "Transcript plus official course descriptions", affects: ["Mathematics prerequisites", "ECTS mapping"] },
    { id: "academic-documents", category: "academic", label: "Complete academic evidence pack", state: "missing", confidence: 12, sourceNeeded: "Transcript, award and grading context", affects: ["Every programme confirmation"] },
    { id: "english-score", category: "language", label: "English-test result", state: input.englishStatus === "completed" ? "declared" : "missing", confidence: input.englishStatus === "completed" ? 52 : 10, sourceNeeded: "Official score report", affects: ["Language gates", "Deadline feasibility"] },
    { id: "research-evidence", category: "research", label: "Research and project evidence", state: researchCount ? "declared" : "missing", confidence: researchCount ? 45 + researchCount * 5 : 8, sourceNeeded: "Project brief, thesis, publication or supervisor proof", affects: ["Research-focused routes", "Scholarship narrative"] },
    { id: "experience-evidence", category: "experience", label: "Experience and leadership evidence", state: input.experienceRange === "none" ? "missing" : "declared", confidence: input.experienceRange === "none" ? 8 : 42, sourceNeeded: "Experience letters and quantified examples", affects: ["Leadership awards", "Career narrative"] },
    { id: "funding-plan", category: "funding", label: "Funding and contribution evidence", state: input.availableBudget > 0 ? "declared" : "missing", confidence: input.availableBudget > 0 ? 38 : 5, sourceNeeded: "Source-of-funds records and scenario budget", affects: ["Affordability", "Portfolio balance"] },
  ];
}

function evaluateRequirement(rule: ModelRequirement, input: AssessmentInput): RequirementEvaluation {
  const grade = gradePercent(input);
  const hasResearch = !input.researchEvidence.includes("none") && input.researchEvidence.length > 0;
  let outcome: RequirementOutcome = "unknown";
  let actual = "Not captured";
  let explanation = "A source-backed requirement cannot be resolved from the current profile.";
  if (rule.evaluator === "grade70") { actual = `${grade}% internal normalization`; outcome = grade >= 70 ? "pass" : "conditional"; explanation = outcome === "pass" ? "The declared result clears the internal research threshold; official equivalency is still required." : "The result needs programme-specific threshold review."; }
  if (rule.evaluator === "computing") { actual = input.fieldFamily; outcome = input.fieldFamily === "Computing and information technology" ? "pass" : "conditional"; explanation = outcome === "pass" ? "The declared field is directionally aligned." : "Module-level subject alignment must be checked."; }
  if (rule.evaluator === "english") { actual = input.englishStatus === "completed" ? `${input.englishTest} ${input.englishScore}` : input.englishStatus.replaceAll("_", " "); outcome = input.englishStatus === "completed" ? "conditional" : "unknown"; explanation = input.englishStatus === "completed" ? "A score is declared; the official report and exact programme threshold remain open." : "No completed language result is available."; }
  if (rule.evaluator === "degree_complete") { actual = input.completionStatus.replaceAll("_", " "); outcome = input.completionStatus === "completed" ? "conditional" : "unknown"; explanation = input.completionStatus === "completed" ? "Completion is declared but not document-verified." : "The final award is still pending."; }
  if (rule.evaluator === "research") { actual = hasResearch ? input.researchEvidence.join(", ") : "None declared"; outcome = hasResearch ? "pass" : "unknown"; explanation = hasResearch ? "Relevant evidence is declared and should be converted into proof." : "A research or project evidence story has not been captured."; }
  if (rule.evaluator === "nationality") { actual = input.nationality; outcome = "conditional"; explanation = "Nationality is declared; the current award cycle must confirm territory eligibility."; }
  if (rule.evaluator === "leadership") { actual = input.experienceRange.replaceAll("_", " "); outcome = input.experienceRange === "none" ? "unknown" : "conditional"; explanation = "Experience duration alone cannot establish leadership or impact."; }
  return { id: rule.id, group: rule.group, label: rule.label, expected: rule.expected, actual, outcome, hard: rule.hard, impact: rule.impact, explanation, evidenceClaimId: rule.evidenceClaimId };
}

function deadlineComponent(deadline: string, now: Date) {
  const days = (new Date(`${deadline}T23:59:59Z`).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return 0;
  if (days < 30) return 28;
  if (days < 60) return 52;
  if (days < 120) return 74;
  return 92;
}

function groupScore(requirements: RequirementEvaluation[], group: RequirementEvaluation["group"], fallback: number) {
  const selected = requirements.filter((item) => item.group === group);
  if (!selected.length) return fallback;
  const values: number[] = selected.map((item) => item.outcome === "pass" ? 92 : item.outcome === "conditional" ? 58 : item.outcome === "unknown" ? 28 : 0);
  return clamp(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function evaluateOpportunity(model: OpportunityModel, input: AssessmentInput, claims: EvidenceClaim[], now: Date): IntelligenceOpportunity {
  const requirements = model.requirements.map((rule) => evaluateRequirement(rule, input));
  const failed = requirements.filter((item) => item.hard && item.outcome === "fail");
  const unknownHard = requirements.filter((item) => item.hard && item.outcome !== "pass");
  const sourceScore = model.source.state === "verified" ? 92 : 54;
  const evidenceScore = clamp(requirements.reduce((sum, item) => {
    const claim = claims.find((candidate) => candidate.id === item.evidenceClaimId);
    return sum + (claim?.confidence ?? 20);
  }, 0) / Math.max(1, requirements.length));
  const components = {
    academic: groupScore(requirements, "academic", 58),
    language: groupScore(requirements, "language", input.englishStatus === "completed" ? 58 : 28),
    funding: input.fundingNeed === "self" ? clamp(100 - model.fundingBase / 3) : model.fundingBase,
    deadline: deadlineComponent(model.deadline, now),
    evidence: evidenceScore,
    source: sourceScore,
  };
  const weighted = components.academic * .25 + components.language * .12 + components.funding * .2 + components.deadline * .15 + components.evidence * .18 + components.source * .1;
  const state: IntelligenceState = failed.length ? "blocked" : model.source.state === "review_due" && unknownHard.length ? "stale" : unknownHard.length || requirements.some((item) => item.outcome !== "pass") ? "conditional" : "aligned";
  const strengths = requirements.filter((item) => item.outcome === "pass").map((item) => item.explanation);
  const blockers = requirements.filter((item) => item.outcome !== "pass").map((item) => item.label);
  const nextActions = requirements.filter((item) => item.outcome !== "pass").sort((a, b) => ({ critical: 3, high: 2, medium: 1 }[b.impact] - ({ critical: 3, high: 2, medium: 1 }[a.impact]))).slice(0, 3).map((item) => `Resolve ${item.label.toLowerCase()}: ${item.expected}.`);
  return { id: model.id, kind: model.kind, title: model.title, provider: model.provider, country: model.country, portfolioRole: model.role, state, researchPriority: state === "blocked" ? 0 : clamp(weighted), confidence: evidenceScore, components, requirements, strengths, blockers, nextActions, deadline: model.deadline, source: model.source };
}

function buildSimulations(input: AssessmentInput, opportunities: IntelligenceOpportunity[]): IntelligenceSimulation[] {
  const languageAffected = opportunities.filter((item) => item.requirements.some((rule) => rule.group === "language")).map((item) => item.title);
  const researchAffected = opportunities.filter((item) => item.requirements.some((rule) => rule.id.includes("research") || rule.id.includes("leadership"))).map((item) => item.title);
  return [
    { id: "academic-evidence", title: "Verify the academic evidence pack", change: "Attach transcript, award, grading context and official module descriptions.", readinessDelta: 14, confidenceDelta: 31, affectedRoutes: opportunities.map((item) => item.title), explanation: "This resolves the highest number of hard unknowns without changing any student fact.", action: "Create the four-document academic evidence task group" },
    { id: "english", title: input.englishStatus === "completed" ? "Verify the declared English result" : "Complete an accepted English test", change: input.englishStatus === "completed" ? "Attach the official score report and compare it with each programme threshold." : "Choose a test after programme shortlisting and record a target date.", readinessDelta: input.englishStatus === "completed" ? 6 : 12, confidenceDelta: input.englishStatus === "completed" ? 13 : 24, affectedRoutes: languageAffected, explanation: "Language evidence changes route readiness only where a current programme rule is attached.", action: "Open language evidence plan" },
    { id: "research", title: "Build a documented evidence story", change: "Turn projects, research and experience into named claims with proof and measurable outcomes.", readinessDelta: input.researchEvidence.includes("none") ? 11 : 7, confidenceDelta: input.researchEvidence.includes("none") ? 18 : 12, affectedRoutes: researchAffected, explanation: "This strengthens evidence-led scholarship research; it does not create an award probability.", action: "Start evidence story bank" },
  ];
}

export function generateIntelligenceReport(input: AssessmentInput, now = new Date()): IntelligenceReport {
  const evidenceClaims = buildClaims(input);
  const opportunities = models.map((model) => evaluateOpportunity(model, input, evidenceClaims, now)).sort((a, b) => b.researchPriority - a.researchPriority);
  const evaluations = opportunities.flatMap((item) => item.requirements);
  const passed = evaluations.filter((item) => item.outcome === "pass").length;
  const failed = evaluations.filter((item) => item.outcome === "fail").length;
  const unknown = evaluations.filter((item) => item.outcome === "unknown" || item.outcome === "conditional").length;
  const evidenceConfidence = clamp(evidenceClaims.reduce((sum, item) => sum + item.confidence, 0) / evidenceClaims.length);
  const slots = opportunities.map((item) => ({ role: item.portfolioRole, opportunityId: item.id, reason: item.portfolioRole === "lower-cost" ? "Reduces funding concentration" : item.portfolioRole === "funding-first" ? "Tests a full-award lane" : item.portfolioRole === "preferred" ? "Preserves destination preference" : "Keeps a high-impact source gap visible" }));
  return {
    engineVersion: intelligenceEngineVersion,
    evaluatedAt: now.toISOString(),
    evidenceConfidence,
    evidenceClaims,
    opportunities,
    simulations: buildSimulations(input, opportunities),
    portfolio: { balance: new Set(slots.map((item) => item.role)).size >= 3 ? "balanced" : "concentrated", coverage: clamp((new Set(slots.map((item) => item.role)).size / 4) * 100), slots },
    audit: {
      evaluatedRules: evaluations.length,
      passedRules: passed,
      failedRules: failed,
      unknownRules: unknown,
      sourceVersions: models.map((model) => model.source.version),
      trace: [
        `Profile normalized using ${intelligenceEngineVersion}.`,
        `${evaluations.length} programme and scholarship requirements evaluated.`,
        `${unknown} conditions remained open because evidence or a current source was missing.`,
        "Research priority was calculated separately from admission and scholarship outcomes.",
      ],
    },
  };
}
