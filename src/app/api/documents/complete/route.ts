export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guardMutation } from "@/lib/api/security";

const completeSchema = z.object({
  path: z.string().min(10).max(400),
  name: z.string().trim().min(1).max(180),
  category: z.string().trim().min(2).max(80),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z.number().int().positive().max(15 * 1024 * 1024),
});

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "document-complete", { requests: 20, windowSeconds: 300 });
  if (blocked) return blocked;
  const parsed = completeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid document record." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save documents." }, { status: 401 });
  if (!parsed.data.path.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Document path is not owned by this account." }, { status: 403 });

  const objectName = parsed.data.path.slice(user.id.length + 1);
  const { data: objects, error: objectError } = await supabase.storage.from("student-documents").list(user.id, { search: objectName, limit: 2 });
  const object = objects?.find((item) => item.name === objectName);
  const storedSize = Number(object?.metadata?.size ?? 0);
  const storedType = String(object?.metadata?.mimetype ?? "");
  if (objectError || !object || storedSize !== parsed.data.sizeBytes || storedType !== parsed.data.mimeType) {
    return NextResponse.json({ error: "The uploaded object could not be verified. Upload it again." }, { status: 409 });
  }

  const { data, error } = await supabase.rpc("register_document", { p_storage_path: parsed.data.path, p_name: parsed.data.name, p_category: parsed.data.category, p_mime_type: parsed.data.mimeType, p_size_bytes: parsed.data.sizeBytes });
  if (error) return NextResponse.json({ error: "Document upload could not be completed." }, { status: 500 });
  return NextResponse.json({ ok: true, document: data });
}
