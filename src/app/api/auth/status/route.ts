export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ configured: false, authenticated: false, mode: "unavailable" }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  return NextResponse.json({ configured: true, authenticated: Boolean(user), mode: user ? "live" : "unauthenticated", user: user ? { id: user.id, email: user.email } : null });
}
