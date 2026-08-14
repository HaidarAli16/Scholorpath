// @ts-nocheck -- This Deno entrypoint is type-checked by the Supabase function bundler.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

type Json = Record<string, unknown>;
type Run = { id: string; source_id: string; adapter_id: string; status: string };
type Source = { id: string; canonical_url: string; owner_name: string; country_code: string | null; content_hash: string | null };
type Adapter = { id: string; adapter_key: string; kind: "html_detail" | "html_catalogue" | "json_feed" | "sitemap"; entity_type: "programme" | "scholarship" | "mixed"; allowed_hosts: string[]; config: Json; parser_version: string };
type Assignment = { schedule_minutes: number; etag: string | null; last_modified: string | null; consecutive_failures: number };

const encoder = new TextEncoder();
const userAgent = "CandidRouteBot/1.0 (+https://candidroute.vercel.app/privacy)";

function response(body: Json, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
}

function secretKeys() {
  const keys = [Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")];
  try {
    const modern = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}") as Record<string, string>;
    keys.push(...Object.values(modern));
  } catch { /* fail closed below */ }
  return keys.filter((value): value is string => Boolean(value));
}

function publishableKey() {
  if (Deno.env.get("SUPABASE_ANON_KEY")) return Deno.env.get("SUPABASE_ANON_KEY")!;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}") as Record<string, string>;
    return keys.default || Object.values(keys)[0] || "";
  } catch { return ""; }
}

function validWorkerRequest(req: Request) {
  const supplied = req.headers.get("apikey") || req.headers.get("x-ingestion-secret") || "";
  const expected = secretKeys();
  return supplied.length > 20 && expected.some((key) => key === supplied);
}

function isPrivateHost(host: string) {
  const value = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (value === "localhost" || value.endsWith(".local") || value === "::1" || value === "0.0.0.0") return true;
  if (/^127\./.test(value) || /^10\./.test(value) || /^169\.254\./.test(value) || /^192\.168\./.test(value)) return true;
  const match = value.match(/^172\.(\d{1,3})\./);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return /^fc|^fd|^fe80/i.test(value);
}

function validateTarget(raw: string, allowedHosts: string[]) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || isPrivateHost(url.hostname)) throw new Error("unsafe_target");
  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.map((item) => item.toLowerCase());
  if (allowed.length && !allowed.some((item) => host === item || host.endsWith(`.${item}`))) throw new Error("host_not_allowed");
  return url;
}

function validateDiscoveryTarget(raw: string) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateHost(url.hostname)) throw new Error('unsafe_discovery_target');
  return url;
}

function removeTrackingParameters(url: URL) {
  for (const key of [...url.searchParams.keys()]) {
    if (/^(?:utm_.+|_gl|fbclid|gclid|msclkid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url;
}

async function safeFetch(raw: string, allowedHosts: string[], init: RequestInit = {}) {
  let url = validateTarget(raw, allowedHosts);
  for (let redirects = 0; redirects <= 4; redirects += 1) {
    const result = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(20_000), headers: { "user-agent": userAgent, "accept": "text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.2", ...(init.headers || {}) } });
    if (![301, 302, 303, 307, 308].includes(result.status)) return result;
    const location = result.headers.get("location");
    if (!location) throw new Error("redirect_without_location");
    url = validateTarget(new URL(location, url).toString(), allowedHosts);
  }
  throw new Error("too_many_redirects");
}

function robotsAllows(text: string, pathname: string) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/#.*$/, "").trim()).filter(Boolean);
  let active = false;
  const rules: Array<{ allow: boolean; path: string }> = [];
  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") active = value === "*" || value.toLowerCase() === "candidroutebot";
    else if (active && (key === "allow" || key === "disallow") && value) rules.push({ allow: key === "allow", path: value });
  }
  const matches = rules.filter((rule) => pathname.startsWith(rule.path)).sort((a, b) => b.path.length - a.path.length);
  return matches.length ? matches[0].allow : true;
}

