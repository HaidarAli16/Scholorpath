export const preferredRegion = "sin1";

import { NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation } from "@/lib/api/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const roles = ["student", "research_operator", "research_reviewer", "support", "admin"] as const;
const recordStates = ["draft", "in_review", "published", "stale", "conflict", "archived"] as const;
const contentEntities = ["programmes", "scholarships", "countries", "institutions"] as const;

const optionalText = z.string().trim().max(4000).nullable().optional();
const optionalDateTime = z.string().datetime().nullable().optional();
const optionalNumber = z.number().finite().nullable().optional();
const countryCode = z.string().trim().length(2).transform((value) => value.toUpperCase());

const programmeSchema = z.object({
  slug: z.string().trim().min(2).max(160), title: z.string().trim().min(2).max(300), institution_name: z.string().trim().min(2).max(300),
  country_code: countryCode, level: z.string().trim().min(2).max(80), field_family: z.string().trim().min(2).max(180),
  intake_label: optionalText, deadline_at: optionalDateTime, deadline_timezone: optionalText, tuition_amount: optionalNumber,
  tuition_currency: optionalText, application_url: z.string().url().max(2000).nullable().optional(), state: z.enum(recordStates),
  last_verified_at: optionalDateTime, next_review_at: optionalDateTime, attributes: z.record(z.string(), z.unknown()).optional(),
}).strict();

const scholarshipSchema = z.object({
  slug: z.string().trim().min(2).max(160), title: z.string().trim().min(2).max(300), provider_name: z.string().trim().min(2).max(300),
  country_code: countryCode.nullable().optional(), cycle_label: optionalText, opens_at: optionalDateTime, deadline_at: optionalDateTime,
  deadline_timezone: optionalText, award_type: optionalText, award_value: z.record(z.string(), z.unknown()).optional(),
  application_url: z.string().url().max(2000).nullable().optional(), state: z.enum(recordStates), last_verified_at: optionalDateTime,
  next_review_at: optionalDateTime, attributes: z.record(z.string(), z.unknown()).optional(),
}).strict();

const countrySchema = z.object({
  code: countryCode, slug: z.string().trim().min(2).max(120), name: z.string().trim().min(2).max(120), flag_emoji: z.string().trim().min(1).max(12),
  currency_code: z.string().trim().min(3).max(3), currency_symbol: z.string().trim().min(1).max(8), primary_language: z.string().trim().min(2).max(80),
  student_route_name: z.string().trim().min(2).max(180), visa_difficulty: z.enum(["lower", "moderate", "higher", "variable"]),
  visa_fee_amount: optionalNumber, visa_fee_currency: optionalText, proof_funds_amount: optionalNumber, proof_funds_currency: optionalText,
  proof_funds_period_months: optionalNumber, work_hours_term: optionalNumber, post_study_months: optionalNumber,
  monthly_cost_low: optionalNumber, monthly_cost_high: optionalNumber, cost_currency: optionalText,
  summary: z.string().trim().min(2).max(4000), healthcare_summary: z.string().trim().min(2).max(4000), work_summary: z.string().trim().min(2).max(4000),
  post_study_summary: z.string().trim().min(2).max(4000), climate_summary: z.string().trim().min(2).max(4000), community_summary: z.string().trim().min(2).max(4000),
  visa_uncertainty: z.string().trim().min(2).max(4000), state: z.enum(recordStates), last_verified_at: optionalDateTime, next_review_at: optionalDateTime,
}).strict();

const institutionSchema = z.object({
  slug: z.string().trim().min(2).max(160), official_name: z.string().trim().min(2).max(300), short_name: optionalText,
  institution_type: z.enum(["university", "university_of_applied_sciences", "college", "pathway_provider", "consortium"]),
  country_code: countryCode, website_url: z.string().url().max(2000), admissions_url: z.string().url().max(2000).nullable().optional(),
  logo_url: z.string().url().max(2000).nullable().optional(), public_private: z.enum(["public", "private", "mixed", "unknown"]).nullable().optional(),
  degree_awarding: z.boolean(), international_sponsor_status: optionalText, summary: z.string().trim().min(2).max(4000),
  state: z.enum(recordStates), last_verified_at: optionalDateTime, next_review_at: optionalDateTime,
}).strict();

