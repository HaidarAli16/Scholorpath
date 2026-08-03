"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Opportunity } from "@/modules/product/demo-data";
import type { LiveScholarshipPreview } from "@/modules/assessment/types";

export type CatalogueItem = {
  id: string;
  entityType: "programme" | "scholarship";
  title: string;
  provider: string;
  country_code?: string | null;
  deadline_at?: string | null;
  deadline_timezone?: string | null;
  application_url?: string | null;
  tuition_amount?: number | string | null;
  tuition_currency?: string | null;
  award_type?: string | null;
  award_value?: Record<string, unknown> | null;
  last_verified_at?: string | null;
  next_review_at?: string | null;
  attributes?: Record<string, unknown> | null;
};

export type RecommendationComponent = {
  entity_type: "programme" | "scholarship";
  entity_id: string;
  state: "confirmed" | "conditional" | "failed" | "unknown" | "stale";
  final_score: number;
  reasons?: string[];
  failed_gates?: string[];
  open_checks?: string[];
  next_actions?: string[];
};

export type Portfolio = { portfolio_items?: Array<{ entity_type: string; entity_id: string }> };

const countries: Record<string, string> = { GB: "United Kingdom", UK: "United Kingdom", DE: "Germany", IE: "Ireland", NL: "Netherlands", FR: "France", SE: "Sweden", FI: "Finland", EU: "Europe" };
const currency = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

function deadlineLabel(value?: string | null) {
  if (!value) return "Deadline unverified";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Deadline unverified" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function valueLabel(item: CatalogueItem) {
  if (item.entityType === "scholarship") {
    const amount = Number(item.award_value?.amount ?? 0);
    const code = String(item.award_value?.currency ?? "");
    return amount > 0 ? `${code} ${currency.format(amount)} award` : item.award_type || "Funding details verified per cycle";
  }
  const amount = Number(item.tuition_amount ?? 0);
  return amount > 0 ? `${item.tuition_currency || ""} ${currency.format(amount)} tuition` : "Tuition requires verification";
}

function matchLabel(state?: RecommendationComponent["state"]): Opportunity["match"] {
  if (state === "confirmed") return "Confirmed match";
  if (state === "conditional") return "Conditional match";
  return "Needs verification";
}

function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code) || code === "EU") return code === "EU" ? "🇪🇺" : "🌍";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
}

export function useOpportunities(portfolios?: unknown[]) {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationComponent[]>([]);
  const [discoveryItems, setDiscoveryItems] = useState<Opportunity[]>([]);
  const [mode, setMode] = useState<"loading" | "demo" | "live" | "live-discovery">("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [catalogueResponse, recommendationResponse, discoveryResponse] = await Promise.all([
        fetch("/api/catalogue?limit=50", { cache: "no-store" }),
        fetch("/api/recommendations/latest", { cache: "no-store" }),
        fetch("/api/scholarships/live?limit=12", { cache: "no-store" }),
      ]);
      const catalogue = await catalogueResponse.json();
      if (!catalogueResponse.ok) throw new Error(catalogue.error || "Catalogue could not be loaded.");
      const latest = recommendationResponse.ok ? await recommendationResponse.json() : { results: [] };
      setItems(catalogue.items ?? []);
      setRecommendations(latest.results ?? []);
      const discovery = discoveryResponse.ok ? await discoveryResponse.json() as { items?: LiveScholarshipPreview[] } : { items: [] };
      const mappedDiscovery = (discovery.items ?? []).map(mapLiveScholarship);
      setDiscoveryItems(mappedDiscovery);
      setMode(catalogue.mode === "live" ? "live" : mappedDiscovery.length ? "live-discovery" : "demo");
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Catalogue could not be loaded.");
      setMode("demo");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const opportunities = useMemo<Opportunity[]>(() => {
    const combined = [...mapCatalogueItems(items, recommendations, portfolios as Portfolio[] | undefined), ...discoveryItems];
    return [...new Map(combined.map((item) => [item.id, item])).values()];
  }, [discoveryItems, items, portfolios, recommendations]);

  return { items: opportunities, mode, loading: mode === "loading", error, refresh };
}

function mapLiveScholarship(item: LiveScholarshipPreview): Opportunity {
  const flags: Record<string, string> = { "United Kingdom": "GB", Germany: "DE", Netherlands: "NL", Ireland: "IE", "United States": "US", Canada: "CA", Australia: "AU" };
  return {
    id: item.id,
    kind: "Scholarship",
    title: item.title,
    provider: item.provider,
    country: item.country,
    flag: flags[item.country] ?? "INT",
    deadline: "Deadline unverified",
    deadlineNote: "Live discovery lead · official cycle and deadline required",
    value: item.value,
    match: "Needs verification",
    freshness: "Review due",
    reasons: item.fitReasons.length ? item.fitReasons : ["Surfaced from a live third-party discovery feed"],
    condition: item.eligibilitySummary,
    sourceUrl: item.sourceUrl,
  };
}

export function mapCatalogueItems(items: CatalogueItem[], recommendations: RecommendationComponent[], portfolios?: Portfolio[], now = Date.now()): Opportunity[] {
  const saved = new Set(portfolios?.flatMap((portfolio) => portfolio.portfolio_items ?? []).map((item) => `${item.entity_type}:${item.entity_id}`) ?? []);
  const resultMap = new Map(recommendations.map((item) => [`${item.entity_type}:${item.entity_id}`, item]));
  return items.map((item) => {
      const result = resultMap.get(`${item.entityType}:${item.id}`);
      const reviewDue = !item.last_verified_at || Boolean(item.next_review_at && new Date(item.next_review_at).getTime() < now);
      const reasons = result?.reasons?.length ? result.reasons : ["Official record is published", "Complete your profile to calculate personal alignment"];
      const condition = result?.failed_gates?.[0] || result?.open_checks?.[0] || result?.next_actions?.[0] || "No unresolved condition is recorded.";
      const code = item.country_code?.toUpperCase() || "INT";
      return {
        id: item.id,
        kind: item.entityType === "programme" ? "Programme" : "Scholarship",
        title: item.title,
        provider: item.provider,
        country: countries[code] || code,
        flag: countryFlag(code),
        deadline: deadlineLabel(item.deadline_at),
        deadlineAt: item.deadline_at ?? undefined,
        deadlineNote: item.deadline_at ? `${item.deadline_timezone || "Official source timezone"} · verify before submission` : "Deadline is an open check",
        value: valueLabel(item),
        match: matchLabel(result?.state),
        freshness: reviewDue ? "Review due" : "Verified",
        reasons: reasons.slice(0, 3),
        condition,
        sourceUrl: item.application_url ?? undefined,
        lastVerifiedAt: item.last_verified_at ?? undefined,
        saved: saved.has(`${item.entityType}:${item.id}`),
      };
  });
}
