import { describe, expect, it } from "vitest";
import { generateIntelligenceReport } from "./engine";
import type { AssessmentInput } from "@/modules/assessment/types";

const profile: AssessmentInput = {
  firstName: "Adeel", nationality: "Pakistan", currentCountry: "Pakistan", qualification: "Four-year bachelor's degree", institution: "NUST", fieldFamily: "Computing and information technology", completionStatus: "completed", graduationYear: 2026, gradeValue: 3.3, gradeMaximum: 4, intake: "September 2027", fundingNeed: "full", budgetCurrency: "PKR", availableBudget: 500000, destinationPreference: "UK", englishStatus: "completed", englishTest: "IELTS", englishScore: 7, experienceRange: "one_to_two", researchEvidence: ["project"], weeklyHours: 7, biggestBlocker: "funding",
};

describe("education intelligence engine", () => {
  it("evaluates programme-level requirements without predicting outcomes", () => {
    const report = generateIntelligenceReport(profile, new Date("2026-08-03T00:00:00Z"));
    expect(report.opportunities).toHaveLength(4);
    expect(report.audit.evaluatedRules).toBeGreaterThan(10);
    expect(JSON.stringify(report)).not.toMatch(/acceptance probability|admission probability/i);
  });

  it("keeps missing module evidence visible as a hard unknown", () => {
    const report = generateIntelligenceReport(profile, new Date("2026-08-03T00:00:00Z"));
    const leeds = report.opportunities.find((item) => item.id === "msc-data-leeds");
    expect(leeds?.requirements.find((item) => item.id === "leeds-maths")?.outcome).toBe("unknown");
    expect(leeds?.state).not.toBe("aligned");
  });

  it("produces explainable simulations and a balanced portfolio", () => {
    const report = generateIntelligenceReport(profile, new Date("2026-08-03T00:00:00Z"));
    expect(report.simulations).toHaveLength(3);
    expect(report.simulations[0].confidenceDelta).toBeGreaterThan(0);
    expect(report.portfolio.balance).toBe("balanced");
  });
});
