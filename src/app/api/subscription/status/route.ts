import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ plan: "free", active: false }, { headers: { "Cache-Control": "private, no-store" } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data, error } = await supabase
    .from("subscription_entitlements")
    .select("plan_code,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return NextResponse.json({ plan: "free", active: false }, { headers: { "Cache-Control": "private, no-store" } });
  const periodValid = !data.current_period_end || new Date(data.current_period_end).getTime() > Date.now();
  const active = data.plan_code === "pro" && ["active", "trialing"].includes(data.status) && periodValid;
  return NextResponse.json({ plan: active ? "pro" : "free", active }, { headers: { "Cache-Control": "private, no-store" } });
}
