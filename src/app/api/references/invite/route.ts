export const preferredRegion = "sin1";

import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guardMutation } from "@/lib/api/security";

const invitationSchema = z.object({ applicationId: z.string().uuid(), name: z.string().trim().min(2).max(120), email: z.string().email().max(254) });

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "reference-invite", { requests: 12, windowSeconds: 300 });
  if (blocked) return blocked;
  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Valid recommender details are required." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to invite a recommender." }, { status: 401 });
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("invite_recommender", { p_application_id: parsed.data.applicationId, p_name: parsed.data.name, p_email: parsed.data.email, p_token_hash: tokenHash, p_expires_at: expires });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "P0002" ? 404 : 500 });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ ok: true, invitation: data, submissionUrl: `${origin}/reference/${token}`, delivery: "ready_for_email" });
}
