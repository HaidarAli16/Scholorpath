import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  q: z.string().trim().min(1).optional(),
  country: z.string().trim().length(2).optional(),
  limit: z.coerce.number().min(1).max(50).default(10)
});

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const { q, country, limit } = parsed.data;

  let query = supabase
    .from('institutions')
    .select('id, slug, official_name, short_name, country_code, institution_type, city_id, cities(name)')
    .eq('state', 'published')
    .limit(limit);

  if (country) {
    query = query.eq('country_code', country.toUpperCase());
  }

  if (q) {
    const escapedQ = q.replaceAll('%', '\\%').replaceAll('_', '\\_');
    query = query.or(`official_name.ilike.%${escapedQ}%,short_name.ilike.%${escapedQ}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type InstitutionRow = { id: string; slug: string; official_name: string; short_name: string | null; country_code: string | null; institution_type: string | null; cities: { name: string } | { name: string }[] | null };
  const results = (data as InstitutionRow[]).map((inst) => ({
    id: inst.id,
    slug: inst.slug,
    official_name: inst.official_name,
    short_name: inst.short_name,
    country_code: inst.country_code,
    institution_type: inst.institution_type,
    city: Array.isArray(inst.cities) ? inst.cities[0]?.name ?? null : inst.cities?.name ?? null
  }));

  return NextResponse.json({ results });
}