async function checkRobots(target: URL, allowedHosts: string[]) {
  try {
    const result = await safeFetch(`${target.origin}/robots.txt`, allowedHosts, { headers: { accept: "text/plain" } });
    if (result.status === 404 || result.status === 410) return { state: "unavailable" as const, allowed: true };
    if (result.status === 401 || result.status === 403) return { state: "blocked" as const, allowed: false };
    if (result.status >= 500) return { state: "error" as const, allowed: false };
    if (!result.ok) return { state: "unavailable" as const, allowed: true };
    const text = await result.text();
    const allowed = robotsAllows(text, target.pathname);
    return { state: allowed ? "allowed" as const : "blocked" as const, allowed };
  } catch { return { state: "error" as const, allowed: false }; }
}

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, token: string) => {
    if (token[0] === "#") {
      const hex = token[1]?.toLowerCase() === "x";
      const code = Number.parseInt(token.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    }
    return named[token.toLowerCase()] ?? " ";
  });
}

function stripHtml(html: string) {
  return decodeEntities(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<!--([\s\S]*?)-->/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function tagText(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]).slice(0, 300) : "";
}

function canonicalLink(html: string, fallback: string) {
  const match = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i) || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical/i);
  if (!match) return fallback;
  try { return new URL(match[1], fallback).toString(); } catch { return fallback; }
}

