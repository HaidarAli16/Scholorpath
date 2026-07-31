import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const parsed = operationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid research operation.", issues: parsed.error.flatten() }, { status: 400 });
  const { supabase, user, roles } = await staffContext();
  if (!supabase || !user || !roles.some((role) => ["research_operator", "research_reviewer", "admin"].includes(role))) return NextResponse.json({ error: "Research role required." }, { status: 403 });
  const payload = parsed.data;
  let result: { data: unknown; error: { message: string } | null };

  if (payload.action === "capture_source") {
    result = await supabase.from("source_records").upsert({ canonical_url: payload.canonicalUrl, source_type: payload.sourceType, owner_name: payload.ownerName, country_code: payload.countryCode ?? null, verification_notes: payload.verificationNotes ?? null, status: "unverified" }, { onConflict: "canonical_url" }).select().single();
  } else if (payload.action === "create_fact") {
    result = await supabase.from("fact_records").insert({ source_id: payload.sourceId, snapshot_id: payload.snapshotId ?? null, entity_type: payload.entityType, entity_key: payload.entityKey, field_key: payload.fieldKey, value: payload.value, normalized_value: payload.normalizedValue ?? null, confidence: payload.confidence, state: "in_review", created_by: user.id }).select().single();
  } else if (payload.action === "review_fact") {
    if (!roles.some((role) => ["research_reviewer", "admin"].includes(role))) return NextResponse.json({ error: "Independent reviewer role required." }, { status: 403 });
    const { data: fact } = await supabase.from("fact_records").select("created_by").eq("id", payload.factId).single();
    if (fact?.created_by === user.id && !roles.includes("admin")) return NextResponse.json({ error: "The fact creator cannot approve their own fact." }, { status: 409 });
    result = await supabase.from("fact_records").update({ state: payload.decision === "approve" ? "in_review" : "conflict", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", payload.factId).select().single();
  } else {
    if (!roles.some((role) => ["research_reviewer", "admin"].includes(role))) return NextResponse.json({ error: "Reviewer role required to publish." }, { status: 403 });
    const { data: fact } = await supabase.from("fact_records").select("reviewed_by,state").eq("id", payload.factId).single();
    if (!fact?.reviewed_by || fact.state === "conflict") return NextResponse.json({ error: "Resolve and review the fact before publication." }, { status: 409 });
    result = await supabase.from("fact_records").update({ state: "published" }).eq("id", payload.factId).select().single();
  }
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  await supabase.from("audit_events").insert({ actor_user_id: user.id, action: payload.action, entity_type: payload.action.includes("fact") ? "fact_record" : "source_record", entity_id: (result.data as { id?: string } | null)?.id ?? null, after_data: result.data });
  return NextResponse.json({ ok: true, data: result.data });
}

