import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const fileSchema = z.object({ name: z.string().trim().min(1).max(180), mimeType: z.literal("application/pdf"), sizeBytes: z.number().int().positive().max(15 * 1024 * 1024) });

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const parsed = fileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Upload one PDF up to 15 MB." }, { status: 400 });
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Reference submissions are not configured." }, { status: 503 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: recommender } = await admin.from("recommenders").select("id,status,token_expires_at").eq("access_token_hash", hash).maybeSingle();
  if (!recommender || recommender.status === "submitted" || !recommender.token_expires_at || new Date(recommender.token_expires_at).getTime() < Date.now()) return NextResponse.json({ error: "This invitation cannot accept a submission." }, { status: 403 });
  const safeName = parsed.data.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-100);
  const path = `${recommender.id}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await admin.storage.from("confidential-references").createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path, token: data.token });
}

