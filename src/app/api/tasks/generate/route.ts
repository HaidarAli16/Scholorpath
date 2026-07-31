import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { generateTasks } from "@/modules/tasks/engine";
import type { ExecutionTask, RequirementInput } from "@/modules/tasks/types";
import { guardMutation } from "@/lib/api/security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "task-generation", { requests: 12, windowSeconds: 60 });
  if (blocked) return blocked;
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
  const { data: created, error } = await supabase.rpc("ingest_generated_tasks", { p_tasks: generated });
  if (error) return NextResponse.json({ error: "Tasks could not be generated atomically.", detail: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, generated: Number(created ?? 0), evaluated: requirements.length });
}
