import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
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

export async function loadProductBootstrap(supabase: SupabaseClient, user: User, module?: string): Promise<ProductBootstrap> {
  const [workspace, handoff, opportunities] = await Promise.all([
    loadWorkspace(supabase, user),
    loadHandoff(supabase, user.id),
    loadOpportunities(supabase, user.id),
  ]);
  const recommendations = await loadDetailedRecommendations(supabase, user.id);
  const directory = module === "countries" || module === "institutions" || module === "report" ? await loadDirectory() : undefined;
  return { workspace, handoff, opportunities, recommendations, directory };
}

async function loadDirectory(): Promise<DirectoryBootstrap> {
  const [countryResponse, institutionResponse] = await Promise.all([getCountries(), getInstitutions(new Request("http://candidroute.local/api/institutions"))]);
  if (!countryResponse.ok || !institutionResponse.ok) return { countries: [], institutions: [], mode: "unavailable", warning: "Education directory could not be loaded." };
  const countries = await countryResponse.json() as { countries?: DirectoryBootstrap["countries"] };
  const institutions = await institutionResponse.json() as { institutions?: DirectoryBootstrap["institutions"] };
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

async function loadWorkspace(supabase: SupabaseClient, user: User): Promise<WorkspacePayload> {
  const [profile, assessments, applications, tasks, documents, portfolios, notifications, writing, funding, offers] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("assessments").select("id,status,completion_percent,answers,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
    supabase.from("applications").select("*").eq("user_id", user.id).order("deadline_at", { ascending: true }),
    supabase.from("tasks").select("*").eq("user_id", user.id).order("due_at", { ascending: true }),
    supabase.from("documents").select("id,name,category,status,version,metadata,created_at,updated_at").eq("user_id", user.id).neq("status", "deleted").order("updated_at", { ascending: false }),
    supabase.from("portfolios").select("id,name,is_default,portfolio_items!portfolio_items_portfolio_owner_fk(id,entity_type,entity_id,notes,position)").eq("user_id", user.id),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("writing_items").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("funding_scenarios").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("offers").select("*,applications!offers_application_owner_fk(title,provider_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  const results = [profile, assessments, applications, tasks, documents, portfolios, notifications, writing, funding, offers];
  if (results.some((result) => result.error)) return { mode: "unavailable", authenticated: true, user: { id: user.id, email: user.email }, data: null };
  return {
    mode: "live",
    authenticated: true,
    user: { id: user.id, email: user.email },
    data: {
      profile: profile.data,
      assessment: assessments.data?.[0] ?? null,
      applications: applications.data ?? [], tasks: tasks.data ?? [], documents: documents.data ?? [],
      portfolios: portfolios.data ?? [], notifications: notifications.data ?? [], writing: writing.data ?? [],
      funding: funding.data ?? [], offers: offers.data ?? [],
    },
  } as WorkspacePayload;
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
