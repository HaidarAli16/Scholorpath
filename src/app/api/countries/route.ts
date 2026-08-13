import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { repairTextTree } from "@/lib/text/repair-mojibake";

export const dynamic = "force-dynamic";

const loadCountries = unstable_cache(async () => {
  const supabase = createSupabasePublicClient();
  if (!supabase) throw new Error("Country intelligence is unavailable.");

  const [countriesResult, citiesResult, factsResult, sourcesResult] = await Promise.all([
    supabase.from("countries").select("*").eq("state", "published").order("name"),
    supabase.from("cities").select("*").eq("state", "published").order("name"),
    supabase.from("country_facts").select("*").eq("state", "published").order("category"),
    supabase.from("source_records").select("id,owner_name,canonical_url,last_verified_at,next_review_at").eq("status", "verified"),
  ]);
  const error = countriesResult.error || citiesResult.error || factsResult.error || sourcesResult.error;
  if (error) throw error;

  const sources = new Map((sourcesResult.data ?? []).map((source) => [source.id, source]));
  const citiesByCountry = Map.groupBy(citiesResult.data ?? [], (city) => city.country_code);
  const factsByCountry = Map.groupBy(factsResult.data ?? [], (fact) => fact.country_code);
  const countries = (countriesResult.data ?? []).map((country) => ({
    code: country.code,
    slug: country.slug,
    name: country.name,
    flag: country.flag_emoji,
    currencyCode: country.currency_code,
    currencySymbol: country.currency_symbol,
    primaryLanguage: country.primary_language,
    studentRoute: country.student_route_name,
    visaDifficulty: country.visa_difficulty,
    visaFeeAmount: country.visa_fee_amount,
    visaFeeCurrency: country.visa_fee_currency,
    proofFundsAmount: country.proof_funds_amount,
    proofFundsCurrency: country.proof_funds_currency,
    proofFundsMonths: country.proof_funds_period_months,
    workHours: country.work_hours_term,
    postStudyMonths: country.post_study_months,
    monthlyCostLow: country.monthly_cost_low,
    monthlyCostHigh: country.monthly_cost_high,
    costCurrency: country.cost_currency,
    summary: country.summary,
    healthcare: country.healthcare_summary,
    work: country.work_summary,
    postStudy: country.post_study_summary,
    climate: country.climate_summary,
    community: country.community_summary,
    visaUncertainty: country.visa_uncertainty,
    lastVerifiedAt: country.last_verified_at,
    nextReviewAt: country.next_review_at,
    cities: (citiesByCountry.get(country.code) ?? []).map((city) => ({
      id: city.id,
      name: city.name,
      monthlyCostLow: Number(city.monthly_cost_low ?? 0),
      monthlyCostHigh: Number(city.monthly_cost_high ?? 0),
      accommodationLow: Number(city.accommodation_low ?? 0),
      accommodationHigh: Number(city.accommodation_high ?? 0),
      deposit: city.deposit_summary,
      transport: city.transport_summary,
      safety: city.safety_summary,
      climate: city.climate_summary,
      community: city.community_summary,
      confidence: city.confidence,
    })),
    facts: (factsByCountry.get(country.code) ?? []).map((fact) => {
      const source = sources.get(fact.source_id);
      return {
        id: fact.id,
        category: fact.category,
        label: fact.label,
        value: fact.value,
        qualification: fact.qualification,
        confidence: fact.confidence,
        source: source ? { label: source.owner_name, url: source.canonical_url, verifiedAt: source.last_verified_at, nextReviewAt: source.next_review_at } : null,
      };
    }),
  }));
  return repairTextTree({ mode: "live", countries, generatedAt: new Date().toISOString() });
}, ["published-country-intelligence-v1"], { revalidate: 3600, tags: ["country-intelligence"] });

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Country intelligence database is not configured." }, { status: 503 });
  try {
    const result = await loadCountries();
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Country intelligence could not be loaded." }, { status: 500 });
  }
}

