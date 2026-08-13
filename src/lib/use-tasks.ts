"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApplicationReadiness, ExecutionTask, ImpactLevel, ImpactType, TaskState } from "@/modules/tasks/types";

type TaskPayload = { mode: "live"; authenticated: true; tasks: ExecutionTask[]; readiness: ApplicationReadiness[] };
type Action =
  | { action: "create"; title: string; description?: string; dueAt?: string | null; impactLevel?: ImpactLevel; impactType?: ImpactType; applicationId?: string | null; estimatedMinutes?: number | null }
  | { action: "transition"; id: string; state: TaskState; note?: string; evidenceDocumentId?: string | null }
  | { action: "move"; id: string; state: TaskState; position: number }
  | { action: "update"; id: string; title?: string; description?: string | null; dueAt?: string | null; assignedName?: string | null; assignedEmail?: string | null; impactLevel?: ImpactLevel };

export function useTasks() {
  const [data, setData] = useState<TaskPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      let payload = await response.json();
      if (response.status === 401) throw new Error("Your session needs a quick refresh. Sign in again and your saved tasks will still be here.");
      if (!response.ok) throw new Error(payload.error || "Tasks could not be loaded.");
      if (payload.mode === "live") {
        const generationResponse = await fetch("/api/tasks/generate", { method: "POST" });
        const generation = await generationResponse.json().catch(() => ({ generated: 0, deduplicated: 0 }));
        if (generationResponse.ok && (Number(generation.generated || 0) > 0 || Number(generation.deduplicated || 0) > 0)) {
          const refreshed = await fetch("/api/tasks", { cache: "no-store" });
          if (refreshed.ok) payload = await refreshed.json();
        }
      }
      setData(payload); setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Tasks could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const act = useCallback(async (action: Action) => {
    if (!data) return;
    const response = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Task could not be updated.");
    await refresh();
  }, [data, refresh]);

  const generate = useCallback(async () => {
    if (!data?.authenticated) throw new Error("Sign in to generate tasks.");
    const response = await fetch("/api/tasks/generate", { method: "POST" }); const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Tasks could not be generated.");
    await refresh(); return Number(payload.generated || 0);
  }, [data?.authenticated, refresh]);

  return useMemo(() => ({ tasks: data?.tasks ?? [], readiness: data?.readiness ?? [], mode: data?.mode ?? "unavailable", authenticated: data?.authenticated ?? false, loading, error, act, generate, refresh }), [data, loading, error, act, generate, refresh]);
}
