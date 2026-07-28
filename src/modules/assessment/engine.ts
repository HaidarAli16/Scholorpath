import type {
  ActionItem,
  AssessmentInput,
  AssessmentReport,
  PathwayLane,
} from "./types";

const currencyLabels = {
  PKR: "PKR",
  INR: "INR",
  BDT: "BDT",
  USD: "USD",
};

function normalizedGrade(input: AssessmentInput) {
  return Math.round((input.gradeValue / input.gradeMaximum) * 100);
}

function routeRank(route: PathwayLane) {
  const strength = { strong: 3, promising: 2, explore: 1 };
  const state = { conditional: 3, unknown: 2, not_recommended: 1 };
  return strength[route.strength] * 10 + state[route.state];
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

function buildPathways(input: AssessmentInput, grade: number): PathwayLane[] {
  const shared = commonConditions(input, grade);
  const fullFunding = input.fundingNeed === "full";
  const hasResearch = !input.researchEvidence.includes("none");
  const ukPreferred = input.destinationPreference === "UK";
  const germanyPreferred = input.destinationPreference === "Germany";
  const europePreferred = input.destinationPreference === "Europe";

  const uk: PathwayLane = {
    id: "uk",
    title: "United Kingdom",
    subtitle: "Taught master’s + flagship scholarship lane",
    state: shared.length ? "conditional" : "unknown",
    strength: ukPreferred || grade >= 70 ? "strong" : "promising",
    why: [
      `${grade}% internal academic planning signal from your original grading scale.`,
      "Your intended level aligns with the initial taught master’s workflow.",
      fullFunding
        ? "Full funding makes scholarship timing a critical dependency."
        : "Your funding position allows both award and self-funded options to be researched.",
    ],
    conditions: [
      ...shared,
      ...(fullFunding
        ? ["Scholarship eligibility and work-history rules must be evaluated separately from admission."]
        : []),
    ],
    nextAction: "Verify three suitable courses before checking scholarship dependencies.",
    sourceLabel: "Official programme and scholarship sources required",
    sourceUrl: "https://www.gov.uk/student-visa",
    evidenceState: "suggestion",
  };

  const germany: PathwayLane = {
    id: "germany",
    title: "Germany",
    subtitle: "Programme-fit and lower-tuition exploration lane",
    state: input.institution.toLowerCase().includes("other") ? "unknown" : "conditional",
    strength: germanyPreferred || fullFunding ? "strong" : "promising",
    why: [
      "Potentially lower tuition makes this route relevant under funding pressure.",
      `${input.fieldFamily} can be searched against structured programme subject requirements.`,
      "Your original degree structure still needs programme-by-programme recognition checks.",
    ],
    conditions: [
      "Degree equivalence, subject credits and document format must be verified per programme.",
      ...shared,
    ],
    nextAction: "Create a DAAD/HRK-backed shortlist and record subject-credit requirements.",
    sourceLabel: "DAAD and Higher Education Compass",
    sourceUrl: "https://www.hochschulkompass.de/en/degree-programmes.html",
    evidenceState: "suggestion",
  };

  const erasmus: PathwayLane = {
    id: "erasmus",
    title: "Erasmus Mundus",
    subtitle: "Consortium-led, scholarship-dependent portfolio lane",
    state: fullFunding || europePreferred ? "conditional" : "unknown",
    strength: fullFunding || hasResearch || europePreferred ? "strong" : "explore",
    why: [
      fullFunding
        ? "Your funding dependency makes fully funded consortium routes strategically important."
        : "This route can add geographic diversity to the portfolio.",
      hasResearch
        ? "Your declared research/project evidence may strengthen programme fit."
        : "Your academic projects and motivation evidence will need deeper capture.",
      "Each consortium owns its own criteria, dates and document workflow.",
    ],
    conditions: [
      "No universal Erasmus Mundus rule can confirm eligibility across all consortia.",
      ...shared,
    ],
    nextAction: "Identify two live consortia in your field and map their exact evidence requirements.",
    sourceLabel: "Official Erasmus Mundus catalogue and consortium pages",
    sourceUrl:
      "https://erasmus-plus.ec.europa.eu/opportunities/individuals/students/erasmus-mundus-joint-masters",
    evidenceState: "suggestion",
  };

  return [uk, germany, erasmus].sort((a, b) => routeRank(b) - routeRank(a));
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
    strongestSignals: [
      `${input.fieldFamily} goal is structured`,
      `${input.weeklyHours} hours per week reserved`,
      input.destinationPreference === "suggest"
        ? "Open to system-suggested destinations"
        : `${input.destinationPreference} preference recorded`,
    ],
    evidenceGaps,
    pathways,
    actionPlan: buildActions(input),
    assumptions: [
      "Academic normalization is an internal planning aid, not an official equivalency.",
      "A route remains conditional or unknown until programme-specific sources are attached.",
      "The system does not predict admission, scholarship or visa outcomes.",
    ],
  };
}
