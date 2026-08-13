"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type IngestionSource = {
  source_id: string; adapter_id: string; enabled: boolean; priority: number; schedule_minutes: number; next_fetch_at: string;
  last_attempt_at?: string | null; last_success_at?: string | null; consecutive_failures: number; robots_state: string; last_http_status?: number | null; last_error?: string | null;
  source_records: { id: string; canonical_url: string; owner_name: string; country_code?: string | null; status: string } | null;
  ingestion_adapters: { id: string; adapter_key: string; name: string; kind: string; entity_type: string; parser_version: string } | null;
};

export type IngestionRun = {
  id: string; source_id: string; status: string; trigger_type: string; queued_at: string; started_at?: string | null; finished_at?: string | null;
  http_status?: number | null; robots_state?: string | null; content_changed?: boolean | null; bytes_received?: number | null; discovered_count: number; candidate_count: number;
  duration_ms?: number | null; error_code?: string | null; error_message?: string | null; source_records: { owner_name: string; canonical_url: string } | null;
};

export type OpportunityCandidate = {
  id: string; entity_type: "programme" | "scholarship"; canonical_url: string; title: string; provider_name: string; country_code?: string | null;
  normalized_data: Record<string, unknown>; validation_errors: string[]; change_summary: { kind?: string; changed_fields?: string[] };
  review_state: string; structured_score?: number | null; reviewed_at?: string | null; review_notes?: string | null; published_at?: string | null; created_at: string;
  source_records: { owner_name: string; canonical_url: string } | null;
};

export type FailingSource = {
  source_id: string; consecutive_failures: number; last_success_at?: string | null; next_fetch_at: string; last_error?: string | null; last_http_status?: number | null;
  source_records: { canonical_url: string; owner_name: string; country_code?: string | null } | null;
};

type Payload = {
  sources: IngestionSource[];
  runs: IngestionRun[];
  candidates: OpportunityCandidate[];
  approvedCandidates: OpportunityCandidate[];
  failingSources: FailingSource[];
  candidateCount: number;
  adapters: Array<Record<string, unknown>>;
};

export function useIngestion() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ingestion", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ingestion control plane is unavailable.");
      setData(payload); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Ingestion control plane is unavailable."); }
    finally { setLoading(false); }
  }, []);

  const act = useCallback(async (key: string, action: Record<string, unknown>) => {
    setBusy(key); setError("");
    try {
      const response = await fetch("/api/admin/ingestion", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(action) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.warning || "Ingestion action failed.");
      await refresh();
      return result;
    } catch (reason) { const message = reason instanceof Error ? reason.message : "Ingestion action failed."; setError(message); throw new Error(message); }
    finally { setBusy(null); }
  }, [refresh]);

  useEffect(() => { void refresh(); }, [refresh]);

  const metrics = useMemo(() => ({
    sources: data?.sources.filter((item) => item.enabled).length ?? 0,
    due: data?.sources.filter((item) => item.enabled && new Date(item.next_fetch_at).getTime() <= Date.now()).length ?? 0,
    failing: data?.failingSources.length ?? data?.sources.filter((item) => item.consecutive_failures > 0 || Boolean(item.last_error) || item.robots_state === "blocked").length ?? 0,
    review: data?.candidateCount ?? 0,
    approved: data?.approvedCandidates.length ?? 0,
  }), [data]);

  return { data, loading, error, busy, metrics, refresh, act };
}
