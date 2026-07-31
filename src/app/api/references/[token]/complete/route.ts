import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { guardMutation } from "@/lib/api/security";

const completionSchema = z.object({ path: z.string().min(20).max(400) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const blocked = await guardMutation(request, "reference-complete", { requests: 8, windowSeconds: 300 });
  if (blocked) return blocked;
  const parsed = completionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Reference submissions are not configured." }, { status: 503 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: recommender } = await admin.from("recommenders").select("id,status,token_expires_at").eq("access_token_hash", hash).maybeSingle();
  if (!recommender || recommender.status === "submitted" || !recommender.token_expires_at || new Date(recommender.token_expires_at).getTime() < Date.now() || !parsed.data.path.startsWith(`${recommender.id}/`)) return NextResponse.json({ error: "Invalid, expired, or already used invitation." }, { status: 403 });
  const objectName = parsed.data.path.slice(recommender.id.length + 1);
  const { data: objects } = await admin.storage.from("confidential-references").list(recommender.id, { search: objectName, limit: 2 });
  if (!objects?.some((item) => item.name === objectName)) return NextResponse.json({ error: "Uploaded reference could not be verified." }, { status: 409 });
  const { data: completed, error } = await admin.from("recommenders").update({ status: "submitted", submitted_at: new Date().toISOString(), confidential_storage_path: parsed.data.path, access_token_hash: null }).eq("id", recommender.id).eq("status", recommender.status).eq("access_token_hash", hash).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!completed) return NextResponse.json({ error: "This invitation was already completed." }, { status: 409 });
  return NextResponse.json({ ok: true });
}
