export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Readiness database is not configured." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const result = await supabase.from("application_readiness_snapshots").select("*,applications(title)").eq("user_id", user.id).eq("application_id", id).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (result.error) return NextResponse.json({ error: "Readiness could not be loaded." }, { status: 500 });
  return NextResponse.json(result.data);
}
