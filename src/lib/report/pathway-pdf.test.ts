import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generateAssessmentReport } from "../../modules/assessment/engine";
import type { AssessmentInput } from "../../modules/assessment/types";
import { buildPathwayReportPdf } from "./pathway-pdf";

const profile: AssessmentInput = {
  firstName: "Ayesha", nationality: "Pakistan", currentCountry: "Pakistan",
  qualification: "Four-year bachelor's degree", institution: "NUST",
  fieldFamily: "Computing and information technology", completionStatus: "completed",
  graduationYear: 2025, gradeValue: 3.4, gradeMaximum: 4, intake: "September 2027",
  fundingNeed: "full", budgetCurrency: "PKR", availableBudget: 500000,
  destinationPreference: "suggest", englishStatus: "completed", englishTest: "IELTS",
  englishScore: 7, experienceRange: "one_to_two", researchEvidence: ["project"],
  weeklyHours: 8, biggestBlocker: "funding",
};

describe("pathway PDF", () => {
  it("creates a readable multi-page A4 report from the assessment result", async () => {
    const bytes = await buildPathwayReportPdf(profile, generateAssessmentReport(profile));
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain("%PDF");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(4);
    expect(pdf.getTitle()).toContain("Ayesha");
  });
});
