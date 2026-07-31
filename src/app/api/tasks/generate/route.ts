import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateTasks } from "@/modules/tasks/engine";
import type { ExecutionTask, RequirementInput } from "@/modules/tasks/types";

export async function POST() {
  if (!isSupabaseConfigured) return NextResponse.json({ mode: "demo", generated: 0, message: "Generation runs automatically when Supabase is connected." });
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is unavailable." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to generate tasks." }, { status: 401 });
  const [requirementResult, taskResult] = await Promise.all([
    supabase.from("application_requirements").select("*,applications(title)").eq("user_id", user.id),
    supabase.from("tasks").select("dedupe_key,state").eq("user_id", user.id),
  ]);
  if (requirementResult.error || taskResult.error) return NextResponse.json({ error: requirementResult.error?.message || taskResult.error?.message }, { status: 500 });
  const requirements = (requirementResult.data ?? []).map((row) => ({ ...row, application_title: (row.applications as { title?: string } | null)?.title })) as RequirementInput[];
  const generated = generateTasks(requirements, taskResult.data as Pick<ExecutionTask, "dedupe_key" | "state">[]);
  let created = 0;
  for (const item of generated) {
    const { impacts, dependencies: _dependencies, source_requirement_ids, application_title: _applicationTitle, ...task } = item;
    const inserted = await supabase.from("tasks").insert({ ...task, user_id: user.id }).select("id").single();
    if (inserted.error) continue;
    created += 1;
    if (impacts.length) await supabase.from("task_impacts").insert(impacts.map((impact) => ({ user_id: user.id, task_id: inserted.data.id, application_id: impact.application_id ?? null, entity_type: impact.entity_type, entity_id: impact.entity_id ?? null, impact_label: impact.impact_label, readiness_delta: impact.readiness_delta })));
    await supabase.from("task_events").insert({ user_id: user.id, task_id: inserted.data.id, actor_user_id: user.id, event_type: "generated", to_state: task.state, metadata: { source_requirement_ids } });
  }
  return NextResponse.json({ ok: true, generated: created, evaluated: requirements.length });
}
