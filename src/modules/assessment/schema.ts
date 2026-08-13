import { z } from "zod";
import { fieldOptions, qualificationOptions } from "./types";

export const assessmentInputSchema = z.object({
  firstName: z.string().trim().min(2).max(60).regex(/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, "Use letters and normal name punctuation only."),
  nationality: z.string().trim().min(2).max(60),
  currentCountry: z.string().trim().min(2).max(60),
  qualification: z.string().trim().min(3).max(120),
  institution: z.string().trim().min(2).max(160).refine((value) => !/^(other|n\/a|none|unknown)$/i.test(value), "Enter the institution shown on your academic record."),
  fieldFamily: z.enum(fieldOptions),
  completionStatus: z.enum(["completed", "final_year", "result_awaited"]),
  graduationYear: z.number().int().min(1980).max(new Date().getFullYear() + 4),
  gradeValue: z.number().positive().max(100),
  gradeMaximum: z.union([z.literal(4), z.literal(5), z.literal(10), z.literal(100)]),
  intake: z.string().trim().min(4).max(30),
  fundingNeed: z.enum(["full", "major", "partial", "self"]),
  budgetCurrency: z.enum(["PKR", "INR", "BDT", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY", "KRW", "SGD", "MYR", "TRY", "HUF", "NZD", "SAR", "SEK", "CHF", "NOK"]),
  availableBudget: z.number().min(0).max(1000000000),
  destinationPreference: z.enum(["suggest", "World", "UK", "Germany", "Europe", "US", "Canada", "Australia", "Japan", "Korea", "Singapore", "Malaysia"]),
  englishStatus: z.enum(["not_started", "preparing", "booked", "completed"]),
  englishTest: z.enum(["IELTS", "TOEFL", "PTE", "Other"]).optional(),
  englishScore: z.number().min(0).max(120).optional(),
  experienceRange: z.enum(["none", "under_one", "one_to_two", "three_plus"]),
  researchEvidence: z
    .array(z.enum(["thesis", "assistantship", "publication", "project", "none"]))
    .min(1)
    .max(4),
  weeklyHours: z.number().int().min(1).max(30),
  biggestBlocker: z.enum([
    "where_to_start",
    "eligibility",
    "funding",
    "documents",
    "deadlines",
  ]),
}).superRefine((input, context) => {
  const allowedQualifications = (qualificationOptions[input.nationality] ?? qualificationOptions._default) as readonly string[];
  if (!allowedQualifications.includes(input.qualification)) {
    context.addIssue({ code: "custom", path: ["qualification"], message: `Choose a qualification valid for ${input.nationality}.` });
  }

  if (input.gradeValue > input.gradeMaximum) {
    context.addIssue({ code: "custom", path: ["gradeValue"], message: `The result cannot be greater than the selected ${input.gradeMaximum}-point scale.` });
  }

  const currentYear = new Date().getFullYear();
  if (input.completionStatus === "completed" && input.graduationYear > currentYear) {
    context.addIssue({ code: "custom", path: ["graduationYear"], message: "A completed degree cannot have a future graduation year." });
  }
  if (input.completionStatus === "final_year" && (input.graduationYear < currentYear || input.graduationYear > currentYear + 2)) {
    context.addIssue({ code: "custom", path: ["graduationYear"], message: "For a final-year degree, use the current year or the next two years." });
  }

  if (input.englishStatus === "completed") {
    if (!input.englishTest) context.addIssue({ code: "custom", path: ["englishTest"], message: "Choose the completed English test." });
    if (input.englishScore == null) context.addIssue({ code: "custom", path: ["englishScore"], message: "Enter the overall score exactly as reported." });
  }

  if (input.englishScore != null && input.englishTest) {
    const ranges = { IELTS: [0, 9], TOEFL: [0, 120], PTE: [10, 90], Other: [0, 100] } as const;
    const [minimum, maximum] = ranges[input.englishTest];
    if (input.englishScore < minimum || input.englishScore > maximum) {
      context.addIssue({ code: "custom", path: ["englishScore"], message: `${input.englishTest} scores must be between ${minimum} and ${maximum}.` });
    }
    if (input.englishTest === "IELTS" && Math.round(input.englishScore * 2) !== input.englishScore * 2) {
      context.addIssue({ code: "custom", path: ["englishScore"], message: "IELTS overall scores use whole or half bands." });
    }
  }

  if (input.researchEvidence.includes("none") && input.researchEvidence.length > 1) {
    context.addIssue({ code: "custom", path: ["researchEvidence"], message: "Select ‘None yet’ by itself." });
  }

  if (input.fundingNeed === "self" && input.availableBudget <= 0) {
    context.addIssue({ code: "custom", path: ["availableBudget"], message: "Enter the budget available for a self-funded route." });
  }
});