const contentSchemas = { programmes: programmeSchema, scholarships: scholarshipSchema, countries: countrySchema, institutions: institutionSchema };
const contentConfig = {
  programmes: { key: "id", order: "updated_at", select: "id,slug,title,institution_name,country_code,level,field_family,intake_label,deadline_at,deadline_timezone,tuition_amount,tuition_currency,application_url,state,last_verified_at,next_review_at,attributes,updated_at" },
  scholarships: { key: "id", order: "updated_at", select: "id,slug,title,provider_name,country_code,cycle_label,opens_at,deadline_at,deadline_timezone,award_type,award_value,application_url,state,last_verified_at,next_review_at,attributes,updated_at" },
  countries: { key: "code", order: "updated_at", select: "code,slug,name,flag_emoji,currency_code,currency_symbol,primary_language,student_route_name,visa_difficulty,visa_fee_amount,visa_fee_currency,proof_funds_amount,proof_funds_currency,proof_funds_period_months,work_hours_term,post_study_months,monthly_cost_low,monthly_cost_high,cost_currency,summary,healthcare_summary,work_summary,post_study_summary,climate_summary,community_summary,visa_uncertainty,state,last_verified_at,next_review_at,updated_at" },
  institutions: { key: "id", order: "updated_at", select: "id,slug,official_name,short_name,institution_type,country_code,website_url,admissions_url,logo_url,public_private,degree_awarding,international_sponsor_status,summary,state,last_verified_at,next_review_at,updated_at" },
} as const;

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("replace_roles"), userId: z.string().uuid(), roles: z.array(z.enum(roles)).min(1) }),
  z.object({ action: z.literal("set_entitlement"), userId: z.string().uuid(), plan: z.enum(["free", "pro"]), status: z.enum(["inactive", "trialing", "active", "past_due", "canceled"]), currentPeriodEnd: z.string().datetime().nullable().optional() }),
  z.object({ action: z.literal("upsert_content"), entity: z.enum(contentEntities), id: z.string().min(1).max(200).optional(), values: z.record(z.string(), z.unknown()) }),
  z.object({ action: z.literal("archive_content"), entity: z.enum(contentEntities), id: z.string().min(1).max(200), reason: z.string().trim().min(4).max(1000) }),
  z.object({ action: z.literal("update_ticket"), id: z.string().uuid(), status: z.enum(["open", "triaged", "researching", "resolved", "rejected"]), resolution: z.string().trim().max(4000).nullable().optional(), assignedTo: z.string().uuid().nullable().optional() }),
  z.object({ action: z.literal("upsert_setting"), key: z.string().regex(/^[a-z][a-z0-9_.-]{1,79}$/), category: z.string().regex(/^[a-z][a-z0-9_-]{1,39}$/), value: z.unknown(), description: z.string().trim().max(1000).nullable().optional(), isPublic: z.boolean() }),
]);

async function context() {
  const session = await createSupabaseServerClient();
  if (!session) return { error: "Server authentication is unavailable.", status: 503 } as const;
  const { data } = await session.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (!userId) return { error: "Authentication required.", status: 401 } as const;
  const roleResult = await session.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (roleResult.error || !roleResult.data) return { error: "Super Admin access required.", status: 403 } as const;
  const admin = createSupabaseAdminClient();
  if (!admin) return { error: "Admin service configuration is unavailable.", status: 503 } as const;
  return { admin, userId } as const;
}

