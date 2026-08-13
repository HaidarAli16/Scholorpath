export const preferredRegion = "sin1";

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { guardMutation } from '@/lib/api/security';
import { z } from 'zod';

const idSchema = z.string().uuid();
const updateSchema = z.object({
  state: z.enum(['considering', 'preparing', 'ready', 'submitted', 'decision', 'withdrawn', 'archived']).optional(),
  deadline_at: z.string().datetime().nullable().optional(),
  official_portal_url: z.string().url().max(2048).nullable().optional(),
  submitted_at: z.string().datetime().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'No supported changes supplied.' });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { data: appData, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', id)
    .maybeSingle();

  if (appError) return NextResponse.json({ error: 'Application could not be loaded.' }, { status: 500 });
  if (!appData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: reqData, error: reqError } = await supabase
    .from('application_requirements')
    .select('*')
    .eq('application_id', id);

  if (reqError) return NextResponse.json({ error: 'Application requirements could not be loaded.' }, { status: 500 });

  return NextResponse.json({ application: appData, requirements: reqData });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, 'applications:update', { requests: 60, windowSeconds: 60 });
  if (blocked) return blocked;
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid application update.', issues: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  const { data, error } = await supabase
    .from('applications')
    .update({
      state: body.state,
      deadline_at: body.deadline_at,
      official_portal_url: body.official_portal_url,
      submitted_at: body.submitted_at,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Application could not be updated.' }, { status: 500 });

  return NextResponse.json({ application: data });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, 'applications:delete', { requests: 20, windowSeconds: 60 });
  if (blocked) return blocked;
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: 'Invalid application id.' }, { status: 400 });
  if (!isSupabaseConfigured) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Database unavailable.' }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { data, error } = await supabase
    .from('applications')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)
    .select('id');

  if (error) return NextResponse.json({ error: 'Application could not be deleted.' }, { status: 500 });

  if (!data?.length) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
