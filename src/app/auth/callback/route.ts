export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { defaultLandingPath, safeInternalPath } from "@/lib/auth/access";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safeNext = safeInternalPath(url.searchParams.get("next"), "");
  const supabase = await createSupabaseServerClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (safeNext) return NextResponse.redirect(new URL(safeNext, url.origin));
      const { data } = await supabase.from("user_roles").select("role");
      return NextResponse.redirect(new URL(defaultLandingPath((data ?? []).map((row) => row.role)), url.origin));
    }
  }

  return NextResponse.redirect(new URL("/auth?error=callback", url.origin));
}