function extractDates(text: string) {
  const values = new Set<string>();
  const patterns = [
    /\b(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/g,
    /\b([0-2]?\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+([0-2]?\d|3[01]),?\s+(20\d{2})\b/gi,
  ];
  for (const pattern of patterns) for (const match of text.matchAll(pattern)) values.add(match[0]);
  return [...values].slice(0, 20);
}

function applicationState(text: string, config: Json) {
  const lower = text.toLowerCase();
  const closed = Array.isArray(config.closed_patterns) ? config.closed_patterns as string[] : ["applications are closed", "applications have closed"];
  const open = Array.isArray(config.open_patterns) ? config.open_patterns as string[] : ["applications are open", "apply now"];
  if (closed.some((pattern) => lower.includes(pattern.toLowerCase()))) return "closed";
  if (open.some((pattern) => lower.includes(pattern.toLowerCase()))) return "open";
  return "unknown";
}

function parsePublishedDate(value: string) {
  const cleaned = value.trim().replace(/(st|nd|rd|th)\b/gi, "");
  const iso = cleaned.match(/\b(20\d{2})-(0[1-9]|1[0-2])-([0-2]\d|3[01])\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}T23:59:59Z`;
  const parsed = Date.parse(`${cleaned} 23:59:59 UTC`);
  if (!Number.isFinite(parsed)) return null;
  const date = new Date(parsed);
  if (date.getUTCFullYear() < new Date().getUTCFullYear() - 1 || date.getUTCFullYear() > new Date().getUTCFullYear() + 5) return null;
  return date.toISOString();
}

function deadlineFacts(text: string) {
  const datePattern = "(?:20\\d{2}-\\d{2}-\\d{2}|(?:[0-3]?\\d\\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\\s+[0-3]?\\d,?)?\\s+20\\d{2})";
  const contextual = new RegExp(`(?:deadline|apply by|applications? (?:close|closes|end|ends)|closing date|due date)[^.!?\\n]{0,100}?(${datePattern})`, "i").exec(text);
  const rolling = /rolling (?:basis|admissions?|applications?)/i.test(text);
  if (contextual) return { deadline_text: contextual[0].trim().slice(0, 240), deadline_date: parsePublishedDate(contextual[1]), deadline_is_rolling: false };
  if (rolling) return { deadline_text: "Rolling applications", deadline_date: null, deadline_is_rolling: true };
  return { deadline_text: null, deadline_date: null, deadline_is_rolling: false };
}

function structuredFacts(text: string, entityType: "programme" | "scholarship") {
  const lower = text.toLowerCase();
  const deadline = deadlineFacts(text);
  if (entityType === "scholarship") {
    const fundingType = /fully funded|full (?:tuition|scholarship|award)/i.test(text) ? "full"
      : /partial(?:ly)? funded|partial scholarship|tuition waiver/i.test(text) ? "partial"
      : null;
    const award = text.match(/(?:award|scholarship|stipend|grant)[^.!?\n]{0,50}?((?:USD|EUR|GBP|CAD|AUD|PKR|INR|BDT|\$|€|£)\s?[\d,.]+(?:\s?(?:per year|annually|monthly))?)/i);
    return { ...deadline, funding_type: fundingType, award_value_text: award?.[1] ?? null };
  }
  const degreeLevel = /\b(phd|doctoral|doctorate)\b/i.test(text) ? "doctoral"
    : /\b(master|msc|ma|mba|llm|postgraduate)\b/i.test(text) ? "masters"
    : /\b(bachelor|undergraduate|bsc|ba|llb)\b/i.test(text) ? "bachelors"
    : null;
  const fieldFamily = /computer|software|data science|artificial intelligence|information technology/.test(lower) ? "computing"
    : /engineering/.test(lower) ? "engineering"
    : /business|management|finance|economics|law/.test(lower) ? "business"
    : /medicine|health|nursing|public health/.test(lower) ? "health"
    : /mathematics|statistics|physics|chemistry|biology|natural science/.test(lower) ? "natural_sciences"
    : null;
  return { ...deadline, degree_level: degreeLevel, field_family: fieldFamily };
}

function linksFromHtml(html: string, base: string, allowedHosts: string[], config: Json) {
  const keywords = (Array.isArray(config.link_keywords) ? config.link_keywords : ["scholarship", "master", "programme"]) as string[];
  const limit = Math.min(Number(config.max_links || 100), 200);
  const externalOnly = config.external_links_only === true;
  const baseHost = new URL(base).hostname.toLowerCase();
  const excludedHostSuffixes = (Array.isArray(config.exclude_host_suffixes) ? config.exclude_host_suffixes : []) as string[];
  const excludedLabels = (Array.isArray(config.exclude_label_patterns) ? config.exclude_label_patterns : []) as string[];
  const minimumLabelLength = Math.max(Number(config.minimum_label_length || 5), 5);
  const links = new Map<string, string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      // Fetching stays allowlisted. External discoveries are public HTTPS URLs
      // stored for human review; the worker does not automatically crawl them.
      const url = validateTarget(new URL(match[1], base).toString(), externalOnly ? [] : allowedHosts);
      const label = stripHtml(match[2]).slice(0, 300);
      const haystack = `${url.pathname} ${label}`.toLowerCase();
      const host = url.hostname.toLowerCase();
      if (externalOnly && host === baseHost) continue;
      if (excludedHostSuffixes.some((suffix) => host === suffix.toLowerCase() || host.endsWith(`.${suffix.toLowerCase()}`))) continue;
      if (excludedLabels.some((pattern) => new RegExp(pattern, "i").test(label))) continue;
      if (label.length < minimumLabelLength) continue;
      if (keywords.length && !keywords.some((word) => haystack.includes(word.toLowerCase()))) continue;
      url.hash = "";
      links.set(url.toString(), label);
    } catch { /* discard unsafe or malformed links */ }
    if (links.size >= limit) break;
  }
  return [...links].map(([url, label]) => ({ url, label }));
}

function catalogueCardsFromHtml(html: string, base: string, config: Json) {
  const excludedHostSuffixes = (Array.isArray(config.exclude_host_suffixes) ? config.exclude_host_suffixes : []) as string[];
  const limit = Math.min(Number(config.max_links || 100), 200);
  const results = new Map<string, string>();
  for (const match of html.matchAll(/<article\b[^>]*class=["'][^"']*\becl-card\b[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const card = match[1];
    const titleBlock = card.match(/<div\b[^>]*class=["'][^"']*content-block__title[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const label = stripHtml(titleBlock?.[1] || "").slice(0, 300);
    if (label.length < Number(config.minimum_label_length || 5)) continue;
    const urls: URL[] = [];
    for (const anchor of card.matchAll(/<a\b[^>]*href=["'](?!#)([^"']+)["'][^>]*>/gi)) {
      try { urls.push(validateDiscoveryTarget(new URL(anchor[1], base).toString())); } catch { /* ignore unsafe URLs */ }
    }
    const isExcluded = (url: URL) => excludedHostSuffixes.some((suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`));
    const secureExternal = urls.find((url) => url.protocol === 'https:' && !isExcluded(url));
    const officialFallback = urls.find((url) => url.protocol === 'https:' && /project/i.test(`${url.pathname}${url.hash}`));
    const insecureExternal = urls.find((url) => url.protocol === 'http:' && !isExcluded(url));
    const selected = secureExternal || officialFallback || insecureExternal;
    if (selected) {
      selected.hash = selected.hash.startsWith("#project/") ? selected.hash : "";
      results.set(selected.toString(), label);
    }
    if (results.size >= limit) break;
  }
  return [...results].map(([url, label]) => ({ url, label }));
}

