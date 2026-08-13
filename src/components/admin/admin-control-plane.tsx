"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Archive, BookOpen, Check, ChevronRight, Database, FileClock, GraduationCap, KeyRound, Landmark, LoaderCircle, Pencil, Plus, RefreshCw, Save, Search, Settings, ShieldCheck, TicketCheck, Users, X } from "lucide-react";
import { IngestionCommandCenter } from "@/components/admin/ingestion-command-center";

const ingestionTabs = new Set(["sources", "review", "publish", "health", "runs"]);
const sections = new Set(["overview", "access", "programmes", "scholarships", "countries", "institutions", "support", "audit", "settings"]);
const allRoles = ["student", "research_operator", "research_reviewer", "support", "admin"];
const states = ["draft", "in_review", "published", "stale", "conflict", "archived"];
const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

type JsonRow = Record<string, unknown>;
type Field = { key: string; label: string; type?: "text" | "url" | "number" | "datetime" | "textarea" | "select" | "checkbox" | "json"; required?: boolean; options?: string[]; hint?: string };

const contentDefinitions: Record<string, { singular: string; titleKey: string; subtitleKey: string; idKey: string; defaults: JsonRow; fields: Field[] }> = {
  programmes: {
    singular: "Programme", titleKey: "title", subtitleKey: "institution_name", idKey: "id",
    defaults: { slug: "", title: "", institution_name: "", country_code: "", level: "masters", field_family: "", intake_label: null, deadline_at: null, deadline_timezone: null, tuition_amount: null, tuition_currency: null, application_url: null, state: "draft", last_verified_at: null, next_review_at: null, attributes: {} },
    fields: [
      { key: "title", label: "Programme title", required: true }, { key: "slug", label: "Slug", required: true }, { key: "institution_name", label: "Institution", required: true },
      { key: "country_code", label: "Country code", required: true }, { key: "level", label: "Study level", required: true }, { key: "field_family", label: "Subject family", required: true },
      { key: "intake_label", label: "Intake" }, { key: "deadline_at", label: "Deadline", type: "datetime" }, { key: "deadline_timezone", label: "Deadline timezone" },
      { key: "tuition_amount", label: "Tuition amount", type: "number" }, { key: "tuition_currency", label: "Tuition currency" }, { key: "application_url", label: "Official application URL", type: "url" },
      { key: "state", label: "Publishing state", type: "select", options: states }, { key: "last_verified_at", label: "Last verified", type: "datetime" }, { key: "next_review_at", label: "Next review", type: "datetime" },
      { key: "attributes", label: "Additional structured facts", type: "json", hint: "Valid JSON only." },
    ],
  },
  scholarships: {
    singular: "Scholarship", titleKey: "title", subtitleKey: "provider_name", idKey: "id",
    defaults: { slug: "", title: "", provider_name: "", country_code: null, cycle_label: null, opens_at: null, deadline_at: null, deadline_timezone: null, award_type: null, award_value: {}, application_url: null, state: "draft", last_verified_at: null, next_review_at: null, attributes: {} },
    fields: [
      { key: "title", label: "Scholarship title", required: true }, { key: "slug", label: "Slug", required: true }, { key: "provider_name", label: "Provider", required: true },
      { key: "country_code", label: "Country code" }, { key: "cycle_label", label: "Cycle" }, { key: "opens_at", label: "Opens", type: "datetime" }, { key: "deadline_at", label: "Deadline", type: "datetime" },
      { key: "deadline_timezone", label: "Deadline timezone" }, { key: "award_type", label: "Award type" }, { key: "award_value", label: "Award structure", type: "json" },
      { key: "application_url", label: "Official application URL", type: "url" }, { key: "state", label: "Publishing state", type: "select", options: states },
      { key: "last_verified_at", label: "Last verified", type: "datetime" }, { key: "next_review_at", label: "Next review", type: "datetime" }, { key: "attributes", label: "Additional structured facts", type: "json" },
    ],
  },
  countries: {
    singular: "Country", titleKey: "name", subtitleKey: "student_route_name", idKey: "code",
    defaults: { code: "", slug: "", name: "", flag_emoji: "", currency_code: "", currency_symbol: "", primary_language: "", student_route_name: "", visa_difficulty: "variable", visa_fee_amount: null, visa_fee_currency: null, proof_funds_amount: null, proof_funds_currency: null, proof_funds_period_months: null, work_hours_term: null, post_study_months: null, monthly_cost_low: null, monthly_cost_high: null, cost_currency: null, summary: "", healthcare_summary: "", work_summary: "", post_study_summary: "", climate_summary: "", community_summary: "", visa_uncertainty: "", state: "draft", last_verified_at: null, next_review_at: null },
    fields: [
      { key: "name", label: "Country name", required: true }, { key: "code", label: "ISO country code", required: true }, { key: "slug", label: "Slug", required: true }, { key: "flag_emoji", label: "Flag", required: true },
      { key: "currency_code", label: "Currency code", required: true }, { key: "currency_symbol", label: "Currency symbol", required: true }, { key: "primary_language", label: "Primary language", required: true },
      { key: "student_route_name", label: "Student visa route", required: true }, { key: "visa_difficulty", label: "Visa difficulty", type: "select", options: ["lower", "moderate", "higher", "variable"] },
      { key: "visa_fee_amount", label: "Visa fee", type: "number" }, { key: "visa_fee_currency", label: "Visa fee currency" }, { key: "proof_funds_amount", label: "Proof of funds", type: "number" },
      { key: "proof_funds_currency", label: "Proof currency" }, { key: "proof_funds_period_months", label: "Proof period (months)", type: "number" }, { key: "work_hours_term", label: "Term work hours", type: "number" },
      { key: "post_study_months", label: "Post-study months", type: "number" }, { key: "monthly_cost_low", label: "Monthly cost low", type: "number" }, { key: "monthly_cost_high", label: "Monthly cost high", type: "number" },
      { key: "cost_currency", label: "Cost currency" }, { key: "summary", label: "Student summary", type: "textarea", required: true }, { key: "healthcare_summary", label: "Healthcare", type: "textarea", required: true },
      { key: "work_summary", label: "Work rights", type: "textarea", required: true }, { key: "post_study_summary", label: "Post-study route", type: "textarea", required: true },
      { key: "climate_summary", label: "Climate", type: "textarea", required: true }, { key: "community_summary", label: "Community", type: "textarea", required: true },
      { key: "visa_uncertainty", label: "Visa uncertainty", type: "textarea", required: true }, { key: "state", label: "Publishing state", type: "select", options: states },
      { key: "last_verified_at", label: "Last verified", type: "datetime" }, { key: "next_review_at", label: "Next review", type: "datetime" },
    ],
  },
  institutions: {
    singular: "Institution", titleKey: "official_name", subtitleKey: "country_code", idKey: "id",
    defaults: { slug: "", official_name: "", short_name: null, institution_type: "university", country_code: "", website_url: "", admissions_url: null, logo_url: null, public_private: "unknown", degree_awarding: true, international_sponsor_status: null, summary: "", state: "draft", last_verified_at: null, next_review_at: null },
    fields: [
      { key: "official_name", label: "Official name", required: true }, { key: "short_name", label: "Short name" }, { key: "slug", label: "Slug", required: true },
      { key: "institution_type", label: "Institution type", type: "select", options: ["university", "university_of_applied_sciences", "college", "pathway_provider", "consortium"] },
      { key: "country_code", label: "Country code", required: true }, { key: "website_url", label: "Official website", type: "url", required: true }, { key: "admissions_url", label: "Admissions URL", type: "url" },
      { key: "logo_url", label: "Logo URL", type: "url" }, { key: "public_private", label: "Ownership", type: "select", options: ["public", "private", "mixed", "unknown"] },
      { key: "degree_awarding", label: "Degree awarding", type: "checkbox" }, { key: "international_sponsor_status", label: "International sponsor status", type: "textarea" },
      { key: "summary", label: "Student summary", type: "textarea", required: true }, { key: "state", label: "Publishing state", type: "select", options: states },
      { key: "last_verified_at", label: "Last verified", type: "datetime" }, { key: "next_review_at", label: "Next review", type: "datetime" },
    ],
  },
};

