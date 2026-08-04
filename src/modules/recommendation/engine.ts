export type RuleOperator = "eq" | "neq" | "in" | "not_in" | "gte" | "lte" | "contains_any" | "contains_all" | "exists";
export type RuleSeverity = "hard" | "soft" | "information";

export type AtomicRule = {
  id: string;
  ruleKey: string;
  ruleGroup: string;
  operator: RuleOperator;
  profileField: string;
  expectedValue: unknown;
  severity: RuleSeverity;
  explanation: string;
  version: number;
};

export type RecommendationEntity = {
  id: string;
  entityType: "programme" | "scholarship";
  title: string;
  provider: string;
  countryCode?: string | null;
  deadlineAt?: string | null;
  fundingSignal?: number;
  affordabilitySignal?: number;
  visaFeasibilitySignal?: number;
  careerSignal?: number;
  sourceFreshness: "verified" | "review_due" | "stale";
  rules: AtomicRule[];
};

export type ScoreComponents = {
  eligibility: number;
  fit: number;
  funding: number;
  deadline: number;
  freshness: number;
  evidence: number;
  affordability: number;
  visaFeasibility: number;
  careerAlignment: number;
  preference: number;
};

export type RecommendationResult = {
  entityId: string;
  entityType: "programme" | "scholarship";
  title: string;
  provider: string;
  state: "confirmed" | "conditional" | "failed" | "unknown" | "stale";
  score: number;
  scoreComponents: ScoreComponents;
  reasonCodes: string[];
  reasons: string[];
  openChecks: string[];
  failedGates: string[];
  nextActions: string[];
  ruleVersions: { id: string; version: number }[];
  evidenceConfidence: number;
  requirementEvaluations: Array<{ ruleId: string; ruleKey: string; group: string; severity: RuleSeverity; outcome: "pass" | "fail" | "unknown"; actual: unknown; expected: unknown; explanation: string }>;
  auditTrace: string[];
};

export const recommendationEngineVersion = "rules-4.0.0-country-institution-intelligence";
export const recommendationWeights = Object.freeze({ eligibility: 30, fit: 20, funding: 12, deadline: 8, freshness: 7, evidence: 5, affordability: 8, visaFeasibility: 5, careerAlignment: 3, preference: 2 });

function readPath(profile: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, profile);
}

function toArray(value: unknown) { return Array.isArray(value) ? value : [value]; }
function comparable(value: unknown) { return typeof value === "string" ? value.trim().toLocaleLowerCase("en") : value; }

export function compareRuleValue(actual: unknown, operator: RuleOperator, expected: unknown): boolean | null {
  if (operator === "exists") return actual !== undefined && actual !== null && actual !== "";
  if (actual === undefined || actual === null || actual === "") return null;
  if (operator === "eq") return comparable(actual) === comparable(expected);
  if (operator === "neq") return comparable(actual) !== comparable(expected);
  if (operator === "in") return toArray(expected).map(comparable).includes(comparable(actual));
  if (operator === "not_in") return !toArray(expected).map(comparable).includes(comparable(actual));
  if (operator === "gte") return typeof actual === "number" && typeof expected === "number" ? actual >= expected : null;
  if (operator === "lte") return typeof actual === "number" && typeof expected === "number" ? actual <= expected : null;
  const actualValues = toArray(actual).map(comparable);
  const expectedValues = toArray(expected).map(comparable);
  if (operator === "contains_any") return expectedValues.some((value) => actualValues.includes(value));
  if (operator === "contains_all") return expectedValues.every((value) => actualValues.includes(value));
  return null;
}

function componentScore(passed: number, known: number, maximum: number, emptyScore = 0) {
  return known ? Math.round((passed / known) * maximum * 100) / 100 : emptyScore;
}

function deadlineScore(deadlineAt: string | null | undefined, now: Date) {
  if (!deadlineAt) return { score: 2.4, expired: false, reason: "Deadline is not yet verified." };
  const days = (new Date(deadlineAt).getTime() - now.getTime()) / 86_400_000;
  if (days < 0) return { score: 0, expired: true, reason: "The published deadline has passed." };
  if (days < 14) return { score: 1.6, expired: false, reason: "Less than two weeks remain; evidence feasibility is high risk." };
  if (days < 30) return { score: 4, expired: false, reason: "Less than one month remains; act immediately." };
  if (days < 60) return { score: 6.4, expired: false, reason: "The deadline is feasible with focused execution." };
  return { score: 8, expired: false, reason: "The current deadline leaves a workable preparation window." };
}

function signalScore(signal: number | undefined, maximum: number, fallback: number) {
  return Math.round(Math.max(0, Math.min(10, signal ?? fallback)) / 10 * maximum * 100) / 100;
}

function preferenceScore(profile: Record<string, unknown>, countryCode?: string | null) {
  const preference = String(profile.destinationPreference ?? "suggest");
  if (preference === "suggest") return 1;
  const matches = preference === "UK" ? countryCode === "GB" : preference === "Germany" ? countryCode === "DE" : preference === "Europe" ? ["DE", "NL", "IE", "EU"].includes(countryCode ?? "") : false;
  return matches ? recommendationWeights.preference : 0.5;
}

