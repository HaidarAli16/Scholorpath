export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { generateAssessmentReport } from "@/modules/assessment/engine";
import { applyLiveRecommendations } from "@/modules/assessment/live-report";
import { assessmentInputSchema } from "@/modules/assessment/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { guardMutation } from "@/lib/api/security";
import { evaluateCatalogue, persistCatalogueEvaluation } from "@/modules/recommendation/service";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "assessment", { requests: 12, windowSeconds: 60 });
  if (blocked) return blocked;
  const payload = await request.json().catch(() => null);
  const parsed = assessmentInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Some answers need attention.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  if (!isSupabaseConfigured) return NextResponse.json({ error: "The reviewed opportunity database is unavailable." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "The reviewed opportunity database is unavailable." }, { status: 503 });
  let evaluation;
  try {
    evaluation = await evaluateCatalogue(supabase, parsed.data as unknown as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: "Your reviewed opportunities could not be evaluated." }, { status: 503 });
  }
  if (!evaluation.results.length) return NextResponse.json({ error: "No reviewed opportunities are available yet." }, { status: 503 });
  const report = applyLiveRecommendations(generateAssessmentReport(parsed.data), parsed.data, evaluation.results, evaluation.catalogueVersion);
  // Third-party discovery is intentionally kept out of the assessment's critical
  // path. It is loaded independently on Discover and never blocks a report.
  report.liveScholarships = [];
  report.liveDataNotice = "Your report uses validated profile data and the reviewed CandidRoute catalogue. Third-party discovery leads load separately and never determine eligibility.";
  {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const serialized = JSON.stringify(parsed.data);
      const requestHash = createHash("sha256").update(serialized).digest("hex");
      const idempotencyKey = request.headers.get("idempotency-key")?.trim() || randomUUID();
      const tasks = report.actionPlan.map((item, index) => ({
        key: item.id,
        title: item.title,
        description: item.detail,
        priority: item.impact === "critical" ? 1 : item.impact === "high" ? 2 : 3,
        estimated_minutes: 15 + index * 10,
        impact_type: item.id === "funding-scenarios" ? "funding" : item.id.startsWith("requirement-") ? "eligibility" : "profile",
        impact_level: item.impact,
        impact_score: item.impact === "critical" ? 90 : item.impact === "high" ? 72 : 48,
        evidence_required: item.id === "academic-proof" ? ["Transcript", "Degree status", "Official grading scale"] : item.id.startsWith("requirement-") ? ["Official source", "Supporting student evidence"] : [],
      }));
      const { data: submission, error } = await supabase.rpc("submit_assessment", {
        p_profile: { first_name: parsed.data.firstName, nationality: parsed.data.nationality, current_country: parsed.data.currentCountry, preferred_currency: parsed.data.budgetCurrency },
        p_answers: parsed.data,
        p_report: report,
        p_tasks: tasks,
        p_engine_version: report.intelligence.engineVersion,
        p_rule_snapshot_version: evaluation.catalogueVersion,
        p_request_hash: requestHash,
        p_idempotency_key: idempotencyKey,
      });
      if (error) return NextResponse.json({ error: "Your assessment could not be saved atomically." }, { status: 500 });
      const assessmentId = (submission as { assessment_id?: string } | null)?.assessment_id ?? null;
      if (assessmentId) {
        const persistenceClient = createSupabaseAdminClient();
        if (!persistenceClient) return NextResponse.json({ error: "Secure recommendation persistence is unavailable." }, { status: 503 });
        try {
          await supabase.rpc("store_intelligence_report", {
            p_assessment_id: assessmentId,
            p_report: report.intelligence,
          });
          await persistCatalogueEvaluation(persistenceClient, {
            userId: user.id,
            assessmentId,
            profile: parsed.data as unknown as Record<string, unknown>,
            results: evaluation.results,
            catalogueVersion: evaluation.catalogueVersion,
          });
        } catch {
          return NextResponse.json({ error: "Your report was saved, but its recommendation snapshot could not be recorded. Please retry." }, { status: 500 });
        }
      }
      return NextResponse.json({ ...report, intelligencePersistence: { status: "stored", runId: assessmentId }, recommendation: { status: assessmentId ? "ready" : "unavailable", resultCount: evaluation.results.length } });
    }
  }

  return NextResponse.json(report);
}