function failure(error: unknown, fallback: string, status = 500) {
  const message = error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : fallback;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const auth = await context();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const section = new URL(request.url).searchParams.get("section") ?? "overview";
  const { admin } = auth;

  if (section === "overview") {
    const tables = ["student_profiles", "programmes", "scholarships", "countries", "institutions", "correction_tickets", "audit_events"] as const;
    const counts = await Promise.all(tables.map((table) => admin.from(table).select("*", { count: "exact", head: true })));
    const recent = await admin.from("audit_events").select("id,actor_user_id,action,entity_type,entity_id,created_at").order("created_at", { ascending: false }).limit(8);
    const failed = counts.find((result) => result.error)?.error || recent.error;
    if (failed) return failure(failed, "Admin overview could not be loaded.");
    return NextResponse.json({ section, metrics: Object.fromEntries(tables.map((table, index) => [table, counts[index].count ?? 0])), recent: recent.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (section === "access") {
    const [usersResult, rolesResult, profilesResult, entitlementsResult] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
      admin.from("user_roles").select("user_id,role,granted_at").order("granted_at", { ascending: false }),
      admin.from("student_profiles").select("user_id,first_name,nationality,current_country,created_at"),
      admin.from("subscription_entitlements").select("user_id,plan_code,status,current_period_end,updated_at"),
    ]);
    const failed = usersResult.error || rolesResult.error || profilesResult.error || entitlementsResult.error;
    if (failed) return failure(failed, "Access records could not be loaded.");
    const roleMap = Map.groupBy(rolesResult.data ?? [], (row) => row.user_id);
    const profileMap = new Map((profilesResult.data ?? []).map((row) => [row.user_id, row]));
    const entitlementMap = new Map((entitlementsResult.data ?? []).map((row) => [row.user_id, row]));
    const users = usersResult.data.users.map((user) => ({ id: user.id, email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at, roles: (roleMap.get(user.id) ?? []).map((row) => row.role), profile: profileMap.get(user.id) ?? null, entitlement: entitlementMap.get(user.id) ?? null }));
    return NextResponse.json({ section, users }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if ((contentEntities as readonly string[]).includes(section)) {
    const entity = section as typeof contentEntities[number];
    const config = contentConfig[entity];
    // The table is selected from a closed, server-owned allowlist. Supabase's
    // generated overloads cannot model a runtime union of table names without
    // recursively expanding every row relationship, so keep this cast local.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynamicAdmin = admin as any;
    const result = await dynamicAdmin.from(entity).select(config.select).order(config.order, { ascending: false }).limit(250);
    if (result.error) return failure(result.error, `${entity} could not be loaded.`);
    return NextResponse.json({ section, rows: result.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (section === "support") {
    const result = await admin.from("correction_tickets").select("id,user_id,entity_type,entity_id,field_key,description,evidence_url,status,assigned_to,resolution,created_at,updated_at").order("updated_at", { ascending: false }).limit(250);
    if (result.error) return failure(result.error, "Support tickets could not be loaded.");
    return NextResponse.json({ section, tickets: result.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (section === "audit") {
    const result = await admin.from("audit_events").select("id,actor_user_id,action,entity_type,entity_id,reason,before_data,after_data,request_id,created_at").order("created_at", { ascending: false }).limit(250);
    if (result.error) return failure(result.error, "Audit history could not be loaded.");
    return NextResponse.json({ section, events: result.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  if (section === "settings") {
    const result = await admin.from("platform_settings").select("key,category,value,description,is_public,updated_by,updated_at").order("category").order("key");
    if (result.error) return failure(result.error, "Platform settings could not be loaded.");
    return NextResponse.json({ section, settings: result.data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json({ error: "Unknown admin section." }, { status: 404 });
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-control-plane", { requests: 60, windowSeconds: 60 });
  if (blocked) return blocked;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid admin action.", issues: parsed.error.flatten() }, { status: 400 });
  const auth = await context();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { admin, userId } = auth;
  const payload = parsed.data;

  if (payload.action === "replace_roles") {
    const result = await admin.rpc("admin_replace_user_roles", { p_actor_user_id: userId, p_target_user_id: payload.userId, p_roles: payload.roles });
    if (result.error) return failure(result.error, "Roles could not be updated.", result.error.code === "23514" ? 409 : 500);
    return NextResponse.json({ ok: true, result: result.data });
  }

  if (payload.action === "set_entitlement") {
    const before = await admin.from("subscription_entitlements").select("*").eq("user_id", payload.userId).maybeSingle();
    const values = { user_id: payload.userId, plan_code: payload.plan, status: payload.plan === "free" ? "inactive" : payload.status, provider: payload.plan === "pro" ? "manual" : null, provider_customer_id: null, provider_subscription_id: null, current_period_end: payload.currentPeriodEnd ?? null };
    const result = await admin.from("subscription_entitlements").upsert(values, { onConflict: "user_id" }).select("user_id,plan_code,status,current_period_end,updated_at").single();
    if (result.error) return failure(result.error, "Subscription access could not be updated.");
    await admin.from("audit_events").insert({ actor_user_id: userId, action: "admin_entitlement_updated", entity_type: "subscription_entitlement", entity_id: payload.userId, before_data: before.data, after_data: result.data });
    return NextResponse.json({ ok: true, entitlement: result.data });
  }

  if (payload.action === "upsert_content") {
    const entity = payload.entity;
    const validated = contentSchemas[entity].safeParse(payload.values);
    if (!validated.success) return NextResponse.json({ error: "Content fields are invalid.", issues: validated.error.flatten() }, { status: 400 });
    const config = contentConfig[entity];
    // See the GET handler: entity is a validated allowlisted value.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dynamicAdmin = admin as any;
    const before = payload.id ? await dynamicAdmin.from(entity).select("*").eq(config.key, payload.id).maybeSingle() : { data: null };
    const query = payload.id ? dynamicAdmin.from(entity).update(validated.data).eq(config.key, payload.id) : dynamicAdmin.from(entity).insert(validated.data);
    const result = await query.select("*").single();
    if (result.error) return failure(result.error, `${entity} could not be saved.`, result.error.code === "23505" ? 409 : 500);
    await admin.from("audit_events").insert({ actor_user_id: userId, action: payload.id ? "admin_content_updated" : "admin_content_created", entity_type: entity, entity_id: String(result.data[config.key]), before_data: before.data, after_data: result.data });
    return NextResponse.json({ ok: true, row: result.data });
  }

  if (payload.action === "archive_content") {
    const config = contentConfig[payload.entity];
    const before = await admin.from(payload.entity).select("*").eq(config.key, payload.id).maybeSingle();
    if (before.error || !before.data) return failure(before.error, "Content record was not found.", 404);
    const result = await admin.from(payload.entity).update({ state: "archived" }).eq(config.key, payload.id).select("*").single();
    if (result.error) return failure(result.error, "Content record could not be archived.");
    await admin.from("audit_events").insert({ actor_user_id: userId, action: "admin_content_archived", entity_type: payload.entity, entity_id: payload.id, reason: payload.reason, before_data: before.data, after_data: result.data });
    return NextResponse.json({ ok: true, row: result.data });
  }

  if (payload.action === "update_ticket") {
    const before = await admin.from("correction_tickets").select("*").eq("id", payload.id).maybeSingle();
    if (before.error || !before.data) return failure(before.error, "Ticket was not found.", 404);
    const result = await admin.from("correction_tickets").update({ status: payload.status, resolution: payload.resolution ?? null, assigned_to: payload.assignedTo ?? null }).eq("id", payload.id).select("*").single();
    if (result.error) return failure(result.error, "Ticket could not be updated.");
    await admin.from("audit_events").insert({ actor_user_id: userId, action: "admin_ticket_updated", entity_type: "correction_ticket", entity_id: payload.id, before_data: before.data, after_data: result.data });
    return NextResponse.json({ ok: true, ticket: result.data });
  }

  const before = await admin.from("platform_settings").select("*").eq("key", payload.key).maybeSingle();
  const result = await admin.from("platform_settings").upsert({ key: payload.key, category: payload.category, value: payload.value, description: payload.description ?? null, is_public: payload.isPublic, updated_by: userId }, { onConflict: "key" }).select("*").single();
  if (result.error) return failure(result.error, "Platform setting could not be saved.");
  await admin.from("audit_events").insert({ actor_user_id: userId, action: "admin_setting_updated", entity_type: "platform_setting", entity_id: payload.key, before_data: before.data, after_data: result.data });
  return NextResponse.json({ ok: true, setting: result.data });
}
