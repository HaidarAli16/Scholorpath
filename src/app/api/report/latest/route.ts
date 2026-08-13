export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Report storage is unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to reopen a saved report." }, { status: 401 });
  const { data: row, error } = await supabase
    .from("pathway_reports")
    .select("assessment_id,engine_version,rule_snapshot_version,report,generated_at")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "The saved report could not be loaded." }, { status: 500 });
  if (!row) return NextResponse.json({ report: null, profile: null });
  const { data: assessment } = await supabase.from("assessments").select("answers").eq("id", row.assessment_id).eq("user_id", user.id).maybeSingle();
  return NextResponse.json({ report: row.report, profile: assessment?.answers ?? {}, metadata: { assessmentId: row.assessment_id, engineVersion: row.engine_version, ruleSnapshotVersion: row.rule_snapshot_version, generatedAt: row.generated_at } });
}
