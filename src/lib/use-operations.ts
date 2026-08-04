"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type OperationsPayload = {
  roles: string[];
  sources: Array<{ id: string; owner_name: string; canonical_url: string; status: string; next_review_at?: string | null; updated_at?: string }>;
  facts: Array<{ id: string; entity_type: string; entity_key: string; field_key: string; state: string; updated_at: string; source_records?: { owner_name?: string; canonical_url?: string } | null }>;
  programmes: Array<{ id: string; title: string; institution_name: string; state: string; last_verified_at?: string | null; next_review_at?: string | null }>;
  scholarships: Array<{ id: string; title: string; provider_name: string; state: string; last_verified_at?: string | null; next_review_at?: string | null }>;
  corrections: Array<{ id: string; entity_type: string; description: string; status: string; created_at: string }>;
};

export function useOperations() {
  const [data, setData] = useState<OperationsPayload | null>(null);
  const [state, setState] = useState<"loading" | "live" | "setup" | "forbidden" | "error">("loading");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/operations", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setData(payload);
        setState("live");
        setMessage("");
        return;
      }
      setData(null);
      setState(response.status === 503 ? "setup" : response.status === 403 ? "forbidden" : "error");
      setMessage(payload.error ?? "Operations data is unavailable.");
    } catch (error) {
      setData(null);
      setState("error");
      setMessage(error instanceof Error ? error.message : "Operations data is unavailable.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const metrics = useMemo(() => {
    const today = Date.now();
    const due = data?.sources.filter((item) => item.next_review_at && new Date(item.next_review_at).getTime() <= today + 14 * 86_400_000).length ?? 0;
    return {
      sources: data?.sources.length ?? 0,
      facts: data?.facts.length ?? 0,
      conflicts: data?.facts.filter((item) => item.state === "conflict").length ?? 0,
      reviewQueue: data?.facts.filter((item) => ["draft", "in_review", "stale"].includes(item.state)).length ?? 0,
      due,
      programmes: data?.programmes.filter((item) => item.state === "published").length ?? 0,
      scholarships: data?.scholarships.filter((item) => item.state === "published").length ?? 0,
      corrections: data?.corrections.length ?? 0,
    };
  }, [data]);

  return { data, state, message, metrics, refresh };
}
