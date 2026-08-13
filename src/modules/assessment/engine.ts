import type {
  ActionItem,
  AssessmentInput,
  AssessmentReport,
  PathwayLane,
  ReadinessDimension,
} from "./types";
import { generateIntelligenceReport } from "../intelligence/engine";

const currencyLabels: Record<string, string> = {
  PKR: "PKR", INR: "INR", BDT: "BDT", USD: "USD",
  EUR: "EUR", GBP: "GBP", CAD: "CAD", AUD: "AUD",
  JPY: "JPY", CNY: "CNY", KRW: "KRW", SGD: "SGD",
  MYR: "MYR", TRY: "TRY", HUF: "HUF", NZD: "NZD",
  SAR: "SAR", SEK: "SEK", CHF: "CHF", NOK: "NOK",
};

const pathwayDefinitions: Record<string, { title: string; subtitle: string; sourceUrl: string }> = {
  uk: { title: "United Kingdom", subtitle: "Taught master's + flagship scholarship lane", sourceUrl: "https://www.gov.uk/student-visa" },
  germany: { title: "Germany", subtitle: "Programme-fit and lower-tuition exploration lane", sourceUrl: "https://www.hochschulkompass.de/en/degree-programmes.html" },
  erasmus: { title: "Erasmus Mundus", subtitle: "Consortium-led, scholarship-dependent portfolio lane", sourceUrl: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters" },
  us: { title: "United States", subtitle: "Graduate school + assistantship and fellowship lane", sourceUrl: "https://educationusa.state.gov/" },
  canada: { title: "Canada", subtitle: "Post-graduation work pathway with research funding", sourceUrl: "https://www.educanada.ca/" },
  australia: { title: "Australia", subtitle: "Research-track or coursework master's with post-study work", sourceUrl: "https://www.studyaustralia.gov.au/" },
  japan: { title: "Japan", subtitle: "MEXT scholarship and university-specific funding lane", sourceUrl: "https://www.studyinjapan.go.jp/en/" },
  korea: { title: "South Korea", subtitle: "GKS scholarship and affordable study lane", sourceUrl: "https://www.studyinkorea.go.kr/en/main.do" },
  singapore: { title: "Singapore", subtitle: "Research-intensive with industry placement focus", sourceUrl: "https://www.moe.gov.sg/" },
  malaysia: { title: "Malaysia", subtitle: "Affordable English-medium programmes with regional access", sourceUrl: "https://educationmalaysia.gov.my/" },
};

function normalizedGrade(input: AssessmentInput) {
  return Math.round((input.gradeValue / input.gradeMaximum) * 100);
}

function routeRank(route: PathwayLane, preference: AssessmentInput["destinationPreference"]) {
  const strength = { strong: 3, promising: 2, explore: 1 };
  const state = { conditional: 3, unknown: 2, not_recommended: 1 };
  const preferredLane = preference === "Europe" ? "erasmus" : preference.toLowerCase();
  return (route.id === preferredLane ? 100 : 0) + strength[route.strength] * 10 + state[route.state];
}

function readinessState(score: number): ReadinessDimension["state"] {
  if (score >= 75) return "ready";
  if (score >= 50) return "developing";
  return "blocked";
}

function languageSignal(input: AssessmentInput) {
  if (input.englishStatus !== "completed" || !input.englishTest || input.englishScore == null) return 34;
  if (input.englishTest === "IELTS") return Math.min(92, Math.round((input.englishScore / 9) * 100));
  if (input.englishTest === "TOEFL") return Math.min(92, Math.round((input.englishScore / 120) * 100));
  if (input.englishTest === "PTE") return Math.min(92, Math.round((input.englishScore / 90) * 100));
  return 62;
}

function buildReadiness(input: AssessmentInput, grade: number): ReadinessDimension[] {
  const language = languageSignal(input);
  const academic = Math.max(35, Math.min(92, Math.round(grade * 0.82 + (input.completionStatus === "completed" ? 10 : 3))));
  const evidenceCount = input.researchEvidence.includes("none") ? 0 : input.researchEvidence.length;
  const evidence = Math.min(90, 42 + evidenceCount * 12 + (input.completionStatus === "completed" ? 8 : 0));
  const funding = input.fundingNeed === "self" ? 82 : input.fundingNeed === "partial" ? 68 : input.fundingNeed === "major" ? 48 : 35;
  const execution = Math.min(92, 44 + input.weeklyHours * 3 + (input.intake === "I am flexible" ? 5 : 0));
  const dimensions: Array<Omit<ReadinessDimension, "state">> = [
    { id: "academic", label: "Academic foundation", score: academic, summary: `${grade}% internal planning signal from the declared scale.`, nextMove: grade < 60 ? "Verify programme thresholds before shortlisting." : "Attach transcript and grading-scale evidence." },
    { id: "language", label: "Language evidence", score: language, summary: input.englishStatus === "completed" ? `${input.englishTest} ${input.englishScore} declared, not yet document-verified.` : "No completed English result is available yet.", nextMove: input.englishStatus === "completed" ? "Upload the official score report." : "Choose an accepted test after shortlisting programmes." },
    { id: "funding", label: "Funding feasibility", score: funding, summary: `${input.fundingNeed.replace("_", " ")} funding dependency recorded.`, nextMove: funding < 50 ? "Build a scholarship-first portfolio with a fallback lane." : "Model award, deposit and personal-contribution scenarios." },
    { id: "evidence", label: "Evidence coverage", score: evidence, summary: evidenceCount ? `${evidenceCount} research or project evidence type${evidenceCount === 1 ? "" : "s"} declared.` : "No research or project evidence is documented yet.", nextMove: "Convert every declared claim into a named document or proof item." },
    { id: "execution", label: "Execution capacity", score: execution, summary: `${input.weeklyHours} focused hours are available each week.`, nextMove: input.weeklyHours < 5 ? "Reduce the shortlist and protect critical deadlines." : "Run a weekly evidence and deadline review." },
  ];
  return dimensions.map((dimension) => ({ ...dimension, state: readinessState(dimension.score) }));
}

function commonConditions(input: AssessmentInput, grade: number) {
  const conditions: string[] = [];
  if (input.englishStatus !== "completed") {
    conditions.push("An accepted English test and programme-level score are still unconfirmed.");
  }
  if (grade < 60) {
    conditions.push("Academic thresholds must be checked against each programme before applying.");
  }
  if (input.completionStatus !== "completed") {
    conditions.push("Your final award and transcript are pending.");
  }
  return conditions;
}

function buildPathwayForDestination(id: string, input: AssessmentInput, grade: number, shared: string[]): PathwayLane {
  const def = pathwayDefinitions[id] || pathwayDefinitions.uk;
  const fullFunding = input.fundingNeed === "full";
  const hasResearch = !input.researchEvidence.includes("none");
  const isPreferred = input.destinationPreference.toLowerCase() === id;

  if (id === "uk") {
    return {
      id: "uk",
      title: "United Kingdom",
      subtitle: "Taught master’s + flagship scholarship lane",
      state: shared.length ? "conditional" : "unknown",
      strength: isPreferred || grade >= 70 ? "strong" : "promising",
      why: [
        `${grade}% internal academic planning signal from your original grading scale.`,
        "Your intended level aligns with the initial taught master’s workflow.",
        fullFunding ? "Full funding makes scholarship timing a critical dependency." : "Your funding position allows both award and self-funded options to be researched."
      ],
      conditions: [
        ...shared,
        ...(fullFunding ? ["Scholarship eligibility and work-history rules must be evaluated separately from admission."] : [])
      ],
      nextAction: "Verify three suitable courses before checking scholarship dependencies.",
      sourceLabel: "Official programme and scholarship sources required",
      sourceUrl: "https://www.gov.uk/student-visa",
      evidenceState: "suggestion",
    };
  } else if (id === "germany") {
    return {
      id: "germany",
      title: "Germany",
      subtitle: "Programme-fit and lower-tuition exploration lane",
      state: input.institution.toLowerCase().includes("other") ? "unknown" : "conditional",
      strength: isPreferred || fullFunding ? "strong" : "promising",
      why: [
        "Potentially lower tuition makes this route relevant under funding pressure.",
        `${input.fieldFamily} can be searched against structured programme subject requirements.`,
        "Your original degree structure still needs programme-by-programme recognition checks."
      ],
      conditions: [
        "Degree equivalence, subject credits and document format must be verified per programme.",
        ...shared
      ],
      nextAction: "Create a DAAD/HRK-backed shortlist and record subject-credit requirements.",
      sourceLabel: "DAAD and Higher Education Compass",
      sourceUrl: "https://www.hochschulkompass.de/en/degree-programmes.html",
      evidenceState: "suggestion",
    };
  } else if (id === "erasmus") {
    return {
      id: "erasmus",
      title: "Erasmus Mundus",
      subtitle: "Consortium-led, scholarship-dependent portfolio lane",
      state: fullFunding || isPreferred || input.destinationPreference === "Europe" ? "conditional" : "unknown",
      strength: fullFunding || hasResearch || isPreferred ? "strong" : "explore",
      why: [
        fullFunding ? "Your funding dependency makes fully funded consortium routes strategically important." : "This route can add geographic diversity to the portfolio.",
        hasResearch ? "Your declared research/project evidence may strengthen programme fit." : "Your academic projects and motivation evidence will need deeper capture.",
        "Each consortium owns its own criteria, dates and document workflow."
      ],
      conditions: [
        "No universal Erasmus Mundus rule can confirm eligibility across all consortia.",
        ...shared
      ],
      nextAction: "Identify two live consortia in your field and map their exact evidence requirements.",
      sourceLabel: "Official Erasmus Mundus catalogue and consortium pages",
      sourceUrl: "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
      evidenceState: "suggestion",
    };
  } else {
    return {
      id,
      title: def.title,
      subtitle: def.subtitle,
      state: shared.length ? "conditional" : "unknown",
      strength: isPreferred || grade >= 75 || fullFunding ? "strong" : "promising",
      why: [
        `${grade}% internal academic planning signal from your original grading scale.`,
        fullFunding ? "Your funding position makes scholarships a critical dependency." : "Your funding position allows both award and self-funded options to be researched.",
        hasResearch ? "Your declared research/project evidence may strengthen programme fit." : "Your academic projects and motivation evidence will need deeper capture."
      ],
      conditions: [
        ...shared,
        ...(fullFunding ? ["Scholarship eligibility and work-history rules must be evaluated separately from admission."] : [])
      ],
      nextAction: "Verify three suitable courses before checking scholarship dependencies.",
      sourceLabel: `Official ${def.title} sources required`,
      sourceUrl: def.sourceUrl,
      evidenceState: "suggestion",
    };
  }
}

function buildPathways(input: AssessmentInput, grade: number): PathwayLane[] {
  const shared = commonConditions(input, grade);
  const allIds = Object.keys(pathwayDefinitions);
  let selectedIds: string[] = [];

  const pref = input.destinationPreference;
  if (pref === "suggest" || pref === "World") {
    if (input.fundingNeed === "full") selectedIds = ["us", "erasmus", "germany"];
    else selectedIds = ["uk", "australia", "canada"];
  } else if (pref === "Europe") {
    selectedIds = ["germany", "erasmus", "uk"];
  } else {
    const mainId = pref.toLowerCase();
    selectedIds = [mainId, ...allIds.filter(id => id !== mainId)].slice(0, 3);
  }

  return selectedIds.map(id => buildPathwayForDestination(id, input, grade, shared))
    .sort((a, b) => routeRank(b, input.destinationPreference) - routeRank(a, input.destinationPreference));
}

function buildActions(input: AssessmentInput): ActionItem[] {
  const actions: ActionItem[] = [
    {
      id: "academic-proof",
      title: "Complete your academic evidence",
      detail:
        "Add transcript, degree status and grading-scale evidence before any programme is treated as verified.",
      horizon: "Today",
      impact: "critical",
      complete: false,
    },
  ];

  if (input.englishStatus !== "completed") {
    actions.push({
      id: "english-plan",
      title: "Choose an English-test route",
      detail:
        "Check accepted tests on shortlisted programme pages, then set a test, target and booking date.",
      horizon: "This week",
      impact: "high",
      complete: false,
    });
  }

  actions.push(
    {
      id: "shortlist",
      title: "Research your first six programmes",
      detail:
        "Start with two options in each suggested lane. Keep official source, intake and requirement evidence attached.",
      horizon: "This week",
      impact: "high",
      complete: false,
    },
    {
      id: "funding-scenarios",
      title: "Build three funding scenarios",
      detail:
        "Separate fully funded, partially funded and personal-contribution pathways before making a final shortlist.",
      horizon: "Next",
      impact: "medium",
      complete: false,
    },
  );

  return actions;
}

export function generateAssessmentReport(input: AssessmentInput): AssessmentReport {
  const grade = normalizedGrade(input);
  const pathways = buildPathways(input, grade);
  const readiness = buildReadiness(input, grade);
  const intelligence = generateIntelligenceReport(input);
  const evidenceGaps = [
    "Programme-specific academic threshold",
    "Official degree and grading-scale evidence",
    ...(input.englishStatus === "completed" ? [] : ["Accepted English test and score"]),
    ...(input.fundingNeed === "self" ? [] : ["Award-specific funding eligibility"]),
  ];
  const completeness = Math.max(48, 84 - evidenceGaps.length * 7);

  return {
    generatedAt: new Date().toISOString(),
    profileCompleteness: completeness,
    confidence: evidenceGaps.length <= 2 ? "medium" : "developing",
    headline: `${pathways[0].title} is your strongest research lane right now`,
    summary:
      "This is a prioritized starting point, not an admission prediction. The system has separated what you entered, what it derived, and what still needs an official source.",
    snapshot: {
      academic: `${input.qualification} · ${grade}% planning signal`,
      goal: `Taught master’s · ${input.intake}`,
      funding: `${input.fundingNeed.replace("_", " ")} funding · ${currencyLabels[input.budgetCurrency]} ${input.availableBudget.toLocaleString()}`,
      evidence:
        input.englishStatus === "completed"
          ? `${input.englishTest ?? "English test"} declared`
          : "English evidence still in progress",
    },
    readiness,
    strongestSignals: [
      `${input.fieldFamily} goal is structured`,
      `${input.weeklyHours} hours per week reserved`,
      input.destinationPreference === "suggest"
        ? "Open to system-suggested destinations"
        : `${input.destinationPreference} preference recorded`,
    ],
    evidenceGaps,
    pathways,
    actionPlan: [
      ...buildActions(input),
      ...intelligence.opportunities
        .flatMap((opportunity) => opportunity.requirements.map((requirement) => ({ opportunity, requirement })))
        .filter(({ requirement }) => requirement.outcome !== "pass")
        .sort((a, b) => ({ critical: 3, high: 2, medium: 1 }[b.requirement.impact] - ({ critical: 3, high: 2, medium: 1 }[a.requirement.impact])))
        .filter(({ requirement }, index, items) => items.findIndex((item) => item.requirement.label === requirement.label) === index)
        .slice(0, 3)
        .map(({ opportunity, requirement }, index): ActionItem => ({
          id: `requirement-${requirement.id}`,
          title: `Resolve ${requirement.label.toLowerCase()}`,
          detail: `${opportunity.title}: ${requirement.expected}. ${requirement.explanation}`,
          horizon: index === 0 ? "Today" : index === 1 ? "This week" : "Next",
          impact: requirement.impact,
          complete: false,
        })),
    ],
    assumptions: [
      "Academic normalization is an internal planning aid, not an official equivalency.",
      "A route remains conditional or unknown until programme-specific sources are attached.",
      "The system does not predict admission, scholarship or visa outcomes.",
    ],
    intelligence,
  };
}
