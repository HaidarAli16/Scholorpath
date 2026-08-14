// @ts-nocheck -- Deno entrypoint is verified by the Supabase function bundler.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.111.0";

type Institution = {
  id: string;
  official_name: string;
  country_code: string;
  website_url: string;
  official_domain: string | null;
};

type RorOrganization = {
  id: string;
  status: string;
  types: string[];
  domains: string[];
  established: number | null;
  names: Array<{ value: string; lang: string | null; types: string[] }>;
  links: Array<{ type: string; value: string }>;
  locations: Array<{ geonames_id: number | null; geonames_details?: Record<string, unknown> }>;
  external_ids: Array<{ type: string; preferred: string | null; all: string[] }>;
};

type RorMatch = {
  substring: string;
  score: number;
  matching_type: string;
  chosen: boolean;
  organization: RorOrganization;
};

const userAgent = "CandidRoute/1.0 (+https://candidroute.vercel.app/privacy)";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function secretKeys() {
  const keys = [Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")];
  try {
    const modern = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}") as Record<string, string>;
    keys.push(...Object.values(modern));
  } catch { /* fail closed */ }
  return keys.filter((value): value is string => Boolean(value));
}

function authorized(req: Request) {
  const supplied = req.headers.get("apikey") || req.headers.get("x-enrichment-secret") || "";
  return supplied.length > 20 && secretKeys().some((key) => key === supplied);
}

