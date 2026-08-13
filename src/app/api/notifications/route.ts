import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { guardMutation } from '@/lib/api/security';
import { z } from 'zod';

const querySchema = z.object({ unread_only: z.enum(['true', 'false']).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), offset: z.coerce.number().int().min(0).max(10000).default(0) });
const updateSchema = z.union([z.object({ all: z.literal(true) }), z.object({ ids: z.array(z.string().uuid()).min(1).max(100) })]);

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid notification query.' }, { status: 400 });
  const unreadOnly = parsed.data.unread_only === 'true';
  const { limit, offset } = parsed.data;

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Notifications could not be loaded.' }, { status: 500 });
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  return NextResponse.json({
    notifications: data,
    total_count: count,
    unread_count: unreadCount || 0
  });
}

export async function PATCH(request: Request) {
  const blocked = await guardMutation(request, 'notifications', { requests: 60, windowSeconds: 60 });
  if (blocked) return blocked;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid notification update.' }, { status: 400 });
  const ids = 'ids' in parsed.data ? parsed.data.ids : undefined;
  const all = 'all' in parsed.data;

  let query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (all) {
    // apply to all unread for user, already covered by .eq('user_id', user.id)
  } else if (Array.isArray(ids) && ids.length > 0) {
    query = query.in('id', ids);
  } else {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { data, error } = await query.select();
  if (error) {
    return NextResponse.json({ error: 'Notifications could not be updated.' }, { status: 500 });
  }

  return NextResponse.json({ updated: data?.length || 0 });
}
