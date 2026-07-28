import { z } from "zod";

export const assessmentInputSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  nationality: z.enum(["Pakistan", "India", "Bangladesh"]),
  currentCountry: z.string().trim().min(2).max(80),
  qualification: z.string().trim().min(3).max(120),
  institution: z.string().trim().min(2).max(160),
  fieldFamily: z.string().trim().min(3).max(160),
  completionStatus: z.enum(["completed", "final_year", "result_awaited"]),
  graduationYear: z.number().int().min(1980).max(new Date().getFullYear() + 4),
  gradeValue: z.number().min(0).max(100),
  gradeMaximum: z.union([z.literal(4), z.literal(5), z.literal(10), z.literal(100)]),
  intake: z.string().trim().min(3).max(60),
  fundingNeed: z.enum(["full", "major", "partial", "self"]),
  budgetCurrency: z.enum(["PKR", "INR", "BDT", "USD"]),
  availableBudget: z.number().min(0).max(1000000000),
  destinationPreference: z.enum(["suggest", "UK", "Germany", "Europe"]),
  englishStatus: z.enum(["not_started", "preparing", "booked", "completed"]),
  englishTest: z.enum(["IELTS", "TOEFL", "PTE", "Other"]).optional(),
  englishScore: z.number().min(0).max(120).optional(),
  experienceRange: z.enum(["none", "under_one", "one_to_two", "three_plus"]),
  researchEvidence: z
    .array(z.enum(["thesis", "assistantship", "publication", "project", "none"]))
    .min(1),
  weeklyHours: z.number().int().min(1).max(30),
  biggestBlocker: z.enum([
    "where_to_start",
    "eligibility",
    "funding",
    "documents",
    "deadlines",
  ]),
});
