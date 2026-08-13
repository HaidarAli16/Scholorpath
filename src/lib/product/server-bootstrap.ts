import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AssessmentHandoff } from "@/lib/assessment-handoff";
import type { OpportunitiesBootstrap } from "@/lib/use-opportunities";
import type { WorkspacePayload } from "@/lib/use-workspace";
import type { RecommendationResponse } from "@/components/recommendations/recommendations-page";
import type { DirectoryBootstrap } from "@/lib/use-education-directory";
import { GET as getCountries } from "@/app/api/countries/route";
import { GET as getInstitutions } from "@/app/api/institutions/route";

export type ProductBootstrap = {
  workspace: WorkspacePayload;
  handoff: AssessmentHandoff | null;
  opportunities: OpportunitiesBootstrap;
  recommendations: RecommendationResponse | null;
  directory?: DirectoryBootstrap;
};

type Viewer = { id: string; email?: string };

export async function loadProductBootstrap(supabase: SupabaseClient, user: Viewer, module = "today"): Promise<ProductBootstrap> {
  const needsHandoff = ["today", "report", "recommendations"].includes(module);
  const needsOpportunities = ["today", "discover", "portfolio", "opportunity"].includes(module);
  const needsRecommendations = module === "recommendations";
  const directoryMode = module === "countries" ? "countries" : module === "institutions" ? "institutions" : module === "report" ? "both" : null;

  const [workspace, handoff, opportunities, recommendations, directory] = await Promise.all([
    loadWorkspaceForModule(supabase, user, module),
    needsHandoff ? loadHandoff(supabase, user.id) : Promise.resolve(null),
    needsOpportunities ? loadOpportunities(supabase, user.id) : Promise.resolve({ items: [], recommendations: [], mode: "live" } as OpportunitiesBootstrap),
    needsRecommendations ? loadDetailedRecommendations(supabase, user.id) : Promise.resolve(null),
    directoryMode ? loadDirectory(directoryMode) : Promise.resolve(undefined),
  ]);
  return { workspace, handoff, opportunities, recommendations, directory };
}

async function loadDirectory(mode: "countries" | "institutions" | "both"): Promise<DirectoryBootstrap> {
  const [countryResponse, institutionResponse] = await Promise.all([
    mode !== "institutions" ? getCountries() : Promise.resolve(null),
    mode !== "countries" ? getInstitutions(new Request("http://candidroute.local/api/institutions")) : Promise.resolve(null),
  ]);
  if (countryResponse && !countryResponse.ok || institutionResponse && !institutionResponse.ok) return { countries: [], institutions: [], mode: "unavailable", warning: "Education directory could not be loaded." };
  const countries = countryResponse ? await countryResponse.json() as { countries?: DirectoryBootstrap["countries"] } : {};
  const institutions = institutionResponse ? await institutionResponse.json() as { institutions?: DirectoryBootstrap["institutions"] } : {};
  return { countries: countries.countries ?? [], institutions: institutions.institutions ?? [], mode: "live" };
}

async function loadDetailedRecommendations(supabase: SupabaseClient, userId: string): Promise<RecommendationResponse | null> {
  const { data: run } = await supabase.from("recommendation_runs").select("id,engine_version,catalogue_version,generated_at,profile_snapshot").eq("user_id", userId).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (!run) return { run: null, profile: null, summary: null, results: [] };
  const { data: components, error } = await supabase.from("recommendation_components").select("entity_type,entity_id,state,final_score,score_components,reasons,failed_gates,open_checks,next_actions").eq("run_id", run.id).eq("user_id", userId).order("final_score", { ascending: false });
  if (error) return null;
  const programmeIds = (components ?? []).filter((item) => item.entity_type === "programme").map((item) => item.entity_id);
  const scholarshipIds = (components ?? []).filter((item) => item.entity_type === "scholarship").map((item) => item.entity_id);
  const [programmes, scholarships] = await Promise.all([
    programmeIds.length ? supabase.from("programmes").select("id,title,institution_name,country_code,deadline_at,application_url").in("id", programmeIds) : Promise.resolve({ data: [] }),
    scholarshipIds.length ? supabase.from("scholarships").select("id,title,provider_name,country_code,deadline_at,application_url").in("id", scholarshipIds) : Promise.resolve({ data: [] }),
  ]);
  const entities = new Map<string, Record<string, unknown>>([...(programmes.data ?? []), ...(scholarships.data ?? [])].map((item) => [String(item.id), item]));
  const results = (components ?? []).map((item) => {
    const entity = entities.get(item.entity_id);
    return { ...item, title: entity?.title as string | undefined, provider: (item.entity_type === "programme" ? entity?.institution_name : entity?.provider_name) as string | undefined, country_code: entity?.country_code as string | undefined, deadline_at: entity?.deadline_at as string | undefined, application_url: entity?.application_url as string | undefined };
  }) as RecommendationResponse["results"];
  return { run: { engine_version: run.engine_version, generated_at: run.generated_at, catalogue_version: run.catalogue_version }, profile: run.profile_snapshot, summary: { totalEvaluated: results.length, confirmed: results.filter((item) => item.state === "confirmed").length, conditional: results.filter((item) => item.state === "conditional").length, failed: results.filter((item) => item.state === "failed").length, averageScore: results.length ? results.reduce((sum, item) => sum + Number(item.final_score), 0) / results.length : 0 }, results };
}