function linksFromJsonFeed(content: string, config: Json) {
  const parsed = JSON.parse(content);
  const limit = Math.min(Number(config.max_links || 100), 200);
  const links = new Map<string, string>();
  const items = config.feed_format === "wordpress_search"
    ? parsed
    : config.feed_format === "scholarpath_api" && parsed && typeof parsed === "object"
      ? (parsed as Json).items
      : [];
  if (!Array.isArray(items)) return [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    if (config.feed_format === "scholarpath_api" && String((item as Json).type || "").toLowerCase() !== "scholarship") continue;
    const url = String(config.feed_format === "scholarpath_api" ? (item as Json).applicationUrl || "" : (item as Json).url || "");
    const rawTitle = config.feed_format === "wordpress_search" ? (item as Json).title : (item as Json).title || "";
    const title = stripHtml(String(rawTitle || "")).slice(0, 300);
    try {
      const safe = validateDiscoveryTarget(url);
      if (safe.protocol !== "https:" || title.length < 5) continue;
      safe.hash = "";
      links.set(safe.toString(), title);
    } catch { /* discard unsafe or malformed links */ }
    if (links.size >= limit) break;
  }
  return [...links].map(([url, label]) => ({ url, label }));
}

function officialLinksFromHtml(html: string, base: string, config: Json) {
  const baseHost = new URL(base).hostname.toLowerCase();
  const excluded = (Array.isArray(config.exclude_host_suffixes) ? config.exclude_host_suffixes : []) as string[];
  const limit = Math.min(Number(config.max_official_links || 3), 10);
  const candidates = new Map<string, { url: string; label: string; score: number }>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = stripHtml(match[2]).slice(0, 300);
    try {
      const url = validateDiscoveryTarget(new URL(decodeEntities(match[1]), base).toString());
      const host = url.hostname.toLowerCase();
      if (url.protocol !== "https:" || host === baseHost || host.endsWith(`.${baseHost}`)) continue;
      if (excluded.some((suffix) => host === suffix.toLowerCase() || host.endsWith(`.${suffix.toLowerCase()}`))) continue;
      if (/\.(?:jpe?g|png|gif|webp|svg|ico|mp4|mp3|zip|docx?|xlsx?|pdf)(?:$|\?)/i.test(url.pathname)) continue;
      const haystack = `${label} ${url.pathname}`.toLowerCase();
      let score = 0;
      if (/official|apply now|application (?:page|portal|website)|visit website|scholarship website/.test(haystack)) score += 6;
      if (/(?:\.gov(?:\.|$)|\.edu(?:\.|$)|\.ac\.|daad\.|britishcouncil\.|erasmus|europa\.eu)/.test(host)) score += 4;
      if (/scholar|funding|grant|award|admission|apply/.test(haystack)) score += 2;
      if (score < 4) continue;
      url.hash = "";
      const key = url.toString();
      const previous = candidates.get(key);
      if (!previous || score > previous.score) candidates.set(key, { url: key, label: label || host, score });
    } catch { /* discard unsafe or malformed links */ }
  }
  return [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, limit).map(({ url, label }) => ({ url, label }));
}

