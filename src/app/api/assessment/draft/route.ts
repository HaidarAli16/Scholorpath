import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { guardMutation } from '@/lib/api/security';
import { z } from 'zod';

const draftSchema = z.record(z.string().max(100), z.unknown()).refine((value) => JSON.stringify(value).length <= 100_000, { message: 'Draft is too large.' });

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('assessments')
    .select('answers')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Assessment draft could not be loaded.' }, { status: 500 });

  return NextResponse.json({ draft: data?.answers || null });
}

export async function PUT(request: Request) {
  const blocked = await guardMutation(request, 'assessment-draft', { requests: 30, windowSeconds: 60 });
  if (blocked) return blocked;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = draftSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid assessment draft.' }, { status: 400 });
  const body = parsed.data;

  const { data: existing, error: existingError } = await supabase
    .from('assessments')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return NextResponse.json({ error: 'Assessment draft could not be saved.' }, { status: 500 });

  if (existing) {
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ answers: body, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (updateError) return NextResponse.json({ error: 'Assessment draft could not be saved.' }, { status: 500 });
  } else {
    const { error: insertError } = await supabase
      .from('assessments')
      .insert({ user_id: user.id, status: 'draft', answers: body });
    if (insertError) return NextResponse.json({ error: 'Assessment draft could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
