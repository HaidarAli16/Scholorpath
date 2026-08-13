import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateTasks } from "@/modules/tasks/engine";
import type { ExecutionTask, RequirementInput } from "@/modules/tasks/types";
import { guardMutation } from "@/lib/api/security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "task-generation", { requests: 12, windowSeconds: 60 });
  if (blocked) return blocked;
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Task database is not configured." }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate tasks." }, { status: 401 });
  const duplicateCandidates = await supabase.from("tasks").select("id,title,created_at").eq("user_id", user.id).eq("source_type", "profile_gap").not("state", "in", "(completed,not_applicable,cancelled)").order("created_at", { ascending: false });
  if (duplicateCandidates.error) {
    console.error("Task reconciliation query failed", { code: duplicateCandidates.error.code, message: duplicateCandidates.error.message });
    return NextResponse.json({ error: "Task history could not be reconciled." }, { status: 500 });
  }
  const seenTitles = new Set<string>();
  const duplicateIds = (duplicateCandidates.data ?? []).flatMap((task) => {
    const key = task.title.trim().toLowerCase();
    if (seenTitles.has(key)) return [task.id];
    seenTitles.add(key);
    return [];
  });
  if (duplicateIds.length) {
    const cleanupResults = await Promise.all(duplicateIds.map((id) => supabase.rpc("transition_task", { p_task_id: id, p_to_state: "cancelled", p_position: null, p_note: "Superseded by a newer pathway assessment.", p_evidence_document_id: null })));
    const cleanupError = cleanupResults.find((result) => result.error)?.error;
    if (cleanupError) {
      console.error("Task reconciliation update failed", { code: cleanupError.code, message: cleanupError.message });
      return NextResponse.json({ error: "Duplicate pathway tasks could not be reconciled." }, { status: 500 });
    }
  }
  const [requirementResult, taskResult] = await Promise.all([
    supabase.from("application_requirements").select("*,applications!requirements_application_owner_fk(title)").eq("user_id", user.id),
    supabase.from("tasks").select("dedupe_key,state").eq("user_id", user.id),
  ]);
  if (requirementResult.error || taskResult.error) return NextResponse.json({ error: "Task inputs could not be loaded." }, { status: 500 });
  const requirements = (requirementResult.data ?? []).map((row) => ({ ...row, application_title: (row.applications as { title?: string } | null)?.title })) as RequirementInput[];
  const generated = generateTasks(requirements, taskResult.data as Pick<ExecutionTask, "dedupe_key" | "state">[]);
  const { data: created, error } = await supabase.rpc("ingest_generated_tasks", { p_tasks: generated });
  if (error) return NextResponse.json({ error: "Tasks could not be generated atomically." }, { status: 500 });
  return NextResponse.json({ ok: true, generated: Number(created ?? 0), deduplicated: duplicateIds.length, evaluated: requirements.length });
}
