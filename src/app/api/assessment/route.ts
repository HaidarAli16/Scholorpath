import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { generateAssessmentReport } from "@/modules/assessment/engine";
import { assessmentInputSchema } from "@/modules/assessment/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { guardMutation } from "@/lib/api/security";
import { evaluateCatalogue } from "@/modules/recommendation/service";
import { fetchLiveScholarships } from "@/modules/catalogue/live-scholarships";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "assessment", { requests: 12, windowSeconds: 60 });
  if (blocked) return blocked;
  const payload = await request.json().catch(() => null);
  const parsed = assessmentInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Some answers need attention.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const report = generateAssessmentReport(parsed.data);
  const liveDiscovery = await fetchLiveScholarships(parsed.data, 6).catch(() => null);
  report.liveScholarships = liveDiscovery?.items ?? [];
  report.liveDataNotice = report.liveScholarships.length
    ? "Live discovery results are third-party leads, not verified eligibility. CandidRoute will only promote them after an official source, cycle and deadline are attached."
    : "The live discovery feed was unavailable. Your pathway report was generated from validated profile data and can be refreshed later.";
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase!.auth.getUser();
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
      const { data: submission, error } = await supabase!.rpc("submit_assessment", {
        p_profile: { first_name: parsed.data.firstName, nationality: parsed.data.nationality, current_country: parsed.data.currentCountry, preferred_currency: parsed.data.budgetCurrency },
        p_answers: parsed.data,
        p_report: report,
        p_tasks: tasks,
        p_engine_version: "assessment-3.0.0",
        p_rule_snapshot_version: "foundation-2026-07-31",
        p_request_hash: requestHash,
        p_idempotency_key: idempotencyKey,
      });
      if (error) return NextResponse.json({ error: "Your assessment could not be saved atomically." }, { status: 500 });
      const assessmentId = (submission as { assessment_id?: string } | null)?.assessment_id ?? null;
      let intelligenceRunId: string | null = null;
      if (assessmentId) {
        const { data: storedIntelligence } = await supabase!.rpc("store_intelligence_report", {
          p_assessment_id: assessmentId,
          p_report: report.intelligence,
        });
        intelligenceRunId = typeof storedIntelligence === "string" ? storedIntelligence : null;
      }
      try {
        const recommendation = await evaluateCatalogue(supabase!, parsed.data as unknown as Record<string, unknown>, { userId: user.id, assessmentId, persistenceClient: createSupabaseAdminClient() });
        return NextResponse.json({ ...report, intelligencePersistence: { status: intelligenceRunId ? "ready" : "pending", runId: intelligenceRunId }, recommendation: { status: "ready", runId: recommendation.runId, resultCount: recommendation.results.length, results: recommendation.results } });
      } catch {
        return NextResponse.json({ ...report, intelligencePersistence: { status: intelligenceRunId ? "ready" : "pending", runId: intelligenceRunId }, recommendation: { status: "queued", resultCount: 0 } });
      }
    }
  }

  return NextResponse.json(report);
}
