"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssessmentInput } from "@/modules/assessment/types";

export type LiveTask = { id: string; title: string; description?: string | null; state: string; due_at?: string | null; application_id?: string | null; system_generated: boolean };
export type LiveDocument = { id: string; name: string; category: string; status: string; version: number; created_at: string; updated_at: string; metadata?: Record<string, unknown> };

export type WorkspacePayload = {
  mode: "loading" | "live" | "unauthenticated" | "unavailable";
  authenticated: boolean;
  user?: { id: string; email?: string };
  data?: { profile?: { first_name?: string; nationality?: string; current_country?: string; preferred_currency?: string } | null; assessment?: { completion_percent?: number; answers?: Partial<AssessmentInput> } | null; tasks?: LiveTask[]; documents?: LiveDocument[]; applications?: unknown[]; portfolios?: unknown[]; notifications?: unknown[]; writing?: unknown[]; funding?: unknown[]; offers?: unknown[] } | null;
};

export function useWorkspace(initialWorkspace?: WorkspacePayload) {
  const [workspace, setWorkspace] = useState<WorkspacePayload>(initialWorkspace ?? { mode: "loading", authenticated: false, data: null });
  const [loading, setLoading] = useState(!initialWorkspace);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const mode = response.status === 401 ? "unauthenticated" : "unavailable";
        setWorkspace({ mode, authenticated: false, data: null });
        setError(payload.error || "Workspace could not be loaded.");
        return;
      }
      setWorkspace(payload);
      setError(null);
    } catch (cause) {
      setWorkspace({ mode: "unavailable", authenticated: false, data: null });
      setError(cause instanceof Error ? cause.message : "Workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialWorkspace) void refresh();
  }, [initialWorkspace, refresh]);

  const act = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The change could not be saved.");
    await refresh();
    return result.data;
  }, [refresh]);

  return { ...workspace, loading, error, refresh, act };
}
