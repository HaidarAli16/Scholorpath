import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const invitationSchema = z.object({ applicationId: z.string().uuid(), name: z.string().trim().min(2).max(120), email: z.string().email().max(254) });

export async function POST(request: Request) {
  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Valid recommender details are required." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to invite a recommender." }, { status: 401 });
  const { data: application } = await supabase.from("applications").select("id").eq("id", parsed.data.applicationId).eq("user_id", user.id).maybeSingle();
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("recommenders").insert({ user_id: user.id, application_id: application.id, name: parsed.data.name, email: parsed.data.email, status: "invited", access_token_hash: tokenHash, token_expires_at: expires, invited_at: new Date().toISOString() }).select("id,status,invited_at,token_expires_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const origin = new URL(request.url).origin;
  return NextResponse.json({ ok: true, invitation: data, submissionUrl: `${origin}/reference/${token}`, delivery: "ready_for_email" });
}

