import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { evaluateRecommendations, recommendationEngineVersion, recommendationWeights, type AtomicRule, type RecommendationEntity } from "./engine";

export async function evaluateCatalogue(
  supabase: SupabaseClient,
  profile: Record<string, unknown>,
  options: { userId?: string | null; assessmentId?: string | null; persistenceClient?: SupabaseClient | null } = {},
) {
  const [programmesResult, scholarshipsResult, rulesResult] = await Promise.all([
    supabase.from("programmes").select("id,title,institution_name,country_code,deadline_at,last_verified_at,next_review_at,updated_at,attributes").eq("state", "published"),
    supabase.from("scholarships").select("id,title,provider_name,country_code,deadline_at,last_verified_at,next_review_at,updated_at,award_value,attributes").eq("state", "published"),
    supabase.from("atomic_rules").select("id,entity_type,entity_id,rule_key,rule_group,operator,profile_field,expected_value,severity,explanation,version").eq("state", "published"),
  ]);
  const error = programmesResult.error || scholarshipsResult.error || rulesResult.error;
  if (error) throw new Error(`Published catalogue could not be evaluated: ${error.message}`);

  const ruleMap = new Map<string, AtomicRule[]>();
  for (const rule of rulesResult.data ?? []) {
    const key = `${rule.entity_type}:${rule.entity_id}`;
    const list = ruleMap.get(key) ?? [];
    list.push({ id: rule.id, ruleKey: rule.rule_key, ruleGroup: rule.rule_group, operator: rule.operator, profileField: rule.profile_field, expectedValue: rule.expected_value, severity: rule.severity, explanation: rule.explanation, version: rule.version } as AtomicRule);
    ruleMap.set(key, list);
  }

  const now = Date.now();
  const freshness = (lastVerifiedAt: string | null, nextReviewAt: string | null) => !lastVerifiedAt ? "stale" as const : nextReviewAt && new Date(nextReviewAt).getTime() < now ? "review_due" as const : "verified" as const;
  const entities: RecommendationEntity[] = [
    ...(programmesResult.data ?? []).map((item) => ({ id: item.id, entityType: "programme" as const, title: item.title, provider: item.institution_name, countryCode: item.country_code, deadlineAt: item.deadline_at, sourceFreshness: freshness(item.last_verified_at, item.next_review_at), fundingSignal: Number((item.attributes as Record<string, unknown> | null)?.funding_signal ?? 4), rules: ruleMap.get(`programme:${item.id}`) ?? [] })),
    ...(scholarshipsResult.data ?? []).map((item) => ({ id: item.id, entityType: "scholarship" as const, title: item.title, provider: item.provider_name, countryCode: item.country_code, deadlineAt: item.deadline_at, sourceFreshness: freshness(item.last_verified_at, item.next_review_at), fundingSignal: Number((item.attributes as Record<string, unknown> | null)?.funding_signal ?? 10), rules: ruleMap.get(`scholarship:${item.id}`) ?? [] })),
  ];
  const results = evaluateRecommendations(profile, entities);
  const catalogueVersion = createHash("sha256").update(JSON.stringify({
    entities: [...(programmesResult.data ?? []), ...(scholarshipsResult.data ?? [])].map((item) => [item.id, item.updated_at, item.last_verified_at]).sort(),
    rules: (rulesResult.data ?? []).map((item) => [item.id, item.version]).sort(),
  })).digest("hex");

  if (options.userId) {
    if (!options.persistenceClient) throw new Error("Secure recommendation persistence is not configured.");
    const { data: runId, error: persistError } = await options.persistenceClient.rpc("store_recommendation_run", {
      p_user_id: options.userId,
      p_assessment_id: options.assessmentId ?? null,
      p_engine_version: recommendationEngineVersion,
      p_catalogue_version: catalogueVersion,
      p_profile_snapshot: profile,
      p_weights: recommendationWeights,
      p_results: results,
    });
    if (persistError) throw new Error(`Recommendations could not be recorded: ${persistError.message}`);
    return { results, runId: runId as string, catalogueVersion };
  }
  return { results, runId: null, catalogueVersion };
}
