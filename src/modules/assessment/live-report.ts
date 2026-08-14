import type { RecommendationResult } from "../recommendation/engine";
import { recommendationEngineVersion, recommendationWeights } from "../recommendation/engine";
import type { RequirementOutcome } from "../intelligence/engine";
import type { ActionItem, AssessmentInput, AssessmentReport, PathwayLane } from "./types";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const percent = (value: number, maximum: number) => maximum ? Math.max(0, Math.min(100, Math.round(value / maximum * 100))) : 0;
const text = (value: unknown) => typeof value === "string" ? value : JSON.stringify(value);

function pathway(result: RecommendationResult): PathwayLane {
  const conditions = [...result.failedGates, ...result.openChecks].slice(0, 5);
  return {
    id: result.entityId,
    title: result.title,
    subtitle: `${result.provider}${result.countryCode ? ` · ${countryNames.of(result.countryCode) ?? result.countryCode}` : ""}`,
    state: result.state === "failed" ? "not_recommended" : result.state === "unknown" || result.state === "stale" ? "unknown" : "conditional",
    strength: result.score >= 75 ? "strong" : result.score >= 50 ? "promising" : "explore",
    why: result.reasons.length ? result.reasons.slice(0, 3) : ["The reviewed catalogue does not yet contain enough verified matching evidence."],
    conditions,
    nextAction: result.nextActions[0] ?? "Open the official source and verify the unresolved requirements.",
    sourceLabel: result.sourceFreshness === "verified" ? "Reviewed CandidRoute catalogue" : "Official source review required",
    sourceUrl: result.applicationUrl ?? "",
    evidenceState: result.sourceFreshness === "verified" ? "verified_requirement" : "suggestion",
  };
}

export function applyLiveRecommendations(
  report: AssessmentReport,
  input: AssessmentInput,
  results: RecommendationResult[],
  catalogueVersion: string,
): AssessmentReport {
  const ranked = results.filter((item) => item.state !== "failed").slice(0, 6);
  const visible = (ranked.length ? ranked : results).slice(0, 3);
  const pathways = visible.map(pathway);
  const openChecks = [...new Set(visible.flatMap((item) => item.openChecks))];
  const liveActions: ActionItem[] = openChecks.slice(0, 3).map((check, index) => ({
    id: `live-check-${index + 1}`,
    title: check.replace(/^Evidence needed:\s*/i, "Verify "),
    detail: `This check affects ${visible.filter((item) => item.openChecks.includes(check)).map((item) => item.title).join(", ")}.`,
    horizon: index === 0 ? "Today" : index === 1 ? "This week" : "Next",
    impact: index === 0 ? "critical" : "high",
    complete: false,
  }));
  const opportunities = visible.map((item, index) => ({
    id: item.entityId,
    kind: item.entityType,
    title: item.title,
    provider: item.provider,
    country: item.countryCode ? countryNames.of(item.countryCode) ?? item.countryCode : "Multi-country",
    portfolioRole: (index === 0 ? "preferred" : item.entityType === "scholarship" ? "funding-first" : "verification-backlog") as "preferred" | "funding-first" | "verification-backlog",
    state: (item.state === "confirmed" ? "aligned" : item.state === "failed" ? "blocked" : item.state === "stale" ? "stale" : "conditional") as "aligned" | "conditional" | "blocked" | "stale",
    researchPriority: Math.round(item.score),
    confidence: item.evidenceConfidence,
    components: {
      academic: percent(item.scoreComponents.eligibility + item.scoreComponents.fit, recommendationWeights.eligibility + recommendationWeights.fit),
      language: percent(item.scoreComponents.evidence, recommendationWeights.evidence),
      funding: percent(item.scoreComponents.funding + item.scoreComponents.affordability, recommendationWeights.funding + recommendationWeights.affordability),
      deadline: percent(item.scoreComponents.deadline, recommendationWeights.deadline),
      evidence: item.evidenceConfidence,
      source: percent(item.scoreComponents.freshness, recommendationWeights.freshness),
    },
    requirements: item.requirementEvaluations.map((rule) => ({
      id: rule.ruleId,
      group: (["academic", "language", "funding", "experience", "evidence"].includes(rule.group) ? rule.group : "evidence") as "academic" | "language" | "funding" | "experience" | "evidence",
      label: rule.explanation,
      expected: text(rule.expected),
      actual: text(rule.actual),
      outcome: (rule.outcome === "pass" ? "pass" : rule.outcome === "fail" ? "fail" : "unknown") as RequirementOutcome,
      hard: rule.severity === "hard",
      impact: (rule.severity === "hard" ? "critical" : rule.severity === "soft" ? "high" : "medium") as "critical" | "high" | "medium",
      explanation: rule.explanation,
    })),
    strengths: item.reasons,
    blockers: [...item.failedGates, ...item.openChecks],
    nextActions: item.nextActions,
    deadline: item.deadlineAt ?? "Deadline not confirmed",
    source: {
      label: "Reviewed catalogue and linked official source",
      url: item.applicationUrl ?? "",
      state: item.sourceFreshness === "verified" ? "verified" as const : "review_due" as const,
      reviewedAt: report.generatedAt,
      version: catalogueVersion,
    },
  }));
  const evaluated = visible.flatMap((item) => item.requirementEvaluations);
  const coreActions = report.actionPlan.filter((item) => ["academic-proof", "english-plan", "funding-scenarios"].includes(item.id));

  return {
    ...report,
    headline: pathways.length ? `${pathways[0].title} is your strongest reviewed opportunity right now` : "Your reviewed catalogue needs more matching evidence",
    summary: "This report and every recommendation use the same reviewed database, rule versions and profile snapshot.",
    evidenceGaps: openChecks.length ? openChecks.slice(0, 5) : report.evidenceGaps,
    pathways,
    actionPlan: [...coreActions, ...liveActions].slice(0, 6),
    intelligence: {
      ...report.intelligence,
      engineVersion: recommendationEngineVersion,
      evaluatedAt: report.generatedAt,
      evidenceConfidence: visible.length ? Math.round(visible.reduce((sum, item) => sum + item.evidenceConfidence, 0) / visible.length) : 0,
      opportunities,
      simulations: [],
      portfolio: {
        balance: new Set(visible.map((item) => item.countryCode)).size >= 2 ? "balanced" : "concentrated",
        coverage: Math.min(100, visible.length * 33),
        slots: opportunities.map((item) => ({ role: item.portfolioRole, opportunityId: item.id, reason: item.strengths[0] ?? "Highest current reviewed priority." })),
        ...(visible.length < 3 ? { warning: "Fewer than three reviewed matching opportunities are available." } : {}),
      },
      audit: {
        evaluatedRules: evaluated.length,
        passedRules: evaluated.filter((item) => item.outcome === "pass").length,
        failedRules: evaluated.filter((item) => item.outcome === "fail").length,
        unknownRules: evaluated.filter((item) => item.outcome === "unknown").length,
        sourceVersions: [catalogueVersion],
        trace: [`${results.length} published catalogue records evaluated.`, `${evaluated.length} versioned rules evaluated for ${input.nationality}.`, "Report, recommendations and tasks share this evaluation snapshot."],
      },
    },
  };
}