export async function loadWorkspaceForModule(supabase: SupabaseClient, user: Viewer, module: string): Promise<WorkspacePayload> {
  const queries: Array<PromiseLike<{ data: unknown; error: unknown }>> = [
    supabase.from("student_profiles").select("first_name,nationality,current_country,preferred_currency").eq("user_id", user.id).maybeSingle(),
  ];
  const keys = ["profile"];
  const add = (key: string, query: PromiseLike<{ data: unknown; error: unknown }>) => { keys.push(key); queries.push(query); };

  if (["today", "discover", "profile"].includes(module)) add("assessment", supabase.from("assessments").select("id,status,completion_percent,answers,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1));
  if (["discover", "portfolio", "opportunity"].includes(module)) add("portfolios", supabase.from("portfolios").select("id,name,is_default,portfolio_items!portfolio_items_portfolio_owner_fk(id,entity_type,entity_id,notes,position)").eq("user_id", user.id));
  if (["applications", "offers"].includes(module)) add("applications", supabase.from("applications").select("*").eq("user_id", user.id).order("deadline_at", { ascending: true }));
  if (module === "documents") add("documents", supabase.from("documents").select("id,name,category,status,version,metadata,created_at,updated_at").eq("user_id", user.id).neq("status", "deleted").order("updated_at", { ascending: false }));
  if (module === "writing") add("writing", supabase.from("writing_items").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }));
  if (module === "funding") add("funding", supabase.from("funding_scenarios").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }));
  if (module === "offers") add("offers", supabase.from("offers").select("*,applications!offers_application_owner_fk(title,provider_name)").eq("user_id", user.id).order("created_at", { ascending: false }));
  if (module === "all") {
    add("assessment", supabase.from("assessments").select("id,status,completion_percent,answers,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1));
    add("applications", supabase.from("applications").select("*").eq("user_id", user.id).order("deadline_at", { ascending: true }));
    add("tasks", supabase.from("tasks").select("*").eq("user_id", user.id).order("due_at", { ascending: true }));
    add("documents", supabase.from("documents").select("id,name,category,status,version,metadata,created_at,updated_at").eq("user_id", user.id).neq("status", "deleted").order("updated_at", { ascending: false }));
    add("portfolios", supabase.from("portfolios").select("id,name,is_default,portfolio_items!portfolio_items_portfolio_owner_fk(id,entity_type,entity_id,notes,position)").eq("user_id", user.id));
    add("notifications", supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50));
    add("writing", supabase.from("writing_items").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }));
    add("funding", supabase.from("funding_scenarios").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }));
    add("offers", supabase.from("offers").select("*,applications!offers_application_owner_fk(title,provider_name)").eq("user_id", user.id).order("created_at", { ascending: false }));
  }

  const results = await Promise.all(queries);
  if (results.some((result) => result.error)) return { mode: "unavailable", authenticated: true, user: { id: user.id, email: user.email }, data: null };
  const values = Object.fromEntries(results.map((result, index) => [keys[index], result.data])) as Record<string, unknown>;
  const assessmentRows = values.assessment as Array<Record<string, unknown>> | undefined;
  return {
    mode: "live",
    authenticated: true,
    user: { id: user.id, email: user.email },
    data: {
      profile: values.profile,
      assessment: assessmentRows?.[0] ?? null,
      applications: values.applications ?? [], tasks: values.tasks ?? [], documents: values.documents ?? [],
      portfolios: values.portfolios ?? [], notifications: values.notifications ?? [], writing: values.writing ?? [],
      funding: values.funding ?? [], offers: values.offers ?? [],
    },
  } as unknown as WorkspacePayload;
}

async function loadHandoff(supabase: SupabaseClient, userId: string): Promise<AssessmentHandoff | null> {
  const { data: row } = await supabase.from("pathway_reports").select("assessment_id,report,generated_at").eq("user_id", userId).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  if (!row?.report) return null;
  const { data: assessment } = await supabase.from("assessments").select("answers").eq("id", row.assessment_id).eq("user_id", userId).maybeSingle();
  return { report: row.report, profile: assessment?.answers ?? {}, createdAt: row.generated_at } as AssessmentHandoff;
}

async function loadOpportunities(supabase: SupabaseClient, userId: string): Promise<OpportunitiesBootstrap> {
  const [programmes, scholarships, run] = await Promise.all([
    supabase.from("programmes").select("id,slug,title,institution_name,country_code,level,field_family,intake_label,deadline_at,deadline_timezone,tuition_amount,tuition_currency,application_url,last_verified_at,next_review_at,attributes").eq("state", "published").order("deadline_at", { ascending: true, nullsFirst: false }).limit(50),
    supabase.from("scholarships").select("id,slug,title,provider_name,country_code,cycle_label,opens_at,deadline_at,deadline_timezone,award_type,award_value,application_url,last_verified_at,next_review_at,attributes").eq("state", "published").order("deadline_at", { ascending: true, nullsFirst: false }).limit(50),
    supabase.from("recommendation_runs").select("id").eq("user_id", userId).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (programmes.error || scholarships.error) return { items: [], recommendations: [], mode: "unavailable" };
  const components = run.data?.id
    ? await supabase.from("recommendation_components").select("entity_type,entity_id,state,final_score,score_components,reasons,failed_gates,open_checks,next_actions,rule_versions").eq("run_id", run.data.id).eq("user_id", userId).order("final_score", { ascending: false })
    : { data: [], error: null };
  const items = [
    ...(programmes.data ?? []).map((item) => ({ ...item, entityType: "programme" as const, provider: item.institution_name })),
    ...(scholarships.data ?? []).map((item) => ({ ...item, entityType: "scholarship" as const, provider: item.provider_name })),
  ].sort((a, b) => String(a.deadline_at ?? "9999").localeCompare(String(b.deadline_at ?? "9999"))).slice(0, 50);
  return { items, recommendations: (components.data ?? []) as OpportunitiesBootstrap["recommendations"], mode: "live" };
}