function domain(raw: string) {
  try { return new URL(raw).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

function normalizedName(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

function displayName(org: RorOrganization) {
  return org.names.find((name) => name.types.includes("ror_display"))?.value
    || org.names.find((name) => name.lang === "en" && name.types.includes("label"))?.value
    || org.names[0]?.value
    || "";
}

function countryCode(org: RorOrganization) {
  return String(org.locations[0]?.geonames_details?.country_code || "").toUpperCase();
}

function externalIds(org: RorOrganization) {
  return Object.fromEntries(org.external_ids.map((item) => [item.type, {
    preferred: item.preferred,
    all: item.all,
  }]));
}

function chooseMatch(institution: Institution, items: RorMatch[]) {
  const expectedDomain = institution.official_domain || domain(institution.website_url);
  const expectedName = normalizedName(institution.official_name);
  const eligible = items.filter((item) => {
    const org = item.organization;
    return org?.status === "active"
      && org.types?.includes("education")
      && countryCode(org) === institution.country_code.toUpperCase();
  });
  const ranked = eligible.map((item) => {
    const orgDomains = item.organization.domains.map((value) => value.toLowerCase().replace(/^www\./, ""));
    const domainExact = Boolean(expectedDomain && orgDomains.includes(expectedDomain));
    const nameExact = normalizedName(displayName(item.organization)) === expectedName;
    return { ...item, domainExact, nameExact };
  }).sort((a, b) => Number(b.domainExact) - Number(a.domainExact) || Number(b.nameExact) - Number(a.nameExact) || b.score - a.score);
  const best = ranked[0];
  if (!best) return { state: "not_found" as const, match: null };
  const safe = best.domainExact || (best.nameExact && best.score >= 0.92) || (best.chosen && best.score >= 0.97);
  return safe ? { state: "matched" as const, match: best } : { state: "ambiguous" as const, match: best };
}

async function rorMatches(institution: Institution) {
  const url = new URL("https://api.ror.org/v2/organizations");
  url.searchParams.set("affiliation", institution.official_name);
  const headers: Record<string, string> = { accept: "application/json", "user-agent": userAgent };
  const clientId = Deno.env.get("ROR_CLIENT_ID");
  if (clientId) headers["Client-Id"] = clientId;
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`ror_http_${response.status}`);
  const bytes = Number(response.headers.get("content-length") || 0);
  if (bytes > 1_000_000) throw new Error("ror_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > 1_000_000) throw new Error("ror_response_too_large");
  const payload = JSON.parse(text) as { items?: RorMatch[] };
  return Array.isArray(payload.items) ? payload.items : [];
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!authorized(req)) return json({ error: "unauthorized" }, 401);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || secretKeys()[0] || "";
  if (!supabaseUrl || !serviceKey) return json({ error: "worker_not_configured" }, 503);
  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const body = await req.json().catch(() => ({})) as { limit?: number; configureScheduler?: boolean };

  if (body.configureScheduler) {
    const workerKey = secretKeys()[0];
    if (!workerKey) return json({ error: "scheduler_key_unavailable" }, 503);
    const { error } = await client.rpc("configure_institution_enrichment_scheduler", { p_worker_key: workerKey });
    if (error) return json({ error: `scheduler_configuration_failed:${error.message}` }, 500);
    return json({ ok: true, status: "scheduler_configured" });
  }

  const limit = Math.min(Math.max(Number(body.limit || 20), 1), 40);
  const now = new Date().toISOString();
  const { data, error } = await client.from("institutions")
    .select("id,official_name,country_code,website_url,official_domain")
    .or(`next_enrichment_at.is.null,next_enrichment_at.lte.${now}`)
    .order("next_enrichment_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) return json({ error: `institution_load_failed:${error.message}` }, 500);

  const results = { matched: 0, ambiguous: 0, not_found: 0, failed: 0, duplicate_blocked: 0 };
  for (const institution of (data || []) as Institution[]) {
    try {
      const expectedDomain = institution.official_domain || domain(institution.website_url);
      const decision = chooseMatch(institution, await rorMatches(institution));
      if (!decision.match) {
        await client.from("institutions").update({
          official_domain: expectedDomain || null,
          enrichment_state: decision.state,
          enriched_at: now,
          next_enrichment_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        }).eq("id", institution.id);
        await client.from("institution_enrichment_runs").insert({ institution_id: institution.id, status: decision.state });
        results[decision.state] += 1;
        continue;
      }

      const match = decision.match;
      const org = match.organization;
      const rorId = org.id.replace("https://ror.org/", "");
      const rorDomain = org.domains[0]?.toLowerCase().replace(/^www\./, "") || expectedDomain;
      const { data: duplicate } = await client.from("institutions")
        .select("id")
        .neq("id", institution.id)
        .or(`ror_id.eq.${rorId},official_domain.eq.${rorDomain}`)
        .limit(1)
        .maybeSingle();

      if (duplicate) {
        await client.from("institutions").update({ enrichment_state: "ambiguous", enriched_at: now, next_enrichment_at: new Date(Date.now() + 7 * 86_400_000).toISOString() }).eq("id", institution.id);
        await client.from("institution_enrichment_runs").insert({ institution_id: institution.id, status: "duplicate_blocked", matched_external_id: rorId, match_score: match.score, details: { duplicate_institution_id: duplicate.id } });
        results.duplicate_blocked += 1;
        continue;
      }

      if (decision.state === "ambiguous") {
        await client.from("institutions").update({ enrichment_state: "ambiguous", enriched_at: now, next_enrichment_at: new Date(Date.now() + 7 * 86_400_000).toISOString(), ror_match_score: match.score }).eq("id", institution.id);
        await client.from("institution_enrichment_runs").insert({ institution_id: institution.id, status: "ambiguous", matched_external_id: rorId, match_score: match.score, details: { candidate_name: displayName(org), candidate_country: countryCode(org) } });
        results.ambiguous += 1;
        continue;
      }

      await client.from("institutions").update({
        official_domain: rorDomain || null,
        ror_id: rorId,
        ror_match_score: match.score,
        external_ids: externalIds(org),
        enrichment_metadata: {
          provider: "ror",
          provider_url: org.id,
          display_name: displayName(org),
          established: org.established,
          types: org.types,
          locations: org.locations,
          official_links: org.links.filter((link) => link.type === "website"),
          matched_at: now,
        },
        enrichment_state: "matched",
        enriched_at: now,
        next_enrichment_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      }).eq("id", institution.id);
      await client.from("institution_enrichment_runs").insert({ institution_id: institution.id, status: "matched", matched_external_id: rorId, match_score: match.score, details: { provider_url: org.id } });
      results.matched += 1;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message.slice(0, 300) : "unknown_error";
      await client.from("institutions").update({ enrichment_state: "failed", enriched_at: now, next_enrichment_at: new Date(Date.now() + 86_400_000).toISOString() }).eq("id", institution.id);
      await client.from("institution_enrichment_runs").insert({ institution_id: institution.id, status: "failed", details: { error: message } });
      results.failed += 1;
    }
  }
  return json({ ok: true, processed: (data || []).length, results });
});
