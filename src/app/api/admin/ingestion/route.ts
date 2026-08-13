import { NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/config";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run"), sourceId: z.string().uuid() }),
  z.object({ action: z.literal("adopt"), candidateId: z.string().uuid() }),
  z.object({ action: z.literal("add_source"), url: z.string().url().startsWith("https://").max(2000), ownerName: z.string().trim().min(2).max(200), entityType: z.enum(["programme", "scholarship"]), countryCode: z.string().trim().max(3).optional(), scheduleMinutes: z.number().int().min(60).max(10080).default(720) }),
  z.object({ action: z.literal("review"), candidateId: z.string().uuid(), decision: z.enum(["approve", "reject"]), notes: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("publish"), candidateId: z.string().uuid() }),
  z.object({ action: z.literal("set_source"), sourceId: z.string().uuid(), enabled: z.boolean(), scheduleMinutes: z.number().int().min(60).max(10080).optional(), priority: z.number().int().min(1).max(5).optional() }),
]);

async function adminContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null, admin: false };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, admin: false };
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return { supabase, user, admin: Boolean(data) };
}

export async function GET() {
  const { supabase, user, admin } = await adminContext();
  if (!supabase || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const candidateSelect = "id,run_id,source_id,snapshot_id,entity_type,external_key,canonical_url,title,provider_name,country_code,normalized_data,validation_errors,change_summary,review_state,structured_score,reviewed_at,review_notes,published_at,created_at,source_records(owner_name,canonical_url)";
  const [sources, adapters, runs, pendingCandidates, approvedCandidates, sourceHealth] = await Promise.all([
    supabase.from("ingestion_sources").select("source_id,adapter_id,enabled,priority,schedule_minutes,next_fetch_at,last_attempt_at,last_success_at,consecutive_failures,robots_state,last_http_status,last_error,source_records(id,canonical_url,owner_name,country_code,status),ingestion_adapters(id,adapter_key,name,kind,entity_type,parser_version)").order("priority").order("next_fetch_at").limit(200),
    supabase.from("ingestion_adapters").select("id,adapter_key,name,kind,entity_type,description,allowed_hosts,parser_version,enabled,updated_at").order("name"),
    supabase.from("ingestion_runs").select("id,source_id,adapter_id,trigger_type,status,queued_at,started_at,finished_at,http_status,robots_state,content_changed,bytes_received,discovered_count,candidate_count,duration_ms,error_code,error_message,source_records(owner_name,canonical_url)").order("created_at", { ascending: false }).limit(50),
    supabase.from("opportunity_candidates").select(candidateSelect).eq("review_state", "pending").order("structured_score", { ascending: false }).order("created_at", { ascending: false }).limit(100),
    supabase.from("opportunity_candidates").select(candidateSelect).eq("review_state", "approved").order("structured_score", { ascending: false }).order("reviewed_at", { ascending: false }).limit(50),
    supabase.from("ingestion_sources").select("source_id,consecutive_failures,last_success_at,next_fetch_at,last_error,last_http_status,source_records(canonical_url,owner_name,country_code)").gt("consecutive_failures", 0).order("consecutive_failures", { ascending: false }).limit(50),
  ]);
  const error = sources.error || adapters.error || runs.error || pendingCandidates.error || approvedCandidates.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: sources.data ?? [], adapters: adapters.data ?? [], runs: runs.data ?? [], candidates: pendingCandidates.data ?? [], approvedCandidates: approvedCandidates.data ?? [], failingSources: sourceHealth.data ?? [], candidateCount: (pendingCandidates.data ?? []).length });
}

