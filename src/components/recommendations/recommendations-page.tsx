"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, Check, ChevronRight, ExternalLink, RefreshCw, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContextHelp } from "@/components/ui/contextual-help";
import type { AssessmentHandoff } from "@/lib/assessment-handoff";

type Recommendation = {
  entity_type: "programme" | "scholarship";
  entity_id: string;
  title?: string | null;
  provider?: string | null;
  country_code?: string | null;
  state: "confirmed" | "conditional" | "failed" | string;
  final_score: number | string;
  score_components?: Record<string, number | string> | null;
  reasons?: string[] | null;
  failed_gates?: string[] | null;
  open_checks?: string[] | null;
  next_actions?: string[] | null;
  deadline_at?: string | null;
  application_url?: string | null;
};

export type RecommendationResponse = {
  run: { engine_version?: string; generated_at?: string; catalogue_version?: string } | null;
  profile: Record<string, unknown> | null;
  summary: { totalEvaluated: number; confirmed: number; conditional: number; failed: number; averageScore: number } | null;
  results: Recommendation[];
};

const stateMeta = {
  confirmed: { label: "Strong fit", description: "Your known facts pass the current eligibility gates.", tone: "confirmed" },
  conditional: { label: "Needs evidence", description: "A potentially suitable route with facts or documents still to confirm.", tone: "conditional" },
  failed: { label: "Not eligible now", description: "A published rule currently prevents this route from moving forward.", tone: "failed" },
};

