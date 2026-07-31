import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to access documents." }, { status: 401 });
  const { data: document, error } = await supabase.from("documents").select("storage_path").eq("id", id).eq("user_id", user.id).single();
  if (error || !document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  const { data, error: signedError } = await supabase.storage.from("student-documents").createSignedUrl(document.storage_path, 60);
  if (signedError) return NextResponse.json({ error: signedError.message }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}

