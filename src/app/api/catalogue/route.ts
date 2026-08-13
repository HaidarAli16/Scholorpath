export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const querySchema = z.object({
  type: z.enum(["all", "programme", "scholarship"]).default("all"),
  country: z.string().trim().min(2).max(3).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

type CatalogueQuery = z.infer<typeof querySchema>;

const loadCatalogue = unstable_cache(async ({ type, country, q, limit }: CatalogueQuery) => {
  const supabase = createSupabasePublicClient();
  if (!supabase) throw new Error("Catalogue is unavailable.");

  const programmeQuery = () => {
    let query = supabase.from("programmes").select("id,slug,title,institution_name,country_code,level,field_family,intake_label,deadline_at,deadline_timezone,tuition_amount,tuition_currency,application_url,last_verified_at,next_review_at,attributes").eq("state", "published").order("deadline_at", { ascending: true, nullsFirst: false }).limit(limit);
    if (country) query = query.eq("country_code", country.toUpperCase());
    if (q) query = query.ilike("title", `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
    return query;
  };
  const scholarshipQuery = () => {
    let query = supabase.from("scholarships").select("id,slug,title,provider_name,country_code,cycle_label,opens_at,deadline_at,deadline_timezone,award_type,award_value,application_url,last_verified_at,next_review_at,attributes").eq("state", "published").order("deadline_at", { ascending: true, nullsFirst: false }).limit(limit);
    if (country) query = query.eq("country_code", country.toUpperCase());
    if (q) query = query.ilike("title", `%${q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
    return query;
  };
  const [programmes, scholarships] = await Promise.all([
    type === "scholarship" ? Promise.resolve({ data: [], error: null }) : programmeQuery(),
    type === "programme" ? Promise.resolve({ data: [], error: null }) : scholarshipQuery(),
  ]);
  const error = programmes.error || scholarships.error;
  if (error) throw error;
  const items = [
    ...(programmes.data ?? []).map((item) => ({ ...item, entityType: "programme", provider: item.institution_name })),
    ...(scholarships.data ?? []).map((item) => ({ ...item, entityType: "scholarship", provider: item.provider_name })),
  ].sort((a, b) => String(a.deadline_at ?? "9999").localeCompare(String(b.deadline_at ?? "9999"))).slice(0, limit);
  return { mode: "live", items, count: items.length };
}, ["published-catalogue-v1"], { revalidate: 900, tags: ["published-catalogue"] });

export async function GET(request: Request) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Catalogue database is not configured." }, { status: 503 });
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid catalogue query.", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const result = await loadCatalogue(parsed.data);
    return NextResponse.json(result, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Catalogue could not be loaded." }, { status: 500 });
  }
}
