import { describe, expect, it } from "vitest";
import { assessmentInputSchema } from "./schema";
import { generateAssessmentReport } from "./engine";
import { applyLiveRecommendations } from "./live-report";
import { evaluateRecommendations, type RecommendationEntity } from "../recommendation/engine";
import type { AssessmentInput } from "./types";

const validInput: AssessmentInput = {
  firstName: "Ayesha",
  nationality: "Pakistan",
  currentCountry: "Pakistan",
  qualification: "Four-year bachelor's degree",
  institution: "National University of Sciences and Technology",
  fieldFamily: "Computing and information technology",
  completionStatus: "completed",
  graduationYear: 2025,
  gradeValue: 3.4,
  gradeMaximum: 4,
  intake: "September 2027",
  fundingNeed: "full",
  budgetCurrency: "PKR",
  availableBudget: 500000,
  destinationPreference: "suggest",
  englishStatus: "completed",
  englishTest: "IELTS",
  englishScore: 7,
  experienceRange: "one_to_two",
  researchEvidence: ["project"],
  weeklyHours: 8,
  biggestBlocker: "funding",
};

describe("assessment validation", () => {
  it("accepts a coherent South Asian postgraduate profile", () => {
    expect(assessmentInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects a grade above the selected scale", () => {
    const result = assessmentInputSchema.safeParse({ ...validInput, gradeValue: 8, gradeMaximum: 4 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.gradeValue?.[0]).toContain("greater than");
  });

  it("applies test-specific English score ranges", () => {
    const result = assessmentInputSchema.safeParse({ ...validInput, englishTest: "IELTS", englishScore: 75 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors.englishScore?.[0]).toContain("between 0 and 9");
  });

  it("keeps none mutually exclusive from research evidence", () => {
    expect(assessmentInputSchema.safeParse({ ...validInput, researchEvidence: ["none", "project"] }).success).toBe(false);
  });
});

describe("assessment report", () => {
  it("returns five explainable readiness dimensions without success probability", () => {
    const report = generateAssessmentReport(validInput);
    expect(report.readiness).toHaveLength(5);
    expect(report.readiness.map((item) => item.id)).toEqual(["academic", "language", "funding", "evidence", "execution"]);
    expect(report.summary.toLowerCase()).toContain("not an admission prediction");
  });

  it("uses an explicit destination as a research-order signal without confirming eligibility", () => {
    const report = generateAssessmentReport({ ...validInput, destinationPreference: "UK" });
    expect(report.pathways[0].id).toBe("uk");
    expect(report.pathways[0].state).not.toBe("not_recommended");
  });

  it("replaces prototype pathways with the same live catalogue evaluation used by recommendations", () => {
    const catalogue: RecommendationEntity[] = [{
      id: "live-programme",
      entityType: "programme",
      title: "Verified MSc Data Science",
      provider: "Example University",
      countryCode: "GB",
      applicationUrl: "https://example.edu/msc-data-science",
      deadlineAt: "2027-09-01T00:00:00Z",
      sourceFreshness: "verified",
      rules: [{
        id: "qualification-rule",
        ruleKey: "qualification_level",
        ruleGroup: "academic",
        operator: "in",
        profileField: "qualificationLevel",
        expectedValue: ["bachelors", "masters"],
        severity: "hard",
        explanation: "A relevant bachelor's degree is required.",
        version: 1,
      }],
    }];
    const results = evaluateRecommendations(validInput as unknown as Record<string, unknown>, catalogue, new Date("2026-08-01T00:00:00Z"));
    const report = applyLiveRecommendations(generateAssessmentReport(validInput), validInput, results, "catalogue-test");
    expect(report.pathways).toHaveLength(1);
    expect(report.pathways[0]).toMatchObject({ id: "live-programme", title: "Verified MSc Data Science" });
    expect(report.intelligence.opportunities[0].id).toBe("live-programme");
    expect(report.intelligence.audit.sourceVersions).toEqual(["catalogue-test"]);
  });
});