async function invokeWorker(runId: string) {
  const secret = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret || !supabaseUrl) return { ok: true, runId, status: "queued", warning: "The worker secret is not configured in this environment." };
  const worker = await fetch(`${supabaseUrl}/functions/v1/opportunity-ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: secret },
    body: JSON.stringify({ runId }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  const result = await worker.json().catch(() => ({ error: `Worker returned ${worker.status}.` }));
  if (!worker.ok) throw new Error(typeof result?.error === "string" ? result.error : "Ingestion worker failed.");
  return { ok: true, runId, worker: result };
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-ingestion", { requests: 30, windowSeconds: 60 });
  if (blocked) return blocked;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid ingestion action.", issues: parsed.error.flatten() }, { status: 400 });
  const { supabase, user, admin } = await adminContext();
  if (!supabase || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });
  const payload = parsed.data;

  if (payload.action === "adopt") {
    const adopted = await supabase.rpc("adopt_opportunity_candidate", { p_candidate_id: payload.candidateId });
    if (adopted.error) return NextResponse.json({ error: adopted.error.message }, { status: adopted.error.code === "P0002" ? 404 : adopted.error.code === "22023" ? 409 : 500 });
    const value = adopted.data as { source_id?: string; run_id?: string } | null;
    if (!value?.run_id) return NextResponse.json({ error: "The source was adopted but no ingestion run was created." }, { status: 500 });
    try { return NextResponse.json(await invokeWorker(value.run_id)); }
    catch (error) { return NextResponse.json({ ok: true, runId: value.run_id, status: "queued", warning: error instanceof Error ? error.message : "Worker invocation failed." }, { status: 202 }); }
  }

  if (payload.action === "add_source") {
    const registered = await supabase.rpc("register_official_ingestion_source", {
      p_url: payload.url,
      p_owner_name: payload.ownerName,
      p_entity_type: payload.entityType,
      p_country_code: payload.countryCode || null,
      p_schedule_minutes: payload.scheduleMinutes,
    });
    if (registered.error) return NextResponse.json({ error: registered.error.message }, { status: registered.error.code === "22023" ? 409 : 500 });
    const value = registered.data as { source_id?: string; run_id?: string } | null;
    if (!value?.run_id) return NextResponse.json({ error: "The source was registered but no ingestion run was created." }, { status: 500 });
    try { return NextResponse.json(await invokeWorker(value.run_id)); }
    catch (error) { return NextResponse.json({ ok: true, runId: value.run_id, status: "queued", warning: error instanceof Error ? error.message : "Worker invocation failed." }, { status: 202 }); }
  }

  if (payload.action === "review") {
    const result = await supabase.rpc("review_opportunity_candidate", { p_candidate_id: payload.candidateId, p_decision: payload.decision, p_notes: payload.notes ?? null });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: result.error.code === "P0002" ? 404 : result.error.code === "23514" ? 409 : 500 });
    return NextResponse.json({ ok: true, candidate: result.data });
  }

  if (payload.action === "publish") {
    const result = await supabase.rpc("publish_opportunity_candidate", { p_candidate_id: payload.candidateId });
    if (result.error) {
      const code = result.error.code;
      const status = code === "P0002" ? 404 : code === "23514" ? 422 : code === "42501" ? 403 : 500;
      return NextResponse.json({ error: result.error.message }, { status });
    }
    return NextResponse.json({ ok: true, ...(result.data as Record<string, unknown>) });
  }

  if (payload.action === "set_source") {
    const values: Record<string, unknown> = { enabled: payload.enabled };
    if (payload.scheduleMinutes !== undefined) values.schedule_minutes = payload.scheduleMinutes;
    if (payload.priority !== undefined) values.priority = payload.priority;
    if (payload.enabled) values.next_fetch_at = new Date().toISOString();
    const result = await supabase.from("ingestion_sources").update(values).eq("source_id", payload.sourceId).select("source_id,enabled,priority,schedule_minutes,next_fetch_at").single();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, source: result.data });
  }

  const queued = await supabase.rpc("enqueue_ingestion_source", { p_source_id: payload.sourceId, p_trigger_type: "manual" });
  if (queued.error) return NextResponse.json({ error: queued.error.message }, { status: queued.error.code === "P0002" ? 404 : 500 });
  try {
    return NextResponse.json(await invokeWorker(queued.data));
  } catch (error) {
    return NextResponse.json({ ok: true, runId: queued.data, status: "queued", warning: error instanceof Error ? error.message : "Worker invocation failed." }, { status: 202 });
  }
}
