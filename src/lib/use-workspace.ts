"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssessmentInput } from "@/modules/assessment/types";

export type LiveTask = { id: string; title: string; description?: string | null; state: string; due_at?: string | null; application_id?: string | null; system_generated: boolean };
export type LiveDocument = { id: string; name: string; category: string; status: string; version: number; created_at: string; updated_at: string; metadata?: Record<string, unknown> };

type WorkspacePayload = {
  mode: "demo" | "live";
  authenticated: boolean;
  user?: { id: string; email?: string };
  data?: { profile?: { first_name?: string; nationality?: string; current_country?: string; preferred_currency?: string } | null; assessment?: { completion_percent?: number; answers?: Partial<AssessmentInput> } | null; tasks?: LiveTask[]; documents?: LiveDocument[]; applications?: unknown[]; portfolios?: unknown[]; notifications?: unknown[]; writing?: unknown[]; funding?: unknown[]; offers?: unknown[] } | null;
};

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspacePayload>({ mode: "demo", authenticated: false, data: null });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (response.ok) setWorkspace(await response.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const act = useCallback(async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/workspace", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The change could not be saved.");
    await refresh();
    return result.data;
  }, [refresh]);

  return { ...workspace, loading, refresh, act };
}
