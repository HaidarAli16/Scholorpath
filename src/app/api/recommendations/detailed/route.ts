import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Recommendations are unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view recommendations." }, { status: 401 });

  const { data: run, error: runError } = await supabase
    .from("recommendation_runs")
    .select("id,assessment_id,engine_version,catalogue_version,result_count,generated_at,profile_snapshot")
    .eq("user_id", user.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runError) return NextResponse.json({ error: runError.message }, { status: 500 });
  if (!run) return NextResponse.json({ run: null, profile: null, summary: null, results: [] });

  const { data: components, error: componentsError } = await supabase
    .from("recommendation_components")
    .select("*")
    .eq("run_id", run.id)
    .eq("user_id", user.id)
    .order("final_score", { ascending: false });

  if (componentsError) return NextResponse.json({ error: componentsError.message }, { status: 500 });

  const programmeIds = components?.filter(c => c.entity_type === "programme").map(c => c.entity_id) || [];
  const scholarshipIds = components?.filter(c => c.entity_type === "scholarship").map(c => c.entity_id) || [];

  const programmesMap = new Map();
  if (programmeIds.length > 0) {
    const { data: progs } = await supabase.from("programmes").select("id,title,institution_name,country_code,deadline_at,application_url").in("id", programmeIds);
    (progs || []).forEach(p => programmesMap.set(p.id, p));
  }

  const scholarshipsMap = new Map();
  if (scholarshipIds.length > 0) {
    const { data: schols } = await supabase.from("scholarships").select("id,title,provider_name,country_code,deadline_at,application_url").in("id", scholarshipIds);
    (schols || []).forEach(s => scholarshipsMap.set(s.id, s));
  }

  const results = (components || []).map(c => {
    const entity = c.entity_type === "programme" ? programmesMap.get(c.entity_id) : scholarshipsMap.get(c.entity_id);
    return {
      entity_type: c.entity_type,
      entity_id: c.entity_id,
      title: entity?.title,
      provider: c.entity_type === "programme" ? entity?.institution_name : entity?.provider_name,
      country_code: entity?.country_code,
      state: c.state,
      final_score: c.final_score,
      score_components: c.score_components,
      reasons: c.reasons,
      failed_gates: c.failed_gates,
      open_checks: c.open_checks,
      next_actions: c.next_actions,
      deadline_at: entity?.deadline_at,
      application_url: entity?.application_url
    };
  });

  const summary = {
    totalEvaluated: results.length,
    confirmed: results.filter(r => r.state === "confirmed").length,
    conditional: results.filter(r => r.state === "conditional").length,
    failed: results.filter(r => r.state === "failed").length,
    averageScore: results.length ? results.reduce((acc, r) => acc + Number(r.final_score), 0) / results.length : 0
  };

  return NextResponse.json({
    run: {
      id: run.id,
      engine_version: run.engine_version,
      generated_at: run.generated_at,
      catalogue_version: run.catalogue_version
    },
    profile: run.profile_snapshot,
    summary,
    results
  });
}
