import { NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { recommendationEngineVersion } from "@/modules/recommendation/engine";
import { evaluateCatalogue } from "@/modules/recommendation/service";

const profileSchema = z.record(z.string(), z.unknown());

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "recommendations", { requests: 20, windowSeconds: 60 });
  if (blocked) return blocked;
  if (!isSupabaseConfigured) return NextResponse.json({ mode: "demo", engineVersion: recommendationEngineVersion, results: [], message: "Connect Supabase and publish catalogue rules to run live recommendations." });
  const payload = await request.json().catch(() => ({}));
  const parsedProfile = profileSchema.safeParse(payload.profile ?? {});
  if (!parsedProfile.success) return NextResponse.json({ error: "Invalid recommendation profile." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  let profile = parsedProfile.data;
  let assessmentId: string | null = null;
  if (user && Object.keys(profile).length === 0) {
    const { data: assessment } = await supabase.from("assessments").select("id,answers").eq("user_id", user.id).eq("status", "completed").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    profile = (assessment?.answers as Record<string, unknown> | null) ?? {};
    assessmentId = assessment?.id ?? null;
  }
  if (Object.keys(profile).length === 0) return NextResponse.json({ error: "A completed profile is required." }, { status: 400 });
  try {
    const evaluation = await evaluateCatalogue(supabase, profile, { userId: user?.id, assessmentId });
    return NextResponse.json({ mode: "live", engineVersion: recommendationEngineVersion, evaluatedAt: new Date().toISOString(), ...evaluation });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Recommendations could not be evaluated." }, { status: 500 });
  }
}
