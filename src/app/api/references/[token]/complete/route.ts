import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const completionSchema = z.object({ path: z.string().min(20).max(400) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = completionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Reference submissions are not configured." }, { status: 503 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: recommender } = await admin.from("recommenders").select("id,status,token_expires_at").eq("access_token_hash", hash).maybeSingle();
  if (!recommender || recommender.status === "submitted" || !parsed.data.path.startsWith(`${recommender.id}/`)) return NextResponse.json({ error: "Invalid submission ownership." }, { status: 403 });
  const { error } = await admin.from("recommenders").update({ status: "submitted", submitted_at: new Date().toISOString(), confidential_storage_path: parsed.data.path }).eq("id", recommender.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

