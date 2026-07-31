import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canTransition, calculateReadiness } from "@/modules/tasks/engine";
import { demoExecutionData } from "@/modules/tasks/demo";
import { taskStates, type ExecutionTask, type RequirementInput, type TaskState } from "@/modules/tasks/types";

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
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task action.", issues: parsed.error.flatten() }, { status: 400 });
  const { supabase, user } = await context();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to save task changes.", demo: true }, { status: 401 });
  const action = parsed.data;
  if (action.action === "create") {
    const values = { user_id: user.id, title: action.title, description: action.description ?? null, due_at: action.dueAt ?? null, impact_level: action.impactLevel, impact_type: action.impactType, impact_score: { critical: 90, high: 70, medium: 45, low: 20 }[action.impactLevel], application_id: action.applicationId ?? null, estimated_minutes: action.estimatedMinutes ?? null, state: "todo", source_type: "personal", system_generated: false };
    const result = await supabase.from("tasks").insert(values).select().single();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    await supabase.from("task_events").insert({ user_id: user.id, task_id: result.data.id, actor_user_id: user.id, event_type: "created", to_state: "todo" });
    if (action.applicationId) await refreshReadiness(supabase, user.id, action.applicationId);
    return NextResponse.json({ ok: true, data: normalizeTask(result.data) });
  }
  const current = await supabase.from("tasks").select("*,task_impacts(application_id)").eq("id", action.id).eq("user_id", user.id).single();
  if (current.error) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  if (action.action === "update") {
    const patch = { ...(action.title !== undefined && { title: action.title }), ...(action.description !== undefined && { description: action.description }), ...(action.dueAt !== undefined && { due_at: action.dueAt }), ...(action.assignedName !== undefined && { assigned_name: action.assignedName }), ...(action.assignedEmail !== undefined && { assigned_email: action.assignedEmail }), ...(action.impactLevel !== undefined && { impact_level: action.impactLevel }) };
    const result = await supabase.from("tasks").update(patch).eq("id", action.id).eq("user_id", user.id).select().single();
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    await supabase.from("task_events").insert({ user_id: user.id, task_id: action.id, actor_user_id: user.id, event_type: "updated", metadata: patch });
    if (current.data.application_id) await refreshReadiness(supabase, user.id, current.data.application_id);
    return NextResponse.json({ ok: true, data: normalizeTask(result.data) });
  }
  const toState = action.state as TaskState; const fromState = current.data.state as TaskState;
  if (!canTransition(fromState, toState)) return NextResponse.json({ error: `Cannot move a task from ${fromState} to ${toState}.` }, { status: 409 });
  const values = { state: toState, ...(action.action === "move" && { position: action.position }), completed_at: toState === "completed" ? new Date().toISOString() : null, ...(action.action === "transition" && { completion_note: action.note ?? null, completion_evidence_document_id: action.evidenceDocumentId ?? null }), ...(fromState === "completed" && toState === "todo" && { reopened_count: Number(current.data.reopened_count || 0) + 1 }) };
  const result = await supabase.from("tasks").update(values).eq("id", action.id).eq("user_id", user.id).select().single();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  await supabase.from("task_events").insert({ user_id: user.id, task_id: action.id, actor_user_id: user.id, event_type: action.action === "move" ? "moved" : "state_changed", from_state: fromState, to_state: toState, metadata: action.action === "transition" ? { note: action.note ?? null } : { position: action.position } });
  if (toState === "completed" && current.data.source_type === "requirement" && current.data.source_id) {
    await supabase.from("application_requirements").update({ state: "confirmed" }).eq("id", current.data.source_id).eq("user_id", user.id);
  }
  if (toState === "completed") {
    const dependents = await supabase.from("task_dependencies").select("task_id").eq("user_id", user.id).eq("depends_on_task_id", action.id).eq("relation", "blocks");
    const dependentIds = (dependents.data ?? []).map((dependency) => dependency.task_id);
    if (dependentIds.length) {
      await supabase.from("tasks").update({ state: "todo" }).eq("user_id", user.id).eq("state", "blocked").in("id", dependentIds);
      await supabase.from("task_events").insert(dependentIds.map((taskId) => ({ user_id: user.id, task_id: taskId, actor_user_id: user.id, event_type: "dependency_resolved", from_state: "blocked", to_state: "todo", metadata: { completed_dependency_id: action.id } })));
    }
  }
  const affectedApplications = new Set<string>([current.data.application_id, ...((current.data.task_impacts ?? []) as Array<{ application_id: string | null }>).map((impact) => impact.application_id)].filter(Boolean) as string[]);
  await Promise.all([...affectedApplications].map((applicationId) => refreshReadiness(supabase, user.id, applicationId)));
  return NextResponse.json({ ok: true, data: normalizeTask(result.data) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshReadiness(supabase: any, userId: string, applicationId: string) {
  const [app, requirements, tasks] = await Promise.all([
    supabase.from("applications").select("id,title").eq("id", applicationId).eq("user_id", userId).single(),
    supabase.from("application_requirements").select("*").eq("application_id", applicationId).eq("user_id", userId),
    supabase.from("tasks").select("*,task_impacts(*)").eq("user_id", userId).or(`application_id.eq.${applicationId},task_impacts.application_id.eq.${applicationId}`),
  ]);
  if (app.error || requirements.error || tasks.error) return;
  const normalized = (tasks.data ?? []).map(normalizeTask) as ExecutionTask[];
  const readiness = calculateReadiness(applicationId, app.data.title, requirements.data as RequirementInput[], normalized);
  await supabase.from("application_readiness_snapshots").insert({ user_id: userId, application_id: applicationId, score: readiness.score, confirmed_count: readiness.confirmed_count, total_count: readiness.total_count, blocking_count: readiness.blocking_count, missing_count: readiness.missing_count, breakdown: { overdue_critical_count: readiness.overdue_critical_count, next_task_id: readiness.next_task_id } });
}

function normalizeTask(row: Record<string, unknown>): ExecutionTask {
  const impactsRaw = (row.task_impacts as Array<Record<string, unknown>> | undefined) ?? [];
  const depsRaw = (row.task_dependencies as Array<Record<string, unknown>> | undefined) ?? [];
  return { ...(row as unknown as ExecutionTask), application_title: (row.applications as { title?: string } | null)?.title ?? null, evidence_required: Array.isArray(row.evidence_required) ? row.evidence_required as string[] : [], dependencies: depsRaw.map((d) => ({ id: String(d.id), depends_on_task_id: String(d.depends_on_task_id), relation: d.relation as "blocks" | "enables", title: (d.depends_on as { title?: string } | null)?.title, state: (d.depends_on as { state?: TaskState } | null)?.state })), impacts: impactsRaw.map((i) => ({ id: String(i.id), application_id: i.application_id as string | null, entity_type: i.entity_type as ExecutionTask["impacts"][number]["entity_type"], entity_id: i.entity_id as string | null, impact_label: String(i.impact_label), readiness_delta: Number(i.readiness_delta || 0), application_title: (i.applications as { title?: string } | null)?.title })), activity: ((row.task_events as ExecutionTask["activity"]) ?? []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) };
}
