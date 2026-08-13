"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Check, Clock3, Database, ExternalLink, FileSearch, Globe2, Heart, LoaderCircle, Play, RefreshCw, Send, ShieldCheck, X, Zap } from "lucide-react";
import { useIngestion, type FailingSource, type IngestionRun, type IngestionSource, type OpportunityCandidate } from "@/lib/use-ingestion";
import { ConfirmDialog, ContextHelp } from "@/components/ui/contextual-help";

const dateTime = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });
const relTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function rel(date: string | null | undefined) {
  if (!date) return "never";
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return "just now";
  if (Math.abs(diff) < 3600) return relTime.format(Math.round(diff / 60), "minute");
  if (Math.abs(diff) < 86400) return relTime.format(Math.round(diff / 3600), "hour");
  return relTime.format(Math.round(diff / 86400), "day");
}

function State({ value }: { value: string }) {
  return <span className={`ingestion-state ingestion-state--${value.replaceAll("_", "-")}`}><i />{value.replaceAll("_", " ")}</span>;
}

function Score({ value }: { value: number | null | undefined }) {
  const score = value ?? 0;
  const tone = score >= 70 ? "green" : score >= 40 ? "amber" : "red";
  return <span className="candidate-score-wrap"><span className={`candidate-score candidate-score--${tone}`}>{score}</span><ContextHelp title="Structured score" summary="Extraction completeness and consistency, not opportunity quality or student fit." details={["Required fields, dates, URLs and funding facts increase the score.", "Validation errors and missing source evidence reduce it.", "Reviewers must still inspect the official source before approval."]} /></span>;
}

