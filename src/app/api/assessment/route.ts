import { NextResponse } from "next/server";
import { generateAssessmentReport } from "@/modules/assessment/engine";
import { assessmentInputSchema } from "@/modules/assessment/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = assessmentInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Some answers need attention.", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const report = generateAssessmentReport(parsed.data);
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase!.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase!.from("student_profiles").upsert({ user_id: user.id, first_name: parsed.data.firstName, nationality: parsed.data.nationality, current_country: parsed.data.currentCountry, preferred_currency: parsed.data.budgetCurrency }, { onConflict: "user_id" });
      if (profileError) return NextResponse.json({ error: "Your profile could not be saved.", detail: profileError.message }, { status: 500 });
      const { data: assessment, error: assessmentError } = await supabase!.from("assessments").insert({ user_id: user.id, version: 2, status: "completed", answers: parsed.data, completion_percent: 100, completed_at: report.generatedAt }).select("id").single();
      if (assessmentError) return NextResponse.json({ error: "Your assessment could not be saved.", detail: assessmentError.message }, { status: 500 });
      const [{ error: reportError }, { error: taskError }] = await Promise.all([
        supabase!.from("pathway_reports").insert({ assessment_id: assessment.id, user_id: user.id, engine_version: "assessment-2.0.0", rule_snapshot_version: "foundation-2026-07-31", report }),
        supabase!.from("tasks").insert(report.actionPlan.map((item, index) => ({ user_id: user.id, title: item.title, description: item.detail, state: "todo", priority: item.impact === "critical" ? 1 : item.impact === "high" ? 2 : 3, system_generated: true, estimated_minutes: 15 + index * 10 }))),
      ]);
      if (reportError || taskError) return NextResponse.json({ error: "Your report was generated but its workspace could not be completed.", detail: (reportError || taskError)?.message }, { status: 500 });
    }
  }

  return NextResponse.json(report);
}