export function evaluateRecommendations(profile: Record<string, unknown>, entities: RecommendationEntity[], now = new Date()): RecommendationResult[] {
  return entities.map((entity) => {
    const reasons: string[] = [];
    const openChecks: string[] = [];
    const failedGates: string[] = [];
    const reasonCodes: string[] = [];
    const counts = { hard: { pass: 0, known: 0, total: 0 }, soft: { pass: 0, known: 0, total: 0 }, information: { pass: 0, known: 0, total: 0 } };
    const requirementEvaluations: RecommendationResult["requirementEvaluations"] = [];

    for (const rule of entity.rules) {
      const actual = readPath(profile, rule.profileField);
      const result = compareRuleValue(actual, rule.operator, rule.expectedValue);
      const bucket = counts[rule.severity];
      bucket.total += 1;
      if (result !== null) bucket.known += 1;
      if (result === true) {
        bucket.pass += 1;
        reasons.push(rule.explanation);
        reasonCodes.push(`${rule.ruleKey}:pass`);
      } else if (result === false && rule.severity === "hard") {
        failedGates.push(rule.explanation);
        reasonCodes.push(`${rule.ruleKey}:fail`);
      } else if (result === false) {
        openChecks.push(rule.explanation);
        reasonCodes.push(`${rule.ruleKey}:conditional`);
      } else {
        openChecks.push(`Evidence needed: ${rule.explanation}`);
        reasonCodes.push(`${rule.ruleKey}:unknown`);
      }
      requirementEvaluations.push({ ruleId: rule.id, ruleKey: rule.ruleKey, group: rule.ruleGroup, severity: rule.severity, outcome: result === null ? "unknown" : result ? "pass" : "fail", actual: actual ?? null, expected: rule.expectedValue, explanation: rule.explanation });
    }

    const deadline = deadlineScore(entity.deadlineAt, now);
    if (deadline.expired) {
      failedGates.push(deadline.reason);
      reasonCodes.push("deadline:fail");
    } else if (deadline.score < 8) {
      openChecks.push(deadline.reason);
      reasonCodes.push(entity.deadlineAt ? "deadline:risk" : "deadline:unknown");
    } else {
      reasons.push(deadline.reason);
      reasonCodes.push("deadline:pass");
    }

    const hardUnknown = counts.hard.total - counts.hard.known;
    const components: ScoreComponents = {
      eligibility: componentScore(counts.hard.pass, counts.hard.total, recommendationWeights.eligibility, counts.hard.total ? 0 : 10),
      fit: componentScore(counts.soft.pass, counts.soft.total, recommendationWeights.fit, 6),
      funding: signalScore(entity.fundingSignal, recommendationWeights.funding, 5),
      deadline: deadline.score,
      freshness: entity.sourceFreshness === "verified" ? recommendationWeights.freshness : entity.sourceFreshness === "review_due" ? recommendationWeights.freshness / 2 : 0,
      evidence: componentScore(counts.information.pass, counts.information.total, recommendationWeights.evidence, 0),
      affordability: signalScore(entity.affordabilitySignal, recommendationWeights.affordability, 5),
      visaFeasibility: signalScore(entity.visaFeasibilitySignal, recommendationWeights.visaFeasibility, 5),
      careerAlignment: signalScore(entity.careerSignal, recommendationWeights.careerAlignment, 5),
      preference: preferenceScore(profile, entity.countryCode),
    };
    const rawScore = Object.values(components).reduce((sum, value) => sum + value, 0);
    const state: RecommendationResult["state"] = entity.sourceFreshness === "stale" ? "stale" : failedGates.length ? "failed" : hardUnknown || openChecks.length ? "conditional" : entity.rules.length ? "confirmed" : "unknown";
    const score = state === "failed" ? 0 : Math.round(Math.min(state === "stale" ? 55 : 100, rawScore) * 100) / 100;
    const nextActions = [
      ...openChecks.slice(0, 3).map((check) => `Resolve: ${check}`),
      ...(entity.sourceFreshness !== "verified" ? ["Verify the latest official source before relying on this option."] : []),
    ];
    const knownRules = counts.hard.known + counts.soft.known + counts.information.known;
    const evidenceConfidence = entity.rules.length ? Math.round((knownRules / entity.rules.length) * 100) : 0;
    const auditTrace = [
      `${entity.rules.length} versioned requirements evaluated with ${recommendationEngineVersion}.`,
      `${knownRules} requirements had a usable profile value; ${entity.rules.length - knownRules} remained unknown.`,
      `${failedGates.length} hard gates failed and ${openChecks.length} checks remained open.`,
      `Source state: ${entity.sourceFreshness}; research priority is not an admission or award probability.`,
      `Country layer contributed affordability, visa-feasibility, post-study and destination-preference signals.`,
    ];

    return {
      entityId: entity.id,
      entityType: entity.entityType,
      title: entity.title,
      provider: entity.provider,
      state,
      score,
      scoreComponents: components,
      reasonCodes,
      reasons: reasons.slice(0, 6),
      openChecks: openChecks.slice(0, 6),
      failedGates: failedGates.slice(0, 6),
      nextActions,
      ruleVersions: entity.rules.map((rule) => ({ id: rule.id, version: rule.version })),
      evidenceConfidence,
      requirementEvaluations,
      auditTrace,
    };
  }).sort((a, b) => {
    const stateRank = { confirmed: 4, conditional: 3, unknown: 2, stale: 1, failed: 0 };
    return stateRank[b.state] - stateRank[a.state] || b.score - a.score || a.title.localeCompare(b.title);
  });
}