async function registerDiscoveredSource(
  client: ReturnType<typeof createClient>,
  item: { url: string; label: string },
  adapterKey: string,
  sourceType: string,
  discoveredVia: string,
) {
  const target = removeTrackingParameters(validateDiscoveryTarget(item.url));
  if (target.protocol !== "https:") return false;
  const { data: adapter, error: adapterError } = await client.from("ingestion_adapters").select("id").eq("adapter_key", adapterKey).eq("enabled", true).single();
  if (adapterError || !adapter) throw new Error(`discovery_adapter_missing:${adapterKey}`);
  const owner = adapterKey === "secondary_scholarship_detail" ? new URL(discoveredVia).hostname : target.hostname;
  let { data: record } = await client.from("source_records").select("id").eq("canonical_url", target.toString()).maybeSingle();
  if (!record) {
    const { data: inserted, error: sourceError } = await client.from("source_records")
    .insert({
      canonical_url: target.toString(),
      source_type: sourceType,
      owner_name: owner,
      status: "unverified",
      next_review_at: new Date().toISOString(),
      verification_notes: "Discovered through a secondary index; only the official page may support publication.",
    })
    .select("id")
    .single();
    if (sourceError || !inserted) {
      const { data: raced } = await client.from("source_records").select("id").eq("canonical_url", target.toString()).maybeSingle();
      if (!raced) throw new Error(`discovered_source_write_failed:${sourceError?.message || "unknown"}`);
      record = raced;
    } else record = inserted;
  }
  const { data: existingSchedule } = await client.from("ingestion_sources").select("source_id").eq("source_id", record.id).maybeSingle();
  if (existingSchedule) {
    const { error: scheduleError } = await client.from("ingestion_sources").update({
      enabled: true,
      next_fetch_at: new Date().toISOString(),
      last_error: null,
      discovery_metadata: { discovered_via: discoveredVia, provenance_mode: "discovery_only" },
    }).eq("source_id", record.id);
    if (scheduleError) throw new Error(`discovered_source_schedule_failed:${scheduleError.message}`);
  } else {
    const { error: scheduleError } = await client.from("ingestion_sources").insert({
      source_id: record.id,
      adapter_id: adapter.id,
      enabled: true,
      priority: adapterKey === "discovered_official_scholarship" ? 2 : 3,
      schedule_minutes: 1440,
      next_fetch_at: new Date().toISOString(),
      discovery_metadata: { discovered_via: discoveredVia, provenance_mode: "discovery_only" },
    });
    if (scheduleError && scheduleError.code !== "23505") throw new Error(`discovered_source_schedule_failed:${scheduleError.message}`);
  }
  return true;
}

