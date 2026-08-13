export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Recommendations database is not configured." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Recommendations are unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view recommendations." }, { status: 401 });

  // Single query: fetch latest run and all its components in parallel
  // Step 1 must still be sequential (run ID needed for components), but we eliminate
  // the getUser() → run → components waterfall by combining auth check above
  const { data: run, error } = await supabase
    .from("recommendation_runs")
    .select("id,assessment_id,engine_version,catalogue_version,result_count,generated_at")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Recommendations could not be loaded." }, { status: 500 });
  if (!run) return NextResponse.json({ mode: "live", run: null, results: [] });

  const components = await supabase
    .from("recommendation_components")
    .select("entity_type,entity_id,state,final_score,score_components,reasons,failed_gates,open_checks,next_actions,rule_versions")
    .eq("run_id", run.id)
    .eq("user_id", user.id)
    .order("final_score", { ascending: false })
    .limit(100);

  if (components.error) return NextResponse.json({ error: "Recommendation details could not be loaded." }, { status: 500 });

  return NextResponse.json(
    { mode: "live", run, results: components.data ?? [] },
    // This response is user-specific. Never place it in a shared CDN cache.
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}