function useAdminData(section: string) {
  const [data, setData] = useState<JsonRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (ingestionTabs.has(section)) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/control-plane?section=${encodeURIComponent(section)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Admin data could not be loaded.");
      setData(payload); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Admin data could not be loaded."); }
    finally { setLoading(false); }
  }, [section]);
  useEffect(() => { void refresh(); }, [refresh]);
  const act = useCallback(async (body: JsonRow) => {
    const response = await fetch("/api/admin/control-plane", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Admin action failed.");
    await refresh(); return payload;
  }, [refresh]);
  return { data, loading, error, refresh, act };
}

export function AdminControlPlane() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab") ?? "overview";
  const section = ingestionTabs.has(requested) || sections.has(requested) ? requested : "overview";
  const navigate = (next: string) => router.push(`/admin?tab=${encodeURIComponent(next)}`);
  if (ingestionTabs.has(section)) return <IngestionCommandCenter />;
  return <ControlSection section={section} navigate={navigate} />;
}

function ControlSection({ section, navigate }: { section: string; navigate: (value: string) => void }) {
  const admin = useAdminData(section);
  return (
    <div className="admin-control-plane">
      <div className="admin-control-toolbar">
        <div><span className="product-eyebrow">Platform control plane</span><h2>{section === "overview" ? "Operate CandidRoute with confidence." : section.replaceAll("_", " ")}</h2></div>
        <button className="product-button product-button--secondary" onClick={() => void admin.refresh()} disabled={admin.loading}><RefreshCw className={admin.loading ? "spin" : ""} size={16} /> Refresh</button>
      </div>
      <nav className="admin-quick-tabs" aria-label="Admin modules">
        {[["overview", "Overview"], ["access", "Access"], ["programmes", "Programmes"], ["scholarships", "Scholarships"], ["countries", "Countries"], ["institutions", "Institutions"], ["support", "Support"], ["audit", "Audit"], ["settings", "Settings"]].map(([value, label]) => <button key={value} className={section === value ? "active" : ""} onClick={() => navigate(value)}>{label}</button>)}
      </nav>
      {admin.error && <div className="admin-control-error" role="alert"><AlertTriangle size={17} /><span>{admin.error}</span><button onClick={() => void admin.refresh()}>Try again</button></div>}
      {admin.loading && !admin.data ? <div className="admin-control-loading"><LoaderCircle className="spin" /><strong>Loading protected platform data</strong></div> : null}
      {!admin.loading && admin.data && section === "overview" ? <Overview data={admin.data} navigate={navigate} /> : null}
      {!admin.loading && admin.data && section === "access" ? <Access data={admin.data} act={admin.act} /> : null}
      {!admin.loading && admin.data && contentDefinitions[section] ? <ContentManager entity={section} data={admin.data} act={admin.act} /> : null}
      {!admin.loading && admin.data && section === "support" ? <Support data={admin.data} act={admin.act} /> : null}
      {!admin.loading && admin.data && section === "audit" ? <Audit data={admin.data} /> : null}
      {!admin.loading && admin.data && section === "settings" ? <PlatformSettings data={admin.data} act={admin.act} /> : null}
    </div>
  );
}

