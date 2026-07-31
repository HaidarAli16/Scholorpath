import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const completeSchema = z.object({
  path: z.string().min(10).max(400),
  name: z.string().trim().min(1).max(180),
  category: z.string().trim().min(2).max(80),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z.number().int().positive().max(15 * 1024 * 1024),
});

export async function POST(request: Request) {
  const parsed = completeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid document record." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save documents." }, { status: 401 });
  if (!parsed.data.path.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Document path is not owned by this account." }, { status: 403 });

  const { data, error } = await supabase.from("documents").insert({
    user_id: user.id,
    storage_path: parsed.data.path,
    name: parsed.data.name,
    category: parsed.data.category,
    mime_type: parsed.data.mimeType,
    size_bytes: parsed.data.sizeBytes,
    status: "uploaded",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, document: data });
}

