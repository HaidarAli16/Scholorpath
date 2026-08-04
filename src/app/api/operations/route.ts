import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { guardMutation } from "@/lib/api/security";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const operationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("capture_source"), canonicalUrl: z.string().url(), sourceType: z.string().trim().min(2).max(80), ownerName: z.string().trim().min(2).max(160), countryCode: z.string().trim().max(3).optional(), verificationNotes: z.string().max(2000).optional() }),
  z.object({ action: z.literal("create_fact"), sourceId: z.string().uuid(), snapshotId: z.string().uuid().optional(), entityType: z.enum(["programme", "scholarship", "institution", "country", "visa"]), entityKey: z.string().trim().min(2).max(180), fieldKey: z.string().trim().min(2).max(120), value: z.unknown(), normalizedValue: z.unknown().optional(), confidence: z.number().int().min(0).max(100).default(50) }),
  z.object({ action: z.literal("review_fact"), factId: z.string().uuid(), decision: z.enum(["approve", "conflict"]), notes: z.string().max(2000).optional() }),
  z.object({ action: z.literal("publish_fact"), factId: z.string().uuid() }),
]);

async function staffContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, roles: [] as string[] };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, roles: [] as string[] };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return { supabase, user, roles: (data ?? []).map((row) => row.role as string) };
}

export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Supabase is not configured for this environment." }, { status: 503 });
  const { supabase, user, roles } = await staffContext();
  if (!supabase || !user || !roles.some((role) => ["research_operator", "research_reviewer", "support", "admin"].includes(role))) return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  const [sources, facts, programmes, scholarships, corrections] = await Promise.all([
    supabase.from("source_records").select("*").order("next_review_at", { ascending: true }).limit(100),
    supabase.from("fact_records").select("*,source_records(owner_name,canonical_url)").in("state", ["draft", "in_review", "conflict", "stale"]).order("updated_at", { ascending: true }).limit(100),
    supabase.from("programmes").select("id,title,institution_name,state,last_verified_at,next_review_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("scholarships").select("id,title,provider_name,state,last_verified_at,next_review_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("correction_tickets").select("*").in("status", ["open", "triaged", "researching"]).order("created_at", { ascending: true }).limit(50),
  ]);
  const error = sources.error || facts.error || programmes.error || scholarships.error || corrections.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roles, sources: sources.data, facts: facts.data, programmes: programmes.data, scholarships: scholarships.data, corrections: corrections.data });
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "research-operations", { requests: 60, windowSeconds: 60 });
  if (blocked) return blocked;
  const parsed = operationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid research operation.", issues: parsed.error.flatten() }, { status: 400 });
  const { supabase, user, roles } = await staffContext();
  if (!supabase || !user || !roles.some((role) => ["research_operator", "research_reviewer", "admin"].includes(role))) return NextResponse.json({ error: "Research role required." }, { status: 403 });
  const payload = parsed.data;
  const rpcPayload = payload.action === "capture_source"
    ? { canonical_url: payload.canonicalUrl, source_type: payload.sourceType, owner_name: payload.ownerName, country_code: payload.countryCode ?? null, verification_notes: payload.verificationNotes ?? null }
    : payload.action === "create_fact"
      ? { source_id: payload.sourceId, snapshot_id: payload.snapshotId ?? null, entity_type: payload.entityType, entity_key: payload.entityKey, field_key: payload.fieldKey, value: payload.value, normalized_value: payload.normalizedValue ?? null, confidence: payload.confidence }
      : payload.action === "review_fact"
        ? { fact_id: payload.factId, decision: payload.decision, notes: payload.notes ?? null }
        : { fact_id: payload.factId };
  const result = await supabase.rpc("research_operation", { p_action: payload.action, p_payload: rpcPayload });
  if (result.error) {
    const status = result.error.code === "42501" ? 403 : result.error.code === "23514" ? 409 : result.error.code === "P0002" ? 404 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }
  return NextResponse.json({ ok: true, data: result.data });
}