function Metric({ label, value, note, tone }: { label: string; value: number; note: string; tone: string }) {
  return <article className={`ingestion-metric ingestion-metric--${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

type Tab = "sources" | "review" | "publish" | "health" | "runs";

export function IngestionCommandCenter() {
  const ingestion = useIngestion();
  const [tab, setTab] = useState<Tab>("sources");
  const [query, setQuery] = useState("");

  const sources = useMemo(
    () => (ingestion.data?.sources ?? []).filter((item) =>
      `${item.source_records?.owner_name} ${item.source_records?.canonical_url} ${item.ingestion_adapters?.name}`.toLowerCase().includes(query.toLowerCase())
    ),
    [ingestion.data?.sources, query]
  );

  const nextDue = ingestion.data?.sources.find((item) => item.enabled && new Date(item.next_fetch_at).getTime() <= Date.now());

  useEffect(() => {
    const sync = () => {
      const value = new URLSearchParams(window.location.search).get("tab") as Tab | null;
      if (value && ["sources", "review", "publish", "health", "runs"].includes(value)) setTab(value);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const changeTab = (value: Tab) => {
    setTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState({}, "", url);
  };

  return (
    <div className="ingestion-center">
      <section className="ingestion-hero">
        <div>
          <span className="product-eyebrow">Global opportunity intelligence pipeline</span>
          <h2>Worldwide scholarship ingestion. <ContextHelp title="Protected ingestion workflow" summary="Fetching creates review candidates; it never publishes student-facing truth automatically." details={["Robots and source policy are checked before scheduled fetching.", "Every fetch preserves a snapshot and identifies changed fields.", "A reviewer approves structured facts before a separate publish confirmation."]} /></h2>
          <p>
            50+ official sources across 20+ countries. Fetch politely, preserve every snapshot, detect changes,
            review facts, then publish. Scraped text never becomes recommendation truth automatically.
          </p>
        </div>
        <div>
          <button className="product-button product-button--secondary" onClick={() => void ingestion.refresh()} disabled={ingestion.loading}>
            <RefreshCw className={ingestion.loading ? "spin" : ""} size={16} /> Refresh
          </button>
          <button
            className="product-button product-button--primary"
            disabled={!nextDue || Boolean(ingestion.busy)}
            onClick={() => nextDue && void ingestion.act(nextDue.source_id, { action: "run", sourceId: nextDue.source_id })}
          >
            {ingestion.busy === nextDue?.source_id ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />} Run next due
          </button>
        </div>
      </section>

      <div className="ingestion-metrics">
        <Metric label="Monitored sources" value={ingestion.metrics.sources} note="Official URLs globally" tone="blue" />
        <Metric label="Due now" value={ingestion.metrics.due} note="Ordered by priority" tone="amber" />
        <Metric label="Pending review" value={ingestion.metrics.review} note="Never auto-published" tone="violet" />
        <Metric label="Ready to publish" value={ingestion.metrics.approved} note="Approved by reviewer" tone="green" />
        <Metric label="Needs attention" value={ingestion.metrics.failing} note="Blocked or failing" tone="red" />
      </div>

      {ingestion.error && <div className="auth-message auth-message--error" role="alert">{ingestion.error}</div>}

      <nav className="ingestion-tabs">
        <button className={tab === "sources" ? "active" : ""} onClick={() => changeTab("sources")}>
          <Globe2 size={16} /> Sources <b>{ingestion.metrics.sources}</b>
        </button>
        <button className={tab === "review" ? "active" : ""} onClick={() => changeTab("review")}>
          <FileSearch size={16} /> Review <b>{ingestion.metrics.review}</b>
        </button>
        <button className={tab === "publish" ? "active" : ""} onClick={() => changeTab("publish")}>
          <Send size={16} /> Publish {ingestion.metrics.approved > 0 && <b className="ingestion-tab-badge">{ingestion.metrics.approved}</b>}
        </button>
        <button className={tab === "health" ? "active" : ""} onClick={() => changeTab("health")}>
          <Heart size={16} /> Source health {ingestion.metrics.failing > 0 && <b className="ingestion-tab-badge ingestion-tab-badge--red">{ingestion.metrics.failing}</b>}
        </button>
        <button className={tab === "runs" ? "active" : ""} onClick={() => changeTab("runs")}>
          <Clock3 size={16} /> Run history
        </button>
      </nav>

      {ingestion.loading && !ingestion.data ? (
        <div className="ingestion-loading"><LoaderCircle className="spin" /><strong>Reading the protected ingestion state</strong></div>
      ) : tab === "sources" ? (
        <Sources sources={sources} query={query} setQuery={setQuery} busy={ingestion.busy} act={ingestion.act} />
      ) : tab === "review" ? (
        <Review candidates={ingestion.data?.candidates ?? []} total={ingestion.metrics.review} busy={ingestion.busy} act={ingestion.act} />
      ) : tab === "publish" ? (
        <PublishQueue candidates={ingestion.data?.approvedCandidates ?? []} busy={ingestion.busy} act={ingestion.act} />
      ) : tab === "health" ? (
        <SourceHealth sources={ingestion.data?.failingSources ?? []} allSources={ingestion.data?.sources ?? []} busy={ingestion.busy} act={ingestion.act} />
      ) : (
        <Runs runs={ingestion.data?.runs ?? []} />
      )}
    </div>
  );
}

function Sources({ sources, query, setQuery, busy, act }: {
  sources: IngestionSource[]; query: string; setQuery: (value: string) => void;
  busy: string | null; act: (key: string, action: Record<string, unknown>) => Promise<unknown>;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ url: "", ownerName: "", entityType: "scholarship", countryCode: "", scheduleMinutes: 720 });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await act("add-source", { action: "add_source", ...draft });
    setDraft({ url: "", ownerName: "", entityType: "scholarship", countryCode: "", scheduleMinutes: 720 });
    setAdding(false);
  };

  return (
    <section className="ingestion-panel">
      <header>
        <div>
          <h3>Global source network</h3>
          <p>Each official URL is allowlisted, robots-checked and assigned to a versioned parser. 50+ sources across 20+ countries/regions.</p>
        </div>
        <div className="ingestion-source-tools">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources or adapters" />
          <button className="product-button product-button--secondary" onClick={() => setAdding((value) => !value)}>
            <Globe2 size={15} /> Add official source
          </button>
        </div>
      </header>

      {adding && (
        <form className="ingestion-add-source" onSubmit={(event) => void submit(event)}>
          <label><span>Secure official URL</span><input type="url" required pattern="https://.*" placeholder="https://scholarship.gov/apply" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} /></label>
          <label><span>Provider / funder name</span><input required minLength={2} placeholder="Government ministry or scholarship body" value={draft.ownerName} onChange={(event) => setDraft({ ...draft, ownerName: event.target.value })} /></label>
          <label><span>Opportunity type</span>
            <select value={draft.entityType} onChange={(event) => setDraft({ ...draft, entityType: event.target.value })}>
              <option value="scholarship">Scholarship</option>
              <option value="programme">Programme</option>
            </select>
          </label>
          <label><span>Country code (ISO 3166-1 alpha-2)</span><input maxLength={3} placeholder="GB, DE, JP…" value={draft.countryCode} onChange={(event) => setDraft({ ...draft, countryCode: event.target.value.toUpperCase() })} /></label>
          <label><span>Refresh schedule</span>
            <select value={draft.scheduleMinutes} onChange={(event) => setDraft({ ...draft, scheduleMinutes: Number(event.target.value) })}>
              <option value={360}>Every 6 hours (flagship)</option>
              <option value={720}>Every 12 hours (regional)</option>
              <option value={1440}>Every 24 hours (standard)</option>
              <option value={4320}>Every 3 days (stable)</option>
              <option value={10080}>Weekly (very stable)</option>
            </select>
          </label>
          <button className="product-button product-button--primary" disabled={busy === "add-source"}>
            {busy === "add-source" ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} Add and fetch
          </button>
        </form>
      )}

      <div className="ingestion-source-table">
        <div className="ingestion-source-head"><span>Source</span><span>Country</span><span>Adapter</span><span>Health</span><span>Next check</span><span /></div>
        {sources.map((item) => (
          <article key={item.source_id}>
            <div>
              <strong>{item.source_records?.owner_name || "Official source"}</strong>
              <a href={item.source_records?.canonical_url} target="_blank" rel="noreferrer">
                {new URL(item.source_records?.canonical_url || "https://invalid.local").hostname}<ExternalLink size={12} />
              </a>
            </div>
            <div><span className="ingestion-country">{item.source_records?.country_code || "XX"}</span></div>
            <div>
              <strong>{item.ingestion_adapters?.name}</strong>
              <small>{item.ingestion_adapters?.parser_version}</small>
            </div>
            <div>
              <State value={item.robots_state === "blocked" ? "blocked" : item.consecutive_failures > 0 ? "failed" : item.last_success_at ? "healthy" : "not_run"} />
              <small>{item.last_http_status ? `HTTP ${item.last_http_status}` : "Awaiting first fetch"}</small>
            </div>
            <div>
              <strong>{dateTime.format(new Date(item.next_fetch_at))}</strong>
              <small>Every {Math.round(item.schedule_minutes / 60)}h · P{item.priority}</small>
            </div>
            <div>
              <button title={item.enabled ? "Pause source" : "Enable source"} onClick={() => void act(`toggle-${item.source_id}`, { action: "set_source", sourceId: item.source_id, enabled: !item.enabled })}>
                {item.enabled ? <ShieldCheck size={15} /> : <X size={15} />}
              </button>
              <button className="run" disabled={!item.enabled || busy === item.source_id} onClick={() => void act(item.source_id, { action: "run", sourceId: item.source_id })}>
                {busy === item.source_id ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} Run
              </button>
            </div>
          </article>
        ))}
      </div>
      {!sources.length && <div className="ingestion-empty">No monitored source matches this search.</div>}
    </section>
  );
}

function Review({ candidates, total, busy, act }: {
  candidates: OpportunityCandidate[]; total: number;
  busy: string | null; act: (key: string, action: Record<string, unknown>) => Promise<unknown>;
}) {
  return (
    <section className="ingestion-panel">
      <header>
        <div>
          <h3>Change review queue</h3>
          <p>Showing {candidates.length} of {total} pending items. Discovery leads are monitored in detail before they can be approved. Approved items move to the Publish queue.</p>
        </div>
      </header>
      <div className="candidate-list">
        {candidates.map((item) => {
          const discovery = item.normalized_data.discovery_only === true;
          const actionKey = `${discovery ? "adopt" : "approve"}-${item.id}`;
          return (
            <article key={item.id}>
              <header>
                <div>
                  <span>{item.entity_type} · {item.country_code || "Global"}{discovery ? " · discovery lead" : ""}</span>
                  <h3>{item.title}</h3>
                  <p>{item.provider_name}</p>
                </div>
                <div className="candidate-header-right">
                  {!discovery && <Score value={item.structured_score} />}
                  <State value={item.review_state} />
                </div>
              </header>
              <div className="candidate-change">
                <Database size={16} />
                <span><strong>{item.change_summary?.kind || "new"} candidate</strong><small>{item.change_summary?.changed_fields?.join(", ") || "Initial capture"}</small></span>
              </div>
              {item.validation_errors.length > 0 ? (
                <div className="candidate-errors">
                  <AlertTriangle size={15} />
                  <span><strong>{item.validation_errors.length} unresolved checks</strong><small>{item.validation_errors.join(" · ")}</small></span>
                </div>
              ) : (
                <div className="candidate-valid">
                  <Check size={15} /> {discovery ? "Secure official lead ready for detailed monitoring" : "Required extraction checks passed — ready to approve"}
                </div>
              )}
              <footer>
                <a href={item.canonical_url} target="_blank" rel="noreferrer">Open official source <ExternalLink size={13} /></a>
                <div>
                  <button disabled={Boolean(busy)} onClick={() => void act(`reject-${item.id}`, { action: "review", candidateId: item.id, decision: "reject", notes: "Rejected during source review." })}>
                    <X size={15} /> Reject
                  </button>
                  <button
                    className="approve"
                    disabled={Boolean(busy) || item.validation_errors.length > 0}
                    title={item.validation_errors.length ? "Resolve extraction checks before approval" : undefined}
                    onClick={() => void act(actionKey, discovery ? { action: "adopt", candidateId: item.id } : { action: "review", candidateId: item.id, decision: "approve", notes: "Official source reviewed and approved." })}
                  >
                    {busy === actionKey ? <LoaderCircle className="spin" size={15} /> : discovery ? <FileSearch size={15} /> : <Check size={15} />}
                    {discovery ? "Monitor & enrich" : "Approve"}
                  </button>
                </div>
              </footer>
            </article>
          );
        })}
      </div>
      {!candidates.length && (
        <div className="ingestion-empty">
          <ShieldCheck size={24} /><strong>Review queue is clear</strong>
          <p>New or changed opportunity facts will appear here after a source is fetched.</p>
        </div>
      )}
    </section>
  );
}

function PublishQueue({ candidates, busy, act }: {
  candidates: OpportunityCandidate[];
  busy: string | null; act: (key: string, action: Record<string, unknown>) => Promise<unknown>;
}) {
  const [pending, setPending] = useState<OpportunityCandidate | null>(null);
  return (
    <><section className="ingestion-panel">
      <header>
        <div>
          <h3>Publish queue</h3>
          <p>
            These candidates have been approved by a reviewer and are ready to publish into the live catalogue.
            Publishing creates or updates a row in the scholarships or programmes table and makes it visible to the recommendation engine.
          </p>
        </div>
      </header>
      <div className="candidate-list">
        {candidates.map((item) => {
          const publishKey = `publish-${item.id}`;
          return (
            <article key={item.id}>
              <header>
                <div>
                  <span>{item.entity_type} · {item.country_code || "Global"}</span>
                  <h3>{item.title}</h3>
                  <p>{item.provider_name}</p>
                </div>
                <div className="candidate-header-right">
                  <Score value={item.structured_score} />
                  <State value={item.review_state} />
                </div>
              </header>

              {/* Structured field preview */}
              <div className="candidate-fields">
                {(() => {
                  const dl = item.normalized_data.deadline_text != null ? String(item.normalized_data.deadline_text) : null;
                  const ft = item.normalized_data.funding_type != null ? String(item.normalized_data.funding_type) : null;
                  const av = item.normalized_data.award_value_text != null ? String(item.normalized_data.award_value_text) : null;
                  const au = item.normalized_data.application_url != null ? String(item.normalized_data.application_url) : null;
                  return (<>
                    {dl && <span><strong>Deadline:</strong> {dl}</span>}
                    {ft && <span><strong>Funding:</strong> {ft}</span>}
                    {av && <span><strong>Award:</strong> {av}</span>}
                    {au && <span><strong>Apply at:</strong> <a href={au} target="_blank" rel="noreferrer">{au.slice(0, 60)}…</a></span>}
                  </>);
                })()}
              </div>

              {(item.structured_score ?? 0) < 40 && (
                <div className="candidate-errors">
                  <AlertTriangle size={15} />
                  <span><strong>Low structured score ({item.structured_score ?? 0}/100)</strong><small>Consider enriching the candidate data before publishing to improve recommendation quality.</small></span>
                </div>
              )}

              <footer>
                <a href={item.canonical_url} target="_blank" rel="noreferrer">Open official source <ExternalLink size={13} /></a>
                <div>
                  <button
                    className="publish"
                    disabled={Boolean(busy)}
                    onClick={() => setPending(item)}
                  >
                    {busy === publishKey ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}
                    Publish to catalogue
                  </button>
                </div>
              </footer>
            </article>
          );
        })}
      </div>
      {!candidates.length && (
        <div className="ingestion-empty">
          <Zap size={24} /><strong>No approved candidates ready to publish</strong>
          <p>Approve candidates in the Review queue first. They will appear here once a reviewer marks them approved.</p>
        </div>
      )}
    </section><ConfirmDialog open={Boolean(pending)} title="Publish this opportunity?" summary={`${pending?.title ?? "This opportunity"} will become visible to the live catalogue and recommendation engine.`} confirmLabel="Publish to catalogue" busy={Boolean(pending && busy === `publish-${pending.id}`)} consequences={["The current approved facts will be copied into the live catalogue.", "Student discovery and recommendation evaluations may begin using the record.", "The source, snapshot and reviewer history remain auditable."]} onClose={() => setPending(null)} onConfirm={async () => { if (!pending) return; await act(`publish-${pending.id}`, { action: "publish", candidateId: pending.id }); setPending(null); }} /></>
  );
}

function SourceHealth({ sources, allSources, busy, act }: {
  sources: FailingSource[]; allSources: IngestionSource[];
  busy: string | null; act: (key: string, action: Record<string, unknown>) => Promise<unknown>;
}) {
  const healthySources = allSources.filter((s) => s.consecutive_failures === 0 && s.last_success_at);
  const staleSources = allSources.filter((s) => {
    if (!s.last_success_at) return false;
    return (Date.now() - new Date(s.last_success_at).getTime()) > 7 * 24 * 3600 * 1000;
  });

  return (
    <section className="ingestion-panel">
      <header>
        <div>
          <h3>Source health dashboard</h3>
          <p>
            {allSources.length} monitored sources · {healthySources.length} healthy · {sources.length} failing · {staleSources.length} stale (no fetch in 7+ days)
          </p>
        </div>
      </header>

      {sources.length > 0 ? (
        <>
          <div className="health-section-label"><AlertTriangle size={15} /> Failing sources — consecutive failures</div>
          <div className="ingestion-source-table">
            <div className="ingestion-source-head ingestion-source-head--health">
              <span>Source</span><span>Country</span><span>Failures</span><span>Last success</span><span>Error</span><span />
            </div>
            {sources.map((item) => (
              <article key={item.source_id} className="health-failing">
                <div>
                  <strong>{item.source_records?.owner_name || "Official source"}</strong>
                  <a href={item.source_records?.canonical_url} target="_blank" rel="noreferrer">
                    {new URL(item.source_records?.canonical_url || "https://invalid.local").hostname}<ExternalLink size={12} />
                  </a>
                </div>
                <div><span className="ingestion-country">{item.source_records?.country_code || "XX"}</span></div>
                <div>
                  <strong className="health-fail-count">{item.consecutive_failures}×</strong>
                  <small>HTTP {item.last_http_status ?? "—"}</small>
                </div>
                <div>
                  <strong>{rel(item.last_success_at)}</strong>
                  <small>Next: {rel(item.next_fetch_at)}</small>
                </div>
                <div className="health-error-text"><small>{item.last_error || "No error detail"}</small></div>
                <div>
                  <button className="run" disabled={busy === item.source_id} onClick={() => void act(item.source_id, { action: "run", sourceId: item.source_id })}>
                    {busy === item.source_id ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} Retry
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="ingestion-empty ingestion-empty--success">
          <ShieldCheck size={24} /><strong>All sources are healthy</strong>
          <p>No sources have consecutive failures. The global ingestion pipeline is operating normally.</p>
        </div>
      )}

      {staleSources.length > 0 && (
        <>
          <div className="health-section-label" style={{ marginTop: "1.5rem" }}><Clock3 size={15} /> Stale sources — no successful fetch in 7+ days</div>
          <div className="ingestion-source-table">
            {staleSources.map((item) => (
              <article key={item.source_id} className="health-stale">
                <div>
                  <strong>{item.source_records?.owner_name || "Official source"}</strong>
                  <a href={item.source_records?.canonical_url} target="_blank" rel="noreferrer">
                    {new URL(item.source_records?.canonical_url || "https://invalid.local").hostname}<ExternalLink size={12} />
                  </a>
                </div>
                <div><span className="ingestion-country">{item.source_records?.country_code || "XX"}</span></div>
                <div><strong>Last fetch:</strong> <small>{rel(item.last_success_at)}</small></div>
                <div>
                  <button className="run" disabled={busy === item.source_id} onClick={() => void act(item.source_id, { action: "run", sourceId: item.source_id })}>
                    {busy === item.source_id ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />} Run now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Runs({ runs }: { runs: IngestionRun[] }) {
  return (
    <section className="ingestion-panel">
      <header>
        <div><h3>Fetch history</h3><p>HTTP, robots, change, parser and failure evidence for every execution.</p></div>
      </header>
      <div className="run-list">
        {runs.map((run) => (
          <article key={run.id}>
            <State value={run.status} />
            <div>
              <strong>{run.source_records?.owner_name || "Official source"}</strong>
              <small>{dateTime.format(new Date(run.queued_at))} · {run.trigger_type}</small>
            </div>
            <span><b>{run.http_status ? `HTTP ${run.http_status}` : "No response"}</b><small>{run.robots_state || "robots unchecked"}</small></span>
            <span><b>{run.content_changed ? "Changed" : "Unchanged"}</b><small>{run.candidate_count} candidates · {run.discovered_count} found</small></span>
            <span>
              <b>{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : "—"}</b>
              <small>{run.error_code || (run.bytes_received ? `${Math.round(run.bytes_received / 1024)} KB` : "")}</small>
            </span>
          </article>
        ))}
      </div>
      {!runs.length && <div className="ingestion-empty">No fetch has run yet.</div>}
    </section>
  );
}
