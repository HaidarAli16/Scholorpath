export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation } from "@/lib/api/security";
import { buildPathwayReportPdf } from "@/lib/report/pathway-pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AssessmentInput, AssessmentReport } from "@/modules/assessment/types";

export const runtime = "nodejs";

const payloadSchema = z.object({
  profile: z.record(z.string(), z.unknown()).default({}),
  report: z.object({
    generatedAt: z.string().min(1), profileCompleteness: z.number().min(0).max(100),
    confidence: z.string(), headline: z.string().min(1).max(500), summary: z.string().min(1).max(4000),
    snapshot: z.record(z.string(), z.string()), readiness: z.array(z.unknown()).max(20),
    evidenceGaps: z.array(z.string()).max(50), pathways: z.array(z.unknown()).max(20),
    actionPlan: z.array(z.unknown()).max(50), assumptions: z.array(z.string()).max(50), intelligence: z.unknown(),
  }).passthrough(),
});

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "report-pdf", { requests: 6, windowSeconds: 60 });
  if (blocked) return blocked;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Report export is unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to download your report." }, { status: 401 });
  const raw = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "The report is incomplete and cannot be exported." }, { status: 400 });
  try {
    const { data: entitlement } = await supabase.from("subscription_entitlements").select("plan_code,status,current_period_end").eq("user_id", user.id).maybeSingle();
    const periodValid = !entitlement?.current_period_end || new Date(entitlement.current_period_end).getTime() > Date.now();
    const isPro = entitlement?.plan_code === "pro" && ["active", "trialing"].includes(entitlement.status) && periodValid;
    const bytes = await buildPathwayReportPdf(parsed.data.profile as Partial<AssessmentInput>, parsed.data.report as unknown as AssessmentReport, { access: isPro ? "pro" : "free" });
    const firstName = String(parsed.data.profile.firstName || "Student").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "Student";
    return new NextResponse(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="CandidRoute-${firstName}-Pathway-Report.pdf"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "The PDF could not be generated." }, { status: 500 });
  }
}
