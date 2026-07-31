import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ mode: "demo", run: null, results: [] });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Recommendations are unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view recommendations." }, { status: 401 });
  const { data: run, error } = await supabase.from("recommendation_runs").select("id,assessment_id,engine_version,catalogue_version,result_count,generated_at").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!run) return NextResponse.json({ mode: "live", run: null, results: [] });
  const components = await supabase.from("recommendation_components").select("entity_type,entity_id,state,final_score,score_components,reasons,failed_gates,open_checks,next_actions,rule_versions").eq("run_id", run.id).eq("user_id", user.id).order("final_score", { ascending: false });
  if (components.error) return NextResponse.json({ error: components.error.message }, { status: 500 });
  return NextResponse.json({ mode: "live", run, results: components.data ?? [] });
}
