import { NextResponse } from "next/server";
import { generateAssessmentReport } from "@/modules/assessment/engine";
import { assessmentInputSchema } from "@/modules/assessment/schema";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = assessmentInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Some answers need attention.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  return NextResponse.json(generateAssessmentReport(parsed.data));
}

