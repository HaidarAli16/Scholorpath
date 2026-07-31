import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { demoExecutionData } from "@/modules/tasks/demo";
import { taskStates, type ExecutionTask, type TaskState } from "@/modules/tasks/types";
import { guardMutation } from "@/lib/api/security";

const payloadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), title: z.string().trim().min(2).max(180), description: z.string().max(2000).optional(), dueAt: z.string().datetime().nullable().optional(), impactLevel: z.enum(["critical", "high", "medium", "low"]).default("medium"), impactType: z.enum(["eligibility", "application_readiness", "scholarship", "funding", "deadline", "document", "offer", "visa", "profile", "research"]).default("application_readiness"), applicationId: z.string().uuid().nullable().optional(), estimatedMinutes: z.number().int().positive().max(1440).nullable().optional() }),
  z.object({ action: z.literal("transition"), id: z.string().uuid(), state: z.enum(taskStates), note: z.string().max(2000).optional(), evidenceDocumentId: z.string().uuid().nullable().optional() }),
  z.object({ action: z.literal("move"), id: z.string().uuid(), state: z.enum(taskStates), position: z.number() }),
  z.object({ action: z.literal("update"), id: z.string().uuid(), title: z.string().trim().min(2).max(180).optional(), description: z.string().max(2000).nullable().optional(), dueAt: z.string().datetime().nullable().optional(), assignedName: z.string().max(120).nullable().optional(), assignedEmail: z.string().email().nullable().optional(), impactLevel: z.enum(["critical", "high", "medium", "low"]).optional() }),
]);

async function context() {
  if (!isSupabaseConfigured) return { supabase: null, user: null };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await context();
  if (!supabase || !user) return NextResponse.json({ mode: "demo", authenticated: false, ...demoExecutionData() });
  const [taskResult, readinessResult] = await Promise.all([
    supabase.from("tasks").select("*, applications(title), task_impacts(*, applications(title)), task_dependencies!task_dependencies_task_id_fkey(*, depends_on:tasks!task_dependencies_depends_on_task_id_fkey(title,state)), task_events(id,event_type,from_state,to_state,metadata,created_at)").eq("user_id", user.id).order("impact_score", { ascending: false }).order("due_at", { ascending: true }),
    supabase.from("application_readiness_snapshots").select("*, applications(title)").eq("user_id", user.id).order("generated_at", { ascending: false }),
  ]);
  if (taskResult.error) return NextResponse.json({ error: taskResult.error.message, setupRequired: true }, { status: 500 });
  const seen = new Set<string>();
  const readiness = (readinessResult.data ?? []).filter((row: Record<string, unknown>) => { const id = String(row.application_id); if (seen.has(id)) return false; seen.add(id); return true; }).map((row: Record<string, unknown>) => ({ ...row, application_title: (row.applications as { title?: string } | null)?.title || "Application", updated_at: row.generated_at }));
  const tasks = (taskResult.data ?? []).map(normalizeTask);
  return NextResponse.json({ mode: "live", authenticated: true, tasks, readiness });
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "tasks", { requests: 60, windowSeconds: 60 });
  if (blocked) return blocked;
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task action.", issues: parsed.error.flatten() }, { status: 400 });
  const { supabase, user } = await context();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to save task changes.", demo: true }, { status: 401 });
  const action = parsed.data;
  if (action.action === "create") {
    const result = await supabase.rpc("create_personal_task", { p_title: action.title, p_description: action.description ?? null, p_due_at: action.dueAt ?? null, p_impact_level: action.impactLevel, p_impact_type: action.impactType, p_application_id: action.applicationId ?? null, p_estimated_minutes: action.estimatedMinutes ?? null });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data: normalizeTask(result.data) });
  }
  const current = await supabase.from("tasks").select("id,application_id").eq("id", action.id).eq("user_id", user.id).single();
  if (current.error) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if (action.action === "update") {
    const result = await supabase.rpc("update_task_metadata", { p_task_id: action.id, p_title: action.title ?? null, p_description: action.description ?? null, p_due_at: action.dueAt ?? null, p_due_at_set: action.dueAt !== undefined, p_assigned_name: action.assignedName ?? null, p_assigned_email: action.assignedEmail ?? null, p_impact_level: action.impactLevel ?? null });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data: normalizeTask(result.data) });
  }
  const result = await supabase.rpc("transition_task", {
    p_task_id: action.id,
    p_to_state: action.state,
    p_position: action.action === "move" ? action.position : null,
    p_note: action.action === "transition" ? action.note ?? null : null,
    p_evidence_document_id: action.action === "transition" ? action.evidenceDocumentId ?? null : null,
  });
  if (result.error) {
    const status = result.error.code === "23514" ? 409 : result.error.code === "P0002" ? 404 : 500;
    return NextResponse.json({ error: result.error.message }, { status });
  }
  return NextResponse.json({ ok: true, data: result.data });
}

function normalizeTask(row: Record<string, unknown>): ExecutionTask {
  const impactsRaw = (row.task_impacts as Array<Record<string, unknown>> | undefined) ?? [];
  const depsRaw = (row.task_dependencies as Array<Record<string, unknown>> | undefined) ?? [];
  return { ...(row as unknown as ExecutionTask), application_title: (row.applications as { title?: string } | null)?.title ?? null, evidence_required: Array.isArray(row.evidence_required) ? row.evidence_required as string[] : [], dependencies: depsRaw.map((d) => ({ id: String(d.id), depends_on_task_id: String(d.depends_on_task_id), relation: d.relation as "blocks" | "enables", title: (d.depends_on as { title?: string } | null)?.title, state: (d.depends_on as { state?: TaskState } | null)?.state })), impacts: impactsRaw.map((i) => ({ id: String(i.id), application_id: i.application_id as string | null, entity_type: i.entity_type as ExecutionTask["impacts"][number]["entity_type"], entity_id: i.entity_id as string | null, impact_label: String(i.impact_label), readiness_delta: Number(i.readiness_delta || 0), application_title: (i.applications as { title?: string } | null)?.title })), activity: ((row.task_events as ExecutionTask["activity"]) ?? []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) };
}
