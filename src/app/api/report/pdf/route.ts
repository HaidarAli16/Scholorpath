export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { guardMutation } from "@/lib/api/security";
import { buildPathwayReportPdf } from "@/lib/report/pathway-pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssessmentInput, AssessmentReport } from "@/modules/assessment/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "report-pdf", { requests: 6, windowSeconds: 60 });
  if (blocked) return blocked;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Report export is unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to download your report." }, { status: 401 });
  try {
    const { data: storedReport, error: reportError } = await supabase
      .from("pathway_reports")
      .select("assessment_id,report")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (reportError || !storedReport) return NextResponse.json({ error: "Complete your assessment before downloading a report." }, { status: 404 });
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("answers")
      .eq("id", storedReport.assessment_id)
      .eq("user_id", user.id)
      .single();
    if (assessmentError || !assessment) return NextResponse.json({ error: "The saved assessment for this report is unavailable." }, { status: 404 });
    const profile = assessment.answers as Partial<AssessmentInput>;
    const report = storedReport.report as unknown as AssessmentReport;
    const bytes = await buildPathwayReportPdf(profile, report, { access: "pro" });
    const firstName = String(profile.firstName || "Student").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "Student";
    return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="CandidRoute-${firstName}-Pathway-Report.pdf"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "The PDF could not be generated." }, { status: 500 });
  }
}
