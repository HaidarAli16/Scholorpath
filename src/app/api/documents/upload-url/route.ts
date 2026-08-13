import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guardMutation } from "@/lib/api/security";

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(180),
  category: z.string().trim().min(2).max(80),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z.number().int().positive().max(15 * 1024 * 1024),
});

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "document-upload", { requests: 20, windowSeconds: 300 });
  if (blocked) return blocked;
  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The file is not supported.", issues: parsed.error.flatten() }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload documents." }, { status: 401 });

  const safeName = parsed.data.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-100);
  const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { data, error } = await supabase.storage.from("student-documents").createSignedUploadUrl(storagePath);
  if (error) return NextResponse.json({ error: "Secure upload could not be prepared." }, { status: 500 });

  return NextResponse.json({
    path: storagePath,
    token: data.token,
    metadata: parsed.data,
  });
}