export function RecommendationsPage({ handoff, initialData }: { handoff?: AssessmentHandoff | null; initialData?: RecommendationResponse | null }) {
  const [data, setData] = useState<RecommendationResponse | null>(initialData ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error" | "signed-out">(initialData === undefined ? "loading" : initialData?.results.length ? "ready" : "empty");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/recommendations/detailed", { cache: "no-store" });
      const payload = await response.json() as RecommendationResponse & { error?: string };
      if (response.status === 401) {
        if (handoff?.report.intelligence?.opportunities.length) {
          const results = handoff.report.intelligence.opportunities.map((item) => ({
            entity_type: item.kind === "programme" ? "programme" as const : "scholarship" as const,
            entity_id: item.id,
            title: item.title,
            provider: item.provider,
            country_code: item.country,
            state: item.state === "aligned" ? "confirmed" : item.state === "blocked" ? "failed" : "conditional",
            final_score: item.researchPriority,
            score_components: item.components,
            reasons: item.requirements.filter((rule) => rule.outcome === "pass").map((rule) => rule.label),
            failed_gates: item.requirements.filter((rule) => rule.outcome === "fail").map((rule) => rule.label),
            open_checks: item.requirements.filter((rule) => rule.outcome === "unknown").map((rule) => rule.label),
            next_actions: item.requirements.filter((rule) => rule.outcome !== "pass").map((rule) => `Verify ${rule.label.toLowerCase()}`),
            application_url: item.source.url,
          }));
          setData({ run: { engine_version: handoff.report.intelligence.engineVersion, generated_at: handoff.report.intelligence.evaluatedAt }, profile: handoff.profile, summary: { totalEvaluated: results.length, confirmed: results.filter((item) => item.state === "confirmed").length, conditional: results.filter((item) => item.state === "conditional").length, failed: results.filter((item) => item.state === "failed").length, averageScore: Math.round(results.reduce((sum, item) => sum + Number(item.final_score), 0) / Math.max(1, results.length)) }, results });
          setStatus("ready");
          return;
        }
        setStatus("signed-out");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "We could not load your recommendations.");
      setData(payload);
      setStatus(payload.results?.length ? "ready" : "empty");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not load your recommendations.");
      setStatus("error");
    }
  }, [handoff]);

  useEffect(() => {
    if (initialData === undefined) void load();
  }, [initialData, load]);

  const grouped = useMemo(() => ({
    confirmed: data?.results.filter((item) => item.state === "confirmed") ?? [],
    conditional: data?.results.filter((item) => item.state === "conditional") ?? [],
    failed: data?.results.filter((item) => item.state === "failed") ?? [],
  }), [data]);

  if (status === "loading") return <RecommendationLoading />;
  if (status === "signed-out") return <RecommendationMessage icon={ShieldCheck} title="Sign in to see your pathway matches" text="Recommendations use your private education, evidence and funding profile. Sign in to keep that analysis personal." action="Sign in" href="/auth?next=%2Frecommendations" />;
  if (status === "error") return <RecommendationMessage icon={AlertCircle} title="Recommendations are temporarily unavailable" text={error} action="Try again" onClick={() => void load()} />;
  if (status === "empty") return <RecommendationMessage icon={Sparkles} title="Finish your pathway assessment first" text="Once your profile has been assessed, CandidRoute will show each eligible route, every unresolved check and the highest-impact next action." action="Build my pathway" href="/" />;

  const summary = data?.summary;
  return (
    <div className="recommendations-page">
      <section className="recommendations-hero">
        <div>
          <span className="product-eyebrow">Explainable recommendations</span>
          <h1>Your best routes, explained simply.</h1>
          <p>Start with the strongest fit, then fix the one thing holding it back. Your match percentage is a planning score—not an admission prediction.</p>
          <div className="recommendations-hero__actions">
            <Link className="product-button product-button--light" href="/report">Open pathway report <ArrowRight size={15} /></Link>
            <button className="recommendations-refresh" onClick={() => void load()}><RefreshCw size={15} /> Refresh results</button>
          </div>
        </div>
        <aside className="recommendations-average">
          <ScoreRing value={summary?.averageScore ?? 0} label="average research priority" />
          <ContextHelp
            title="Research priority, not acceptance probability"
            summary="This score orders routes by current fit and feasibility. It does not predict an admission, visa or scholarship decision."
            details={["Published eligibility rules are checked first.", "Evidence readiness, funding, deadlines and profile fit then shape the order.", "Missing or stale facts remain visible as open checks instead of being guessed."]}
            note="A high score means investigate this route sooner; it is never a promise of success."
          />
          <small>{data?.run?.generated_at ? `Last evaluated ${formatDate(data.run.generated_at)}` : "Latest evaluated results"}</small>
        </aside>
      </section>

      <section className="recommendations-summary" aria-label="Recommendation overview">
        <SummaryMetric value={summary?.totalEvaluated ?? 0} label="routes evaluated" tone="blue" />
        <SummaryMetric value={summary?.confirmed ?? 0} label="strong fits" tone="green" />
        <SummaryMetric value={summary?.conditional ?? 0} label="need evidence" tone="amber" />
        <SummaryMetric value={summary?.failed ?? 0} label="not eligible now" tone="gray" />
      </section>

      {(["confirmed", "conditional", "failed"] as const).map((state) => grouped[state].length > 0 && (
        <section className="recommendation-group" key={state}>
          <header>
            <div><span className={`recommendation-state recommendation-state--${state}`}>{stateMeta[state].label}</span><ContextHelp title={`${stateMeta[state].label} status`} summary={stateMeta[state].description} details={state === "confirmed" ? ["All currently loaded hard rules pass.", "Any later source change can trigger a new evaluation."] : state === "conditional" ? ["The route remains possible.", "Complete the named evidence checks before treating it as actionable."] : ["A published hard rule currently fails.", "The failed gate is shown on each route so you can verify or change the underlying fact."]} /><h2>{stateMeta[state].description}</h2></div>
            <strong>{grouped[state].length}</strong>
          </header>
          <div className="recommendation-grid">{grouped[state].map((item) => <RecommendationCard key={`${item.entity_type}-${item.entity_id}`} item={item} />)}</div>
        </section>
      ))}
    </div>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  const state = item.state in stateMeta ? item.state as keyof typeof stateMeta : "conditional";
  const components = Object.entries(item.score_components ?? {}).filter(([, value]) => Number.isFinite(Number(value))).slice(0, 4);
  const score = Math.max(0, Math.min(100, Math.round(Number(item.final_score) || 0)));
  const actions = [...(item.failed_gates ?? []), ...(item.open_checks ?? []), ...(item.next_actions ?? [])].slice(0, 3);
  return <article className={`recommendation-card recommendation-card--${state}`}>
    <div className="recommendation-card__top">
      <span className="recommendation-kind"><Sparkles size={14} /> {item.entity_type === "programme" ? "Programme" : "Scholarship"}</span>
      <ScoreRing value={score} label="priority" compact />
    </div>
    <div className="recommendation-card__title"><span className={`recommendation-state recommendation-state--${state}`}>{stateMeta[state].label}</span><h3>{item.title || "Published opportunity"}</h3><p>{item.provider || "Official provider"}{item.country_code ? ` · ${item.country_code}` : ""}</p></div>
    {components.length > 0 && <div className="recommendation-components" aria-label="Score breakdown">{components.map(([label, value]) => <div key={label}><span>{label.replaceAll("_", " ")}</span><i><b style={{ width: `${Math.min(100, Math.max(0, Number(value)))}%` }} /></i><strong>{Math.round(Number(value))}</strong></div>)}</div>}
    {(item.reasons?.length ?? 0) > 0 && <div className="recommendation-reasons"><strong>Why it surfaced</strong>{item.reasons?.slice(0, 2).map((reason) => <span key={reason}><Check size={14} />{reason}</span>)}</div>}
    {actions.length > 0 && <div className="recommendation-actions"><strong>{state === "failed" ? "Rule to resolve" : "Next highest-impact check"}</strong>{actions.map((action) => <Link key={action} href="/workspace"><Target size={14} />{action}<ChevronRight size={14} /></Link>)}</div>}
    <footer>{item.deadline_at && <span><CalendarDays size={14} /> {formatDate(item.deadline_at)}</span>}{item.application_url && <a href={item.application_url} target="_blank" rel="noreferrer">Official source <ExternalLink size={13} /></a>}</footer>
  </article>;
}

function ScoreRing({ value, label, compact = false }: { value: number; label: string; compact?: boolean }) {
  return <div className={`recommendation-score ${compact ? "recommendation-score--compact" : ""}`} style={{ "--score": `${Math.max(0, Math.min(100, value))}%` } as React.CSSProperties}><strong>{Math.round(value)}</strong><span>{label}</span></div>;
}

function SummaryMetric({ value, label, tone }: { value: number; label: string; tone: string }) { return <div className={`recommendation-metric recommendation-metric--${tone}`}><strong>{value}</strong><span>{label}</span></div>; }

function RecommendationLoading() { return <div className="recommendations-loading" aria-label="Loading recommendations"><span><Sparkles size={22} /></span><strong>Evaluating your current pathway</strong><p>Loading the published rules, evidence checks and actions that matter most.</p></div>; }
function RecommendationMessage({ icon: Icon, title, text, action, href, onClick }: { icon: typeof Sparkles; title: string; text: string; action: string; href?: string; onClick?: () => void }) { return <section className="recommendations-message"><span><Icon size={26} /></span><h1>{title}</h1><p>{text}</p>{href ? <Link className="product-button product-button--primary" href={href}>{action} <ArrowRight size={15} /></Link> : <button className="product-button product-button--primary" onClick={onClick}>{action} <RefreshCw size={15} /></button>}</section>; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? "Deadline to verify" : new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date); }
