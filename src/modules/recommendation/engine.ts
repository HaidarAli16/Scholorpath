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
  sourceFreshness: "verified" | "review_due" | "stale";
  rules: AtomicRule[];
};

export type RecommendationResult = {
  entityId: string;
  entityType: "programme" | "scholarship";
  title: string;
  provider: string;
  state: "confirmed" | "conditional" | "failed" | "unknown" | "stale";
  score: number;
  reasonCodes: string[];
  reasons: string[];
  openChecks: string[];
  failedGates: string[];
  ruleVersions: { id: string; version: number }[];
};

export const recommendationEngineVersion = "rules-1.0.0";

function readPath(profile: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, profile);
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [value];
}

function compare(actual: unknown, operator: RuleOperator, expected: unknown): boolean | null {
  if (operator === "exists") return actual !== undefined && actual !== null && actual !== "";
  if (actual === undefined || actual === null || actual === "") return null;
  if (operator === "eq") return actual === expected;
  if (operator === "neq") return actual !== expected;
  if (operator === "in") return toArray(expected).includes(actual);
  if (operator === "not_in") return !toArray(expected).includes(actual);
  if (operator === "gte") return typeof actual === "number" && typeof expected === "number" ? actual >= expected : null;
  if (operator === "lte") return typeof actual === "number" && typeof expected === "number" ? actual <= expected : null;
  const actualValues = toArray(actual);
  const expectedValues = toArray(expected);
  if (operator === "contains_any") return expectedValues.some((value) => actualValues.includes(value));
  if (operator === "contains_all") return expectedValues.every((value) => actualValues.includes(value));
  return null;
}

export function evaluateRecommendations(profile: Record<string, unknown>, entities: RecommendationEntity[]): RecommendationResult[] {
  return entities.map((entity) => {
    const reasons: string[] = [];
    const openChecks: string[] = [];
    const failedGates: string[] = [];
    const reasonCodes: string[] = [];
    let earned = 0;
    let possible = 0;

    for (const rule of entity.rules) {
      const result = compare(readPath(profile, rule.profileField), rule.operator, rule.expectedValue);
      const weight = rule.severity === "hard" ? 4 : rule.severity === "soft" ? 2 : 1;
      possible += weight;
      if (result === true) {
        earned += weight;
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
    }

    const evidenceScore = possible ? (earned / possible) * 75 : 30;
    const freshnessScore = entity.sourceFreshness === "verified" ? 15 : entity.sourceFreshness === "review_due" ? 7 : 0;
    const fundingScore = Math.max(0, Math.min(10, entity.fundingSignal ?? 5));
    const score = Math.round((evidenceScore + freshnessScore + fundingScore) * 100) / 100;
    const state: RecommendationResult["state"] = entity.sourceFreshness === "stale" ? "stale" : failedGates.length ? "failed" : openChecks.length ? "conditional" : entity.rules.length ? "confirmed" : "unknown";

    return {
      entityId: entity.id,
      entityType: entity.entityType,
      title: entity.title,
      provider: entity.provider,
      state,
      score,
      reasonCodes,
      reasons: reasons.slice(0, 5),
      openChecks: openChecks.slice(0, 5),
      failedGates: failedGates.slice(0, 5),
      ruleVersions: entity.rules.map((rule) => ({ id: rule.id, version: rule.version })),
    };
  }).sort((a, b) => {
    const stateRank = { confirmed: 4, conditional: 3, unknown: 2, stale: 1, failed: 0 };
    return stateRank[b.state] - stateRank[a.state] || b.score - a.score;
  });
}

