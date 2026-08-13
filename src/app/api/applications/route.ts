export const preferredRegion = "sin1";

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { guardMutation } from '@/lib/api/security';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().trim().min(2).max(180),
  provider_name: z.string().trim().min(2).max(180),
  programme_id: z.string().uuid().nullable().optional(),
  scholarship_id: z.string().uuid().nullable().optional(),
  deadline_at: z.string().datetime().nullable().optional(),
  official_portal_url: z.string().url().max(2048).nullable().optional(),
}).refine((value) => !(value.programme_id && value.scholarship_id), { message: 'Choose either a programme or scholarship.' });

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });
  
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { data, error } = await supabase
    .from('applications')
    .select('id, title, provider_name, state, deadline_at, programme_id, scholarship_id, requirements_summary')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Applications could not be loaded.' }, { status: 500 });

  return NextResponse.json({ applications: data });
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, 'applications', { requests: 30, windowSeconds: 60 });
  if (blocked) return blocked;
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid application data.', issues: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      title: body.title,
      provider_name: body.provider_name,
      programme_id: body.programme_id,
      scholarship_id: body.scholarship_id,
      deadline_at: body.deadline_at,
      official_portal_url: body.official_portal_url,
      state: 'considering'
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Application could not be created.' }, { status: 500 });

  return NextResponse.json({ application: data });
}
