import { describe, expect, it } from "vitest";
import { compareRuleValue, evaluateRecommendations, type AtomicRule, type RecommendationEntity } from "./engine";

const rule = (partial: Partial<AtomicRule> = {}): AtomicRule => ({
  id: crypto.randomUUID(), ruleKey: "grade", ruleGroup: "academic", operator: "gte", profileField: "grade",
  expectedValue: 70, severity: "hard", explanation: "Minimum grade is 70.", version: 1, ...partial,
});
const entity = (partial: Partial<RecommendationEntity> = {}): RecommendationEntity => ({
  id: crypto.randomUUID(), entityType: "programme", title: "MSc Data Science", provider: "Example University",
  deadlineAt: "2027-09-01T00:00:00Z", fundingSignal: 5, sourceFreshness: "verified", rules: [rule()], ...partial,
});

describe("recommendation rules", () => {
  it("normalizes case for controlled string comparisons", () => {
    expect(compareRuleValue("Pakistan", "in", ["pakistan", "india"])).toBe(true);
  });

  it("hard-gates a failed opportunity before ranking", () => {
    const [result] = evaluateRecommendations({ grade: 65 }, [entity()], new Date("2026-08-01T00:00:00Z"));
    expect(result.state).toBe("failed");
    expect(result.score).toBe(0);
    expect(result.failedGates).toContain("Minimum grade is 70.");
  });

  it("keeps missing hard-rule evidence conditional", () => {
    const [result] = evaluateRecommendations({}, [entity()], new Date("2026-08-01T00:00:00Z"));
    expect(result.state).toBe("conditional");
    expect(result.openChecks[0]).toContain("Evidence needed");
  });

  it("treats passed deadlines as a hard operational failure", () => {
    const [result] = evaluateRecommendations({ grade: 80 }, [entity({ deadlineAt: "2026-01-01T00:00:00Z" })], new Date("2026-08-01T00:00:00Z"));
    expect(result.state).toBe("failed");
    expect(result.reasonCodes).toContain("deadline:fail");
  });

  it("caps stale-source scores even when rules pass", () => {
    const [result] = evaluateRecommendations({ grade: 80 }, [entity({ sourceFreshness: "stale", fundingSignal: 10 })], new Date("2026-08-01T00:00:00Z"));
    expect(result.state).toBe("stale");
    expect(result.score).toBeLessThanOrEqual(55);
    expect(result.nextActions).toContain("Verify the latest official source before relying on this option.");
  });

  it("stores requirement-level evidence and a reproducible audit trace", () => {
    const [result] = evaluateRecommendations({ grade: 80 }, [entity()], new Date("2026-08-01T00:00:00Z"));
    expect(result.evidenceConfidence).toBe(100);
    expect(result.requirementEvaluations[0]).toMatchObject({ ruleKey: "grade", outcome: "pass", actual: 80, expected: 70 });
    expect(result.auditTrace.join(" ")).toContain("rules-3.0.0-evidence-audit");
  });
});
