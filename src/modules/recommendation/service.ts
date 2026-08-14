import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { evaluateRecommendations, recommendationEngineVersion, recommendationWeights, type AtomicRule, type RecommendationEntity, type RecommendationResult } from "./engine";

export async function persistCatalogueEvaluation(
  persistenceClient: SupabaseClient,
  input: { userId: string; assessmentId?: string | null; profile: Record<string, unknown>; results: RecommendationResult[]; catalogueVersion: string },
) {
  const { data: runId, error } = await persistenceClient.rpc("store_recommendation_run", {
    p_user_id: input.userId,
    p_assessment_id: input.assessmentId ?? null,
    p_engine_version: recommendationEngineVersion,
    p_catalogue_version: input.catalogueVersion,
    p_profile_snapshot: input.profile,
    p_weights: recommendationWeights,
    p_results: input.results,
  });
  if (error) throw new Error(`Recommendations could not be recorded: ${error.message}`);
  return runId as string;
}

export async function evaluateCatalogue(
  supabase: SupabaseClient,
  profile: Record<string, unknown>,
  options: { userId?: string | null; assessmentId?: string | null; persistenceClient?: SupabaseClient | null } = {},
) {
  const [programmesResult, scholarshipsResult, rulesResult, countriesResult] = await Promise.all([
    supabase.from("programmes").select("id,title,institution_name,institution_id,country_code,deadline_at,last_verified_at,next_review_at,updated_at,tuition_amount,tuition_currency,application_url,attributes").eq("state", "published"),
    supabase.from("scholarships").select("id,title,provider_name,country_code,deadline_at,last_verified_at,next_review_at,updated_at,award_value,application_url,attributes").eq("state", "published"),
    supabase.from("atomic_rules").select("id,entity_type,entity_id,rule_key,rule_group,operator,profile_field,expected_value,severity,explanation,version").eq("state", "published"),
    supabase.from("countries").select("code,currency_code,visa_difficulty,post_study_months,monthly_cost_low,monthly_cost_high").eq("state", "published"),
  ]);
  const error = programmesResult.error || scholarshipsResult.error || rulesResult.error || countriesResult.error;
  if (error) throw new Error(`Published catalogue could not be evaluated: ${error.message}`);

  const ruleMap = new Map<string, AtomicRule[]>();
  for (const rule of rulesResult.data ?? []) {
    const key = `${rule.entity_type}:${rule.entity_id}`;
    const list = ruleMap.get(key) ?? [];
    list.push({ id: rule.id, ruleKey: rule.rule_key, ruleGroup: rule.rule_group, operator: rule.operator, profileField: rule.profile_field, expectedValue: rule.expected_value, severity: rule.severity, explanation: rule.explanation, version: rule.version } as AtomicRule);
    ruleMap.set(key, list);
  }

  const now = Date.now();
  const countryMap = new Map((countriesResult.data ?? []).map((country) => [country.code, country]));
  const countrySignals = (code?: string | null) => {
    const country = code ? countryMap.get(code) : null;
    const visa = country?.visa_difficulty === "lower" ? 8 : country?.visa_difficulty === "moderate" ? 6 : country?.visa_difficulty === "higher" ? 3 : undefined;
    const monthlyCost = Number(country?.monthly_cost_high ?? country?.monthly_cost_low ?? 0);
    const monthlyBudget = Number(profile.availableBudget ?? 0) / 12;
    const comparableCurrency = String(profile.budgetCurrency ?? "") === String((country as { currency_code?: string } | null)?.currency_code ?? "");
    const affordability = comparableCurrency && monthlyCost > 0 ? Math.max(0, Math.min(10, monthlyBudget / monthlyCost * 10)) : undefined;
    return { affordabilitySignal: affordability, visaFeasibilitySignal: visa, careerSignal: undefined };
  };
  const freshness = (lastVerifiedAt: string | null, nextReviewAt: string | null) => !lastVerifiedAt ? "stale" as const : nextReviewAt && new Date(nextReviewAt).getTime() < now ? "review_due" as const : "verified" as const;
  const entities: RecommendationEntity[] = [
    ...(programmesResult.data ?? []).map((item) => {
      const sameCurrency = String(profile.budgetCurrency ?? "") === String(item.tuition_currency ?? "");
      const budget = Number(profile.availableBudget ?? 0);
      const tuition = Number(item.tuition_amount ?? 0);
      const fundingSignal = sameCurrency && budget > 0 && tuition > 0 ? Math.max(0, Math.min(10, budget / tuition * 10)) : undefined;
      return { id: item.id, entityType: "programme" as const, title: item.title, provider: item.institution_name, countryCode: item.country_code, deadlineAt: item.deadline_at, applicationUrl: item.application_url, sourceFreshness: freshness(item.last_verified_at, item.next_review_at), fundingSignal, ...countrySignals(item.country_code), rules: ruleMap.get(`programme:${item.id}`) ?? [] };
    }),
    ...(scholarshipsResult.data ?? []).map((item) => {
      const award = item.award_value as Record<string, unknown> | null;
      const fundingType = String(award?.funding_type ?? "");
      const fundingSignal = fundingType === "full" || fundingType === "full_award" ? 10 : fundingType === "partial" ? 6 : undefined;
      return { id: item.id, entityType: "scholarship" as const, title: item.title, provider: item.provider_name, countryCode: item.country_code, deadlineAt: item.deadline_at, applicationUrl: item.application_url, sourceFreshness: freshness(item.last_verified_at, item.next_review_at), fundingSignal, ...countrySignals(item.country_code), rules: ruleMap.get(`scholarship:${item.id}`) ?? [] };
    }),
  ];
  const results = evaluateRecommendations(profile, entities);
  const catalogueVersion = createHash("sha256").update(JSON.stringify({
    entities: [...(programmesResult.data ?? []), ...(scholarshipsResult.data ?? [])].map((item) => [item.id, item.updated_at, item.last_verified_at]).sort(),
    rules: (rulesResult.data ?? []).map((item) => [item.id, item.version]).sort(),
  })).digest("hex");

  if (options.userId) {
    if (!options.persistenceClient) throw new Error("Secure recommendation persistence is not configured.");
    const runId = await persistCatalogueEvaluation(options.persistenceClient, { userId: options.userId, assessmentId: options.assessmentId, profile, results, catalogueVersion });
    return { results, runId: runId as string, catalogueVersion };
  }
  return { results, runId: null, catalogueVersion };
}
