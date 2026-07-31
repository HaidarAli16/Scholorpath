import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { evaluateRecommendations, recommendationEngineVersion, type AtomicRule, type RecommendationEntity } from "@/modules/recommendation/engine";

const profileSchema = z.record(z.string(), z.unknown());

export async function POST(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ mode: "demo", engineVersion: recommendationEngineVersion, results: [], message: "Connect Supabase and publish catalogue rules to run live recommendations." });
  const payload = await request.json().catch(() => ({}));
  const parsedProfile = profileSchema.safeParse(payload.profile ?? {});
  if (!parsedProfile.success) return NextResponse.json({ error: "Invalid recommendation profile." }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  let profile = parsedProfile.data;

  if (user && Object.keys(profile).length === 0) {
    const { data: assessment } = await supabase.from("assessments").select("answers").eq("user_id", user.id).eq("status", "completed").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    profile = (assessment?.answers as Record<string, unknown> | null) ?? {};
  }
  if (Object.keys(profile).length === 0) return NextResponse.json({ error: "A completed profile is required." }, { status: 400 });

  const [programmesResult, scholarshipsResult, rulesResult] = await Promise.all([
    supabase.from("programmes").select("id,title,institution_name,country_code,deadline_at,last_verified_at,next_review_at,attributes").eq("state", "published"),
    supabase.from("scholarships").select("id,title,provider_name,country_code,deadline_at,last_verified_at,next_review_at,award_value,attributes").eq("state", "published"),
    supabase.from("atomic_rules").select("id,entity_type,entity_id,rule_key,rule_group,operator,profile_field,expected_value,severity,explanation,version").eq("state", "published"),
  ]);
  const error = programmesResult.error || scholarshipsResult.error || rulesResult.error;
  if (error) return NextResponse.json({ error: "Published catalogue could not be evaluated.", detail: error.message }, { status: 500 });

  const rules = rulesResult.data ?? [];
  const ruleMap = new Map<string, AtomicRule[]>();
  for (const rule of rules) {
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

  if (user && results.length) {
    const rows = results.map((result) => ({ user_id: user.id, entity_type: result.entityType, entity_id: result.entityId, state: result.state, score: result.score, reason_codes: result.reasonCodes, open_checks: result.openChecks, rule_versions: result.ruleVersions, engine_version: recommendationEngineVersion }));
    await supabase.from("match_evaluations").upsert(rows, { onConflict: "user_id,entity_type,entity_id,engine_version" });
  }

  return NextResponse.json({ mode: "live", engineVersion: recommendationEngineVersion, evaluatedAt: new Date().toISOString(), results });
}

