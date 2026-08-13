import { fieldOptions, intakeOptions, qualificationOptions, residenceOptions, type AssessmentInput } from "./types";

type Draft = Partial<AssessmentInput>;

export function getAssessmentStepIssue(draft: Draft, step: number): string | null {
  const currentYear = new Date().getFullYear();
  if (step === 0) {
    const name = draft.firstName?.trim() ?? "";
    if (name.length < 2) return "Enter at least two characters for your name.";
    if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u.test(name)) return "Use letters and normal name punctuation only.";
  }
  if (step === 1 && !draft.nationality) return "Choose your citizenship so the correct qualification rules can be used.";
  if (step === 2 && (!draft.currentCountry || !(residenceOptions as readonly string[]).includes(draft.currentCountry))) return "Choose your current country of residence.";
  if (step === 3) {
    if (!draft.nationality) return "Choose citizenship first.";
    if (!draft.qualification || !(qualificationOptions[draft.nationality] as readonly string[]).includes(draft.qualification)) return `Choose the qualification you will apply with from the ${draft.nationality} list.`;
  }
  if (step === 4) {
    if (!draft.institution?.trim() || /^(other|n\/a|none|unknown)$/i.test(draft.institution.trim())) return "Enter the institution shown on your academic record.";
    if (!draft.fieldFamily || !(fieldOptions as readonly string[]).includes(draft.fieldFamily)) return "Choose the closest subject family.";
  }
  if (step === 5) {
    if (!draft.gradeMaximum) return "Choose the grading scale printed on your transcript.";
    if (draft.gradeValue == null || draft.gradeValue <= 0) return "Enter your result exactly as it appears on the selected scale.";
    if (draft.gradeValue > draft.gradeMaximum) return `Your result cannot be greater than ${draft.gradeMaximum}.`;
  }
  if (step === 6) {
    if (!draft.completionStatus || !draft.graduationYear) return "Choose your degree status and graduation year.";
    if (draft.completionStatus === "completed" && draft.graduationYear > currentYear) return "A completed degree cannot have a future graduation year.";
    if (draft.completionStatus === "final_year" && (draft.graduationYear < currentYear || draft.graduationYear > currentYear + 2)) return "For a final-year degree, use the current year or the next two years.";
  }
  if (step === 7 && (!draft.intake || !(intakeOptions as readonly string[]).includes(draft.intake))) return "Choose an intake or select the flexible option.";
  if (step === 8 && !draft.destinationPreference) return "Choose a destination preference or let CandidRoute suggest one.";
  if (step === 9 && !draft.fundingNeed) return "Choose the funding position that is true today.";
  if (step === 10) {
    if (!draft.budgetCurrency) return "Choose the currency used for your available budget.";
    if (draft.availableBudget == null || draft.availableBudget < 0) return "Enter zero if no funds are currently available.";
    if (draft.fundingNeed === "self" && draft.availableBudget <= 0) return "A self-funded route needs a budget greater than zero.";
  }
  if (step === 11) {
    if (!draft.englishStatus) return "Choose your current English-test status.";
    if (draft.englishStatus === "completed") {
      if (!draft.englishTest) return "Choose the English test you completed.";
      if (draft.englishScore == null) return "Enter the overall score exactly as reported.";
      const ranges = { IELTS: [0, 9], TOEFL: [0, 120], PTE: [10, 90], Other: [0, 100] } as const;
      const [minimum, maximum] = ranges[draft.englishTest];
      if (draft.englishScore < minimum || draft.englishScore > maximum) return `${draft.englishTest} scores must be between ${minimum} and ${maximum}.`;
      if (draft.englishTest === "IELTS" && Math.round(draft.englishScore * 2) !== draft.englishScore * 2) return "IELTS overall scores use whole or half bands.";
    }
  }
  if (step === 12 && !draft.experienceRange) return "Choose the closest relevant-experience range.";
  if (step === 13) {
    if (!draft.researchEvidence?.length) return "Select the evidence you can document, or choose ‘None yet’.";
    if (draft.researchEvidence.includes("none") && draft.researchEvidence.length > 1) return "Select ‘None yet’ by itself.";
  }
  if (step === 14 && (!draft.weeklyHours || draft.weeklyHours < 1 || draft.weeklyHours > 30)) return "Choose between 1 and 30 focused hours per week.";
  if (step === 15 && !draft.biggestBlocker) return "Choose the blocker that would be most useful to solve first.";
  return null;
}