function Overview({ data, navigate }: { data: JsonRow; navigate: (value: string) => void }) {
  const metrics = (data.metrics ?? {}) as Record<string, number>;
  const cards = [
    ["Students", metrics.student_profiles ?? 0, "access", Users], ["Programmes", metrics.programmes ?? 0, "programmes", GraduationCap],
    ["Scholarships", metrics.scholarships ?? 0, "scholarships", BookOpen], ["Countries", metrics.countries ?? 0, "countries", Database],
    ["Institutions", metrics.institutions ?? 0, "institutions", Landmark], ["Support tickets", metrics.correction_tickets ?? 0, "support", TicketCheck],
  ] as const;
  return <><section className="admin-overview-grid">{cards.map(([label, value, target, Icon]) => <button key={label} onClick={() => navigate(target)}><span><Icon size={18} /></span><strong>{value}</strong><small>{label}</small><ChevronRight size={16} /></button>)}</section><section className="admin-panel"><header><div><h3>Recent accountable activity</h3><p>Every privileged change is written to the audit trail.</p></div><button onClick={() => navigate("audit")}>Open full audit</button></header><AuditList events={(data.recent ?? []) as JsonRow[]} compact /></section></>;
}

function Access({ data, act }: { data: JsonRow; act: (body: JsonRow) => Promise<unknown> }) {
  const users = (data.users ?? []) as JsonRow[];
  const [query, setQuery] = useState("");
  const filtered = users.filter((user) => `${user.email ?? ""} ${((user.profile as JsonRow | null)?.first_name ?? "")}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-panel"><header><div><h3>User access and subscriptions</h3><p>Assign least-privilege roles and control plan access without exposing service credentials.</p></div><label className="admin-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" /></label></header><div className="admin-access-list">{filtered.map((user) => <AccessRow key={String(user.id)} user={user} act={act} />)}</div>{!filtered.length ? <Empty title="No matching users" /> : null}</section>;
}

function AccessRow({ user, act }: { user: JsonRow; act: (body: JsonRow) => Promise<unknown> }) {
  const entitlement = (user.entitlement ?? {}) as JsonRow;
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => (user.roles as string[]) ?? ["student"]);
  const [plan, setPlan] = useState(String(entitlement.plan_code ?? "free"));
  const [status, setStatus] = useState(String(entitlement.status ?? "inactive"));
  const [busy, setBusy] = useState(""); const [saved, setSaved] = useState(""); const [error, setError] = useState("");
  const run = async (kind: "roles" | "plan") => { setBusy(kind); setError(""); try { if (kind === "roles") await act({ action: "replace_roles", userId: user.id, roles: selectedRoles }); else await act({ action: "set_entitlement", userId: user.id, plan, status }); setSaved(kind); setTimeout(() => setSaved(""), 1600); } catch (reason) { setError(reason instanceof Error ? reason.message : "Update failed."); } finally { setBusy(""); } };
  return <article><div className="admin-user-identity"><span>{String(user.email ?? "?").slice(0, 1).toUpperCase()}</span><div><strong>{String((user.profile as JsonRow | null)?.first_name ?? user.email ?? "User")}</strong><small>{String(user.email ?? "No email")}</small></div></div><div className="admin-role-checks">{allRoles.map((role) => <label key={role}><input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => setSelectedRoles((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role])} /><span>{role.replaceAll("_", " ")}</span></label>)}</div><div className="admin-plan-control"><select value={plan} onChange={(event) => { setPlan(event.target.value); if (event.target.value === "free") setStatus("inactive"); }}><option value="free">Free</option><option value="pro">Pro</option></select><select value={status} disabled={plan === "free"} onChange={(event) => setStatus(event.target.value)}><option value="inactive">Inactive</option><option value="trialing">Trialing</option><option value="active">Active</option><option value="past_due">Past due</option><option value="canceled">Canceled</option></select></div><div className="admin-row-actions"><button onClick={() => void run("roles")} disabled={Boolean(busy)}>{busy === "roles" ? <LoaderCircle className="spin" size={14} /> : saved === "roles" ? <Check size={14} /> : <KeyRound size={14} />} Save roles</button><button onClick={() => void run("plan")} disabled={Boolean(busy)}>{busy === "plan" ? <LoaderCircle className="spin" size={14} /> : saved === "plan" ? <Check size={14} /> : <ShieldCheck size={14} />} Save plan</button></div>{error ? <p className="admin-inline-error">{error}</p> : null}</article>;
}

function ContentManager({ entity, data, act }: { entity: string; data: JsonRow; act: (body: JsonRow) => Promise<unknown> }) {
  const definition = contentDefinitions[entity]; const rows = (data.rows ?? []) as JsonRow[];
  const [query, setQuery] = useState(""); const [editing, setEditing] = useState<JsonRow | null>(null);
  const filtered = rows.filter((row) => `${row[definition.titleKey] ?? ""} ${row[definition.subtitleKey] ?? ""} ${row.slug ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="admin-panel"><header><div><h3>{definition.singular} CMS</h3><p>Create drafts, maintain sourced facts, schedule reviews and control publication.</p></div><div className="admin-header-actions"><label className="admin-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${entity}`} /></label><button className="product-button product-button--primary" onClick={() => setEditing({ ...definition.defaults })}><Plus size={15} /> New {definition.singular.toLowerCase()}</button></div></header><div className="admin-content-list">{filtered.map((row) => <button key={String(row[definition.idKey])} onClick={() => setEditing(row)}><span className={`admin-state admin-state--${row.state}`}>{String(row.state).replaceAll("_", " ")}</span><div><strong>{String(row[definition.titleKey])}</strong><small>{String(row[definition.subtitleKey] ?? "")}</small></div><time>{row.updated_at ? dateFormat.format(new Date(String(row.updated_at))) : "New"}</time><Pencil size={15} /></button>)}</div>{!filtered.length ? <Empty title={`No ${entity} found`} /> : null}{editing ? <ContentEditor entity={entity} definition={definition} initial={editing} act={act} onClose={() => setEditing(null)} /> : null}</section>;
}

function inputValue(value: unknown, field: Field) {
  if (field.type === "json") return JSON.stringify(value ?? {}, null, 2);
  if (field.type === "datetime" && value) return new Date(String(value)).toISOString().slice(0, 16);
  return value == null ? "" : String(value);
}

function ContentEditor({ entity, definition, initial, act, onClose }: { entity: string; definition: typeof contentDefinitions[string]; initial: JsonRow; act: (body: JsonRow) => Promise<unknown>; onClose: () => void }) {
  const [draft, setDraft] = useState<JsonRow>(() => ({ ...initial })); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [archiveReason, setArchiveReason] = useState("");
  const id = initial[definition.idKey] ? String(initial[definition.idKey]) : undefined;
  const set = (field: Field, raw: string | boolean) => { try { let value: unknown = raw; if (field.type === "number") value = raw === "" ? null : Number(raw); if (field.type === "datetime") value = raw === "" ? null : new Date(String(raw)).toISOString(); if (field.type === "json") value = raw; setDraft((current) => ({ ...current, [field.key]: value })); } catch { setDraft((current) => ({ ...current, [field.key]: raw })); } };
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(""); try { const values: JsonRow = {}; for (const field of definition.fields) { let value = draft[field.key]; if (field.type === "json" && typeof value === "string") value = JSON.parse(value); values[field.key] = value === "" && !field.required ? null : value; } await act({ action: "upsert_content", entity, id, values }); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Record could not be saved."); } finally { setBusy(false); } };
  const archive = async () => { if (!id || archiveReason.trim().length < 4) { setError("Add a short reason before archiving."); return; } setBusy(true); try { await act({ action: "archive_content", entity, id, reason: archiveReason }); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Record could not be archived."); } finally { setBusy(false); } };
  return <div className="admin-editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-editor" role="dialog" aria-modal="true" aria-label={`${id ? "Edit" : "Create"} ${definition.singular}`}><header><div><span className="product-eyebrow">{id ? "Edit record" : "Create draft"}</span><h3>{id ? String(initial[definition.titleKey]) : `New ${definition.singular.toLowerCase()}`}</h3></div><button onClick={onClose} aria-label="Close"><X size={19} /></button></header><form onSubmit={(event) => void submit(event)}><div className="admin-editor-fields">{definition.fields.map((field) => <label key={field.key} className={field.type === "textarea" || field.type === "json" ? "wide" : ""}><span>{field.label}{field.required ? " *" : ""}</span>{field.type === "textarea" || field.type === "json" ? <textarea required={field.required} rows={field.type === "json" ? 6 : 4} value={inputValue(draft[field.key], field)} onChange={(event) => set(field, event.target.value)} /> : field.type === "select" ? <select required={field.required} value={inputValue(draft[field.key], field)} onChange={(event) => set(field, event.target.value)}>{field.options?.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select> : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => set(field, event.target.checked)} /> : <input required={field.required} type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : field.type === "url" ? "url" : "text"} value={inputValue(draft[field.key], field)} onChange={(event) => set(field, event.target.value)} />}{field.hint ? <small>{field.hint}</small> : null}</label>)}</div>{error ? <div className="admin-control-error" role="alert"><AlertTriangle size={16} />{error}</div> : null}<footer>{id ? <div className="admin-archive-control"><input value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="Reason required to archive" /><button type="button" onClick={() => void archive()} disabled={busy}><Archive size={15} /> Archive</button></div> : <span /> }<div><button type="button" onClick={onClose}>Cancel</button><button className="product-button product-button--primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} Save record</button></div></footer></form></section></div>;
}

function Support({ data, act }: { data: JsonRow; act: (body: JsonRow) => Promise<unknown> }) {
  const tickets = (data.tickets ?? []) as JsonRow[];
  return <section className="admin-panel"><header><div><h3>Corrections and support</h3><p>Investigate student-reported data problems and record a visible resolution.</p></div></header><div className="admin-ticket-list">{tickets.map((ticket) => <Ticket key={String(ticket.id)} ticket={ticket} act={act} />)}</div>{!tickets.length ? <Empty title="No support tickets need attention" /> : null}</section>;
}

function Ticket({ ticket, act }: { ticket: JsonRow; act: (body: JsonRow) => Promise<unknown> }) {
  const [status, setStatus] = useState(String(ticket.status)); const [resolution, setResolution] = useState(String(ticket.resolution ?? "")); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = async () => { setBusy(true); setError(""); try { await act({ action: "update_ticket", id: ticket.id, status, resolution: resolution || null, assignedTo: null }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Ticket could not be saved."); } finally { setBusy(false); } };
  return <article><header><div><span>{String(ticket.entity_type)} {ticket.field_key ? `· ${String(ticket.field_key)}` : ""}</span><strong>{String(ticket.description)}</strong></div><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="open">Open</option><option value="triaged">Triaged</option><option value="researching">Researching</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option></select></header>{ticket.evidence_url ? <a href={String(ticket.evidence_url)} target="_blank" rel="noreferrer">Open submitted evidence</a> : null}<textarea value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Resolution notes visible to the operating team" rows={3} /><footer><small>{dateFormat.format(new Date(String(ticket.updated_at)))}</small><button onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <Save size={14} />} Save resolution</button></footer>{error ? <p className="admin-inline-error">{error}</p> : null}</article>;
}

function Audit({ data }: { data: JsonRow }) { return <section className="admin-panel"><header><div><h3>Governance and audit trail</h3><p>Immutable evidence of privileged changes, publication and access decisions.</p></div></header><AuditList events={(data.events ?? []) as JsonRow[]} /></section>; }
function AuditList({ events, compact = false }: { events: JsonRow[]; compact?: boolean }) { return <div className="admin-audit-list">{events.map((event) => <article key={String(event.id)}><span><FileClock size={15} /></span><div><strong>{String(event.action).replaceAll("_", " ")}</strong><small>{String(event.entity_type)} {event.entity_id ? `· ${String(event.entity_id).slice(0, 20)}` : ""}</small></div><time>{dateFormat.format(new Date(String(event.created_at)))}</time>{!compact ? <details><summary>Evidence</summary><pre>{JSON.stringify({ before: event.before_data, after: event.after_data, reason: event.reason }, null, 2)}</pre></details> : null}</article>)}</div>; }

function PlatformSettings({ data, act }: { data: JsonRow; act: (body: JsonRow) => Promise<unknown> }) {
  const settings = (data.settings ?? []) as JsonRow[]; const [adding, setAdding] = useState(false);
  return <section className="admin-panel"><header><div><h3>Platform settings</h3><p>Versioned operational values—never secrets—used by the CandidRoute team.</p></div><button className="product-button product-button--primary" onClick={() => setAdding(true)}><Plus size={15} /> Add setting</button></header><div className="admin-settings-list">{settings.map((setting) => <Setting key={String(setting.key)} setting={setting} act={act} />)}{adding ? <Setting setting={{ key: "", category: "general", value: null, description: "", is_public: false }} act={act} onDone={() => setAdding(false)} /> : null}</div></section>;
}

function Setting({ setting, act, onDone }: { setting: JsonRow; act: (body: JsonRow) => Promise<unknown>; onDone?: () => void }) {
  const [draft, setDraft] = useState(() => ({ key: String(setting.key ?? ""), category: String(setting.category ?? "general"), value: JSON.stringify(setting.value, null, 2), description: String(setting.description ?? ""), isPublic: Boolean(setting.is_public) })); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = async () => { setBusy(true); setError(""); try { await act({ action: "upsert_setting", key: draft.key, category: draft.category, value: JSON.parse(draft.value), description: draft.description || null, isPublic: draft.isPublic }); onDone?.(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Setting could not be saved."); } finally { setBusy(false); } };
  return <article><div><label><span>Key</span><input value={draft.key} disabled={Boolean(setting.key)} onChange={(event) => setDraft({ ...draft, key: event.target.value })} /></label><label><span>Category</span><input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label></div><label><span>JSON value</span><textarea rows={3} value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} /></label><label><span>Description</span><input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label><footer><label><input type="checkbox" checked={draft.isPublic} onChange={(event) => setDraft({ ...draft, isPublic: event.target.checked })} /> Public setting</label><button onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={14} /> : <Settings size={14} />} Save</button></footer>{error ? <p className="admin-inline-error">{error}</p> : null}</article>;
}

function Empty({ title }: { title: string }) { return <div className="admin-empty"><Database size={24} /><strong>{title}</strong><small>Refresh the module or create the first record.</small></div>; }
