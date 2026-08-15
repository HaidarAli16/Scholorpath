export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTHENTICATED_BETA_ACCESS } from "@/lib/product/entitlements";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ plan: "free", active: false }, { headers: { "Cache-Control": "private, no-store" } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  return NextResponse.json(AUTHENTICATED_BETA_ACCESS, { headers: { "Cache-Control": "private, no-store" } });
}