async function sha256(value: string) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function externalKey(url: string) {
  const parsed = new URL(url);
  return `${parsed.hostname}${parsed.pathname}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180);
}

function inferType(label: string, url: string, fallback: Adapter["entity_type"]) {
  if (fallback !== "mixed") return fallback;
  return /scholar|funding|award|stipend/i.test(`${label} ${url}`) ? "scholarship" : "programme";
}

function validationErrors(data: Json) {
  const errors: string[] = [];
  if (!String(data.title || "").trim()) errors.push("title_missing");
  if (!String(data.provider_name || "").trim()) errors.push("provider_missing");
  const officialUrl = String(data.canonical_url || "");
  if (!officialUrl.startsWith("http://") && !officialUrl.startsWith("https://")) errors.push("official_url_missing");
  if (officialUrl.startsWith("http://")) errors.push("source_url_insecure");
  if (data.discovery_only !== true && data.application_state === "unknown") errors.push("application_state_unresolved");
  if (data.discovery_only !== true && !data.deadline_date && data.deadline_is_rolling !== true) errors.push("deadline_unresolved");
  if (data.discovery_only !== true && data.entity_type === "scholarship" && !data.funding_type) errors.push("funding_unresolved");
  if (data.discovery_only !== true && data.entity_type === "programme" && !data.degree_level) errors.push("degree_level_unresolved");
  if (data.discovery_only !== true && data.entity_type === "programme" && !data.field_family) errors.push("field_family_unresolved");
  return errors;
}

function changeSummary(previous: Json | null, current: Json) {
  if (!previous) return { kind: "new", changed_fields: Object.keys(current) };
  const changed = [...new Set([...Object.keys(previous), ...Object.keys(current)])].filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(current[key]));
  return { kind: changed.length ? "updated" : "unchanged", changed_fields: changed };
}

async function runWorker(client: ReturnType<typeof createClient>, run: Run) {
  const started = Date.now();
  const { data: source } = await client.from("source_records").select("id,canonical_url,owner_name,country_code,content_hash").eq("id", run.source_id).single<Source>();
  const { data: adapter } = await client.from("ingestion_adapters").select("id,adapter_key,kind,entity_type,allowed_hosts,config,parser_version").eq("id", run.adapter_id).single<Adapter>();
  const { data: assignment } = await client.from("ingestion_sources").select("schedule_minutes,etag,last_modified,consecutive_failures").eq("source_id", run.source_id).single<Assignment>();
  if (!source || !adapter || !assignment) throw new Error("ingestion_configuration_missing");
  const fetchHosts = adapter.adapter_key === "discovered_official_scholarship" ? [new URL(source.canonical_url).hostname] : adapter.allowed_hosts;
  const target = validateTarget(source.canonical_url, fetchHosts);
  const robots = await checkRobots(target, fetchHosts);
  if (!robots.allowed) {
    await client.from("ingestion_runs").update({ status: "blocked", robots_state: robots.state, finished_at: new Date().toISOString(), duration_ms: Date.now() - started, error_code: "robots_blocked", error_message: "Fetching is not permitted by the source robots policy." }).eq("id", run.id);
    await client.from("ingestion_sources").update({ robots_state: robots.state, robots_checked_at: new Date().toISOString(), next_fetch_at: new Date(Date.now() + 86_400_000).toISOString(), last_error: "robots_blocked" }).eq("source_id", source.id);
    return { runId: run.id, status: "blocked", candidates: 0 };
  }
  const headers: Record<string, string> = {};
  if (assignment.etag) headers["if-none-match"] = assignment.etag;
  if (assignment.last_modified) headers["if-modified-since"] = assignment.last_modified;
  const fetched = await safeFetch(target.toString(), fetchHosts, { headers });
  if (fetched.status === 304) {
    await client.from("ingestion_runs").update({ status: "no_change", http_status: 304, robots_state: robots.state, final_url: fetched.url || target.toString(), previous_content_hash: source.content_hash, content_hash: source.content_hash, content_changed: false, finished_at: new Date().toISOString(), duration_ms: Date.now() - started }).eq("id", run.id);
    await client.from("ingestion_sources").update({ last_success_at: new Date().toISOString(), consecutive_failures: 0, robots_state: robots.state, robots_checked_at: new Date().toISOString(), next_fetch_at: new Date(Date.now() + assignment.schedule_minutes * 60_000).toISOString(), last_http_status: 304, last_error: null }).eq("source_id", source.id);
    return { runId: run.id, status: "no_change", candidates: 0 };
  }
  if (!fetched.ok) throw new Error(`http_${fetched.status}`);
  const contentType = (fetched.headers.get("content-type") || "").toLowerCase();
  if (!/text\/html|application\/xhtml\+xml|application\/json|application\/xml|text\/xml/.test(contentType)) throw new Error("unsupported_content_type");
  const maxBytes = Math.min(Number(adapter.config.max_bytes || 3_000_000), 5_000_000);
  const declaredBytes = Number(fetched.headers.get("content-length") || 0);
  if (declaredBytes > maxBytes) throw new Error("response_too_large");
  const content = await fetched.text();
  const bytes = encoder.encode(content).byteLength;
  if (bytes > maxBytes) throw new Error("response_too_large");
  const normalizedText = contentType.includes("json") ? JSON.stringify(JSON.parse(content)) : stripHtml(content);
  const hash = await sha256(normalizedText);
  if (hash === source.content_hash) {
    await client.from("ingestion_runs").update({ status: "no_change", http_status: fetched.status, robots_state: robots.state, final_url: fetched.url || target.toString(), previous_content_hash: source.content_hash, content_hash: hash, content_changed: false, bytes_received: bytes, finished_at: new Date().toISOString(), duration_ms: Date.now() - started }).eq("id", run.id);
    await client.from("ingestion_sources").update({ last_success_at: new Date().toISOString(), consecutive_failures: 0, etag: fetched.headers.get("etag"), last_modified: fetched.headers.get("last-modified"), robots_state: robots.state, robots_checked_at: new Date().toISOString(), next_fetch_at: new Date(Date.now() + assignment.schedule_minutes * 60_000).toISOString(), last_http_status: fetched.status, last_error: null }).eq("source_id", source.id);
    return { runId: run.id, status: "no_change", candidates: 0 };
  }
  const title = contentType.includes("html") ? (tagText(content, "h1") || tagText(content, "title")) : source.owner_name;
  const pageUrl = canonicalLink(content, fetched.url || target.toString());
  const dates = extractDates(normalizedText);
  const state = applicationState(normalizedText, adapter.config);
  const discovered = adapter.adapter_key === "secondary_scholarship_detail"
    ? officialLinksFromHtml(content, pageUrl, adapter.config)
    : adapter.kind === "json_feed"
      ? linksFromJsonFeed(content, adapter.config)
      : adapter.kind === "html_catalogue"
    ? (adapter.config.extract_card_candidates === true
      ? catalogueCardsFromHtml(content, pageUrl, adapter.config)
      : linksFromHtml(content, pageUrl, adapter.allowed_hosts, adapter.config))
    : [{ url: pageUrl, label: title }];
  const { data: snapshot, error: snapshotError } = await client.from("source_snapshots").upsert({ source_id: source.id, content_hash: hash, extracted_text: normalizedText.slice(0, 250_000), metadata: { parser_version: adapter.parser_version, content_type: contentType, title, final_url: pageUrl, bytes_received: bytes, fetched_at: new Date().toISOString() } }, { onConflict: "source_id,content_hash" }).select("id").single();
  if (snapshotError || !snapshot) throw new Error(`snapshot_failed:${snapshotError?.message || "unknown"}`);
  let candidateCount = 0;
  for (const item of discovered) {
    if (adapter.adapter_key === "secondary_scholarpath_feed") {
      await registerDiscoveredSource(client, item, "discovered_official_scholarship", "official_scholarship_page", pageUrl);
      continue;
    }
    if (adapter.adapter_key === "secondary_scholarship_catalogue" || adapter.adapter_key === "secondary_scholarship_feed") {
      await registerDiscoveredSource(client, item, "secondary_scholarship_detail", "secondary_discovery", pageUrl);
      continue;
    }
    if (adapter.adapter_key === "secondary_scholarship_detail") {
      await registerDiscoveredSource(client, item, "discovered_official_scholarship", "official_scholarship_page", pageUrl);
      continue;
    }
    const entityType = inferType(item.label, item.url, adapter.entity_type);
    const isDiscovery = adapter.kind === "html_catalogue" || adapter.kind === "sitemap";
    const facts = isDiscovery ? {} : structuredFacts(normalizedText, entityType);
    const normalized: Json = { title: item.label || title, provider_name: source.owner_name, country_code: source.country_code, canonical_url: item.url, application_url: item.url, entity_type: entityType, application_state: isDiscovery ? "unknown" : state, date_mentions: isDiscovery ? [] : dates, source_page_title: title, parser_version: adapter.parser_version, discovery_only: isDiscovery, ...facts };
    const candidateHash = await sha256(JSON.stringify(normalized));
    const key = externalKey(item.url);
    const { data: prior } = await client.from("opportunity_candidates").select("normalized_data").eq("source_id", source.id).eq("external_key", key).neq("content_hash", candidateHash).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const { data: inserted, error } = await client.from("opportunity_candidates")
      .upsert({ run_id: run.id, source_id: source.id, snapshot_id: snapshot.id, entity_type: entityType, external_key: key, canonical_url: item.url, title: String(normalized.title), provider_name: source.owner_name, country_code: source.country_code, normalized_data: normalized, content_hash: candidateHash, validation_errors: validationErrors(normalized), change_summary: changeSummary((prior?.normalized_data as Json | null) || null, normalized), review_state: "pending" }, { onConflict: "canonical_url,content_hash", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(`candidate_write_failed:${error.message}`);
    if (inserted?.length) candidateCount += 1;
  }
  await client.from("source_records").update({ content_hash: hash, next_review_at: new Date(Date.now() + assignment.schedule_minutes * 60_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", source.id);
  await client.from("ingestion_runs").update({ status: candidateCount ? "needs_review" : "succeeded", http_status: fetched.status, robots_state: robots.state, final_url: pageUrl, previous_content_hash: source.content_hash, content_hash: hash, content_changed: true, bytes_received: bytes, discovered_count: discovered.length, candidate_count: candidateCount, finished_at: new Date().toISOString(), duration_ms: Date.now() - started, metrics: { content_type: contentType, parser_version: adapter.parser_version } }).eq("id", run.id);
  await client.from("ingestion_sources").update({ last_success_at: new Date().toISOString(), consecutive_failures: 0, etag: fetched.headers.get("etag"), last_modified: fetched.headers.get("last-modified"), robots_state: robots.state, robots_checked_at: new Date().toISOString(), next_fetch_at: new Date(Date.now() + assignment.schedule_minutes * 60_000).toISOString(), last_http_status: fetched.status, last_error: null }).eq("source_id", source.id);
  return { runId: run.id, status: candidateCount ? "needs_review" : "succeeded", candidates: candidateCount };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return response({ error: "method_not_allowed" }, 405);
  if (!validWorkerRequest(req)) return response({ error: "unauthorized" }, 401);
  const url = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretKeys()[0] || "";
  if (!url || !serviceKey || !publishableKey()) return response({ error: "worker_not_configured" }, 503);
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = await req.json().catch(() => ({})) as { runId?: string; enqueueDue?: boolean; limit?: number; configureScheduler?: boolean };
  if (body.configureScheduler) {
    const schedulerKey = secretKeys()[0];
    if (!schedulerKey) return response({ error: "scheduler_key_unavailable" }, 503);
    const { error } = await client.rpc("configure_ingestion_scheduler", { p_worker_key: schedulerKey });
    if (error) return response({ error: `scheduler_configuration_failed:${error.message}` }, 500);
    return response({ ok: true, status: "scheduler_configured" });
  }
  if (body.enqueueDue) await client.rpc("enqueue_due_ingestion_sources", { p_limit: Math.min(Math.max(body.limit || 25, 1), 100) });
  let run: Run | null = null;
  if (body.runId) {
    const { data } = await client.from("ingestion_runs").update({ status: "running", worker_id: `edge-${crypto.randomUUID()}`, started_at: new Date().toISOString() }).eq("id", body.runId).eq("status", "queued").select("id,source_id,adapter_id,status").maybeSingle();
    run = data as Run | null;
  } else {
    const { data } = await client.rpc("claim_ingestion_run", { p_worker_id: `edge-${crypto.randomUUID()}` });
    run = data as Run | null;
  }
  if (!run) return response({ ok: true, status: "idle" });
  try {
    return response({ ok: true, ...(await runWorker(client, run)) });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "unknown_error";
    const { data: assignment } = await client.from("ingestion_sources").select("consecutive_failures,schedule_minutes").eq("source_id", run.source_id).single();
    const failures = Math.min(Number(assignment?.consecutive_failures || 0) + 1, 10);
    const backoffMinutes = Math.min(Number(assignment?.schedule_minutes || 1440) * (2 ** Math.min(failures, 5)), 10080);
    await client.from("ingestion_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_code: message.split(":")[0], error_message: message }).eq("id", run.id);
    await client.from("ingestion_sources").update({ consecutive_failures: failures, next_fetch_at: new Date(Date.now() + backoffMinutes * 60_000).toISOString(), last_error: message }).eq("source_id", run.source_id);
    return response({ ok: false, runId: run.id, error: message }, 502);
  }
});
