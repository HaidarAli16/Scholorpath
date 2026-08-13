import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { repairTextTree } from "@/lib/text/repair-mojibake";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  country: z.string().trim().length(2).optional(),
  origin: z.enum(["Pakistan", "India", "Bangladesh"]).optional(),
  q: z.string().trim().max(100).optional(),
});

type InstitutionQuery = z.infer<typeof querySchema>;

const loadInstitutions = unstable_cache(async (query: InstitutionQuery) => {
  const supabase = createSupabasePublicClient();
  if (!supabase) throw new Error("Institution directory is unavailable.");

  let institutionQuery = supabase.from("institutions").select("*").eq("state", "published").order("official_name");
  if (query.country) institutionQuery = institutionQuery.eq("country_code", query.country.toUpperCase());
  if (query.q) institutionQuery = institutionQuery.ilike("official_name", `%${query.q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  const [institutionsResult, countriesResult, citiesResult, campusesResult, rankingsResult, equivalenciesResult, requirementsResult, programmesResult, sourcesResult] = await Promise.all([
    institutionQuery,
    supabase.from("countries").select("code,name,flag_emoji").eq("state", "published"),
    supabase.from("cities").select("id,name").eq("state", "published"),
    supabase.from("campuses").select("id,institution_id").eq("state", "published"),
    supabase.from("institution_rankings").select("*").eq("state", "published").order("edition_year", { ascending: false }),
    supabase.from("qualification_equivalencies").select("*").eq("state", "published"),
    supabase.from("institution_requirements").select("*").eq("state", "published"),
    supabase.from("programmes").select("id,institution_id").eq("state", "published"),
    supabase.from("source_records").select("id,owner_name,canonical_url,last_verified_at,next_review_at").eq("status", "verified"),
  ]);
  const results = [institutionsResult, countriesResult, citiesResult, campusesResult, rankingsResult, equivalenciesResult, requirementsResult, programmesResult, sourcesResult];
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const countries = new Map((countriesResult.data ?? []).map((country) => [country.code, country]));
  const cities = new Map((citiesResult.data ?? []).map((city) => [city.id, city.name]));
  const sources = new Map((sourcesResult.data ?? []).map((source) => [source.id, source]));
  const campusCounts = new Map<string, number>();
  for (const campus of campusesResult.data ?? []) campusCounts.set(campus.institution_id, (campusCounts.get(campus.institution_id) ?? 0) + 1);
  const programmeCounts = new Map<string, number>();
  for (const programme of programmesResult.data ?? []) programmeCounts.set(programme.institution_id, (programmeCounts.get(programme.institution_id) ?? 0) + 1);
  const rankingsByInstitution = Map.groupBy(rankingsResult.data ?? [], (item) => item.institution_id);
  const equivalenciesByInstitution = Map.groupBy((equivalenciesResult.data ?? []).filter((item) => !query.origin || item.origin_country === query.origin), (item) => item.institution_id);
  const requirementsByInstitution = Map.groupBy((requirementsResult.data ?? []).filter((item) => !query.origin || !item.origin_country || item.origin_country === query.origin), (item) => item.institution_id);
  const sourceShape = (sourceId: string | null) => {
    const source = sourceId ? sources.get(sourceId) : null;
    return source ? { label: source.owner_name, url: source.canonical_url, verifiedAt: source.last_verified_at, nextReviewAt: source.next_review_at } : null;
  };
  const institutions = (institutionsResult.data ?? []).map((institution) => {
    const country = countries.get(institution.country_code);
    return {
      id: institution.id,
      slug: institution.slug,
      name: institution.official_name,
      shortName: institution.short_name,
      type: institution.institution_type,
      countryCode: institution.country_code,
      countryName: country?.name ?? institution.country_code,
      flag: country?.flag_emoji ?? "",
      city: institution.city_id ? cities.get(institution.city_id) ?? null : null,
      websiteUrl: institution.website_url,
      admissionsUrl: institution.admissions_url,
      publicPrivate: institution.public_private,
      degreeAwarding: institution.degree_awarding,
      sponsorStatus: institution.international_sponsor_status,
      summary: institution.summary,
      lastVerifiedAt: institution.last_verified_at,
      nextReviewAt: institution.next_review_at,
      campusCount: campusCounts.get(institution.id) ?? 0,
      programmeCount: programmeCounts.get(institution.id) ?? 0,
      rankings: (rankingsByInstitution.get(institution.id) ?? []).map((ranking) => ({ id: ranking.id, publisher: ranking.publisher, name: ranking.ranking_name, year: ranking.edition_year, rankLabel: ranking.rank_label, subject: ranking.subject, source: sourceShape(ranking.source_id) })),
      equivalencies: (equivalenciesByInstitution.get(institution.id) ?? []).map((item) => ({ id: item.id, originCountry: item.origin_country, studyLevel: item.study_level, qualification: item.qualification_pattern, minimumResult: item.minimum_result, state: item.evaluation_state, notes: item.notes, source: sourceShape(item.source_id) })),
      requirements: (requirementsByInstitution.get(institution.id) ?? []).map((item) => ({ id: item.id, type: item.requirement_type, label: item.label, description: item.description, required: item.required, originCountry: item.origin_country, studyLevel: item.study_level, source: sourceShape(item.source_id) })),
    };
  });
  return repairTextTree({ mode: "live", institutions, generatedAt: new Date().toISOString() });
}, ["published-institution-directory-v1"], { revalidate: 3600, tags: ["institution-directory"] });

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid institution query." }, { status: 400 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Institution directory database is not configured." }, { status: 503 });
  try {
    const result = await loadInstitutions(parsed.data);
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Institution directory could not be loaded." }, { status: 500 });
  }
}

