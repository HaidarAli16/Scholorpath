import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { guardMutation } from "@/lib/api/security";

const actionSchema = z.discriminatedUnion("resource", [
  z.object({ resource: z.literal("task"), action: z.enum(["create", "complete", "reopen"]), id: z.string().uuid().optional(), title: z.string().trim().min(2).max(180).optional(), dueAt: z.string().datetime().optional() }),
  z.object({ resource: z.literal("portfolio"), action: z.enum(["save", "remove"]), entityType: z.enum(["programme", "scholarship"]), entityId: z.string().uuid() }),
  z.object({ resource: z.literal("application"), action: z.literal("create"), title: z.string().trim().min(2).max(180), providerName: z.string().trim().min(2).max(180), deadlineAt: z.string().datetime().optional(), programmeId: z.string().uuid().optional(), scholarshipId: z.string().uuid().optional() }),
  z.object({ resource: z.literal("writing"), action: z.enum(["create", "save"]), id: z.string().uuid().optional(), title: z.string().trim().min(2).max(180), draft: z.string().max(20000).default(""), applicationId: z.string().uuid().optional() }),
  z.object({ resource: z.literal("correction"), action: z.literal("create"), entityType: z.string().trim().min(2).max(80), entityId: z.string().uuid().optional(), fieldKey: z.string().trim().max(120).optional(), description: z.string().trim().min(10).max(4000), evidenceUrl: z.string().url().optional() }),
  z.object({ resource: z.literal("funding"), action: z.enum(["create", "save"]), id: z.string().uuid().optional(), applicationId: z.string().uuid().optional(), title: z.string().trim().min(2).max(180), currency: z.string().trim().length(3), costs: z.record(z.string(), z.number()), confirmedFunding: z.record(z.string(), z.number()), conditionalFunding: z.record(z.string(), z.number()), exchangeRates: z.record(z.string(), z.number()).default({}) }),
  z.object({ resource: z.literal("offer"), action: z.literal("create"), applicationId: z.string().uuid(), offerType: z.enum(["conditional", "unconditional", "waitlist", "rejected"]), issuedAt: z.string().date().optional(), responseDueAt: z.string().datetime().optional(), conditions: z.array(z.string().max(500)).default([]) }),
  z.object({ resource: z.literal("profile"), action: z.literal("save"), firstName: z.string().trim().min(2).max(60), nationality: z.enum(["Pakistan", "India", "Bangladesh"]), currentCountry: z.string().trim().min(2).max(80), preferredCurrency: z.enum(["PKR", "INR", "BDT", "USD"]) }),
  z.object({ resource: z.literal("notification"), action: z.literal("read"), id: z.string().uuid() }),
]);

async function getAuthenticatedContext() {
  if (!isSupabaseConfigured) return { supabase: null, user: null };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase) return NextResponse.json({ error: "Workspace database is unavailable." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [profile, assessments, applications, tasks, documents, portfolios, notifications, writing, funding, offers] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("assessments").select("id,status,completion_percent,answers,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
    supabase.from("applications").select("*").eq("user_id", user.id).order("deadline_at", { ascending: true }),
    supabase.from("tasks").select("*").eq("user_id", user.id).order("due_at", { ascending: true }),
    supabase.from("documents").select("id,name,category,status,version,metadata,created_at,updated_at").eq("user_id", user.id).neq("status", "deleted").order("updated_at", { ascending: false }),
    supabase.from("portfolios").select("id,name,is_default,portfolio_items!portfolio_items_portfolio_owner_fk(id,entity_type,entity_id,notes,position)").eq("user_id", user.id),
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("writing_items").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("funding_scenarios").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("offers").select("*,applications!offers_application_owner_fk(title,provider_name)").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  const firstError = [profile, assessments, applications, tasks, documents, portfolios, notifications, writing, funding, offers].find((result) => result.error)?.error;
  if (firstError) {
    console.error("Workspace query failed", { code: firstError.code, message: firstError.message });
    return NextResponse.json({ error: "Workspace data could not be loaded." }, { status: 500 });
  }

  return NextResponse.json({
    mode: "live",
    authenticated: true,
    user: { id: user.id, email: user.email },
    data: {
      profile: profile.data,
      assessment: assessments.data?.[0] ?? null,
      applications: applications.data ?? [],
      tasks: tasks.data ?? [],
      documents: documents.data ?? [],
      portfolios: portfolios.data ?? [],
      notifications: notifications.data ?? [],
      writing: writing.data ?? [],
      funding: funding.data ?? [],
      offers: offers.data ?? [],
    },
  });
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "workspace", { requests: 60, windowSeconds: 60 });
  if (blocked) return blocked;
  const payload = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid workspace action.", issues: parsed.error.flatten() }, { status: 400 });

  const { supabase, user } = await getAuthenticatedContext();
  if (!supabase) return NextResponse.json({ error: "Workspace database is unavailable." }, { status: 503 });
  if (!user) return NextResponse.json({ error: "Sign in to save changes." }, { status: 401 });
  const action = parsed.data;

  if (action.resource === "task") {
    if (action.action === "create") {
      if (!action.title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });
      const result = await supabase.rpc("create_personal_task", { p_title: action.title, p_description: null, p_due_at: action.dueAt ?? null, p_impact_level: "medium", p_impact_type: "application_readiness", p_application_id: null, p_estimated_minutes: null });
      return databaseResponse(result);
    }
    if (!action.id) return NextResponse.json({ error: "Task id is required." }, { status: 400 });
    const state = action.action === "complete" ? "completed" : "todo";
    const result = await supabase.rpc("transition_task", { p_task_id: action.id, p_to_state: state, p_position: null, p_note: null, p_evidence_document_id: null });
    return databaseResponse(result);
  }

  if (action.resource === "portfolio") {
    const { data: portfolio, error: portfolioError } = await supabase.from("portfolios").select("id").eq("user_id", user.id).eq("is_default", true).maybeSingle();
    if (portfolioError) return databaseResponse({ data: null, error: portfolioError });
    let portfolioId = portfolio?.id as string | undefined;
    if (!portfolioId) {
      const created = await supabase.from("portfolios").insert({ user_id: user.id, name: "My portfolio", is_default: true }).select("id").single();
      if (created.error) return databaseResponse(created);
      portfolioId = created.data.id;
    }
    if (action.action === "save") {
      const result = await supabase.from("portfolio_items").upsert({ portfolio_id: portfolioId, user_id: user.id, entity_type: action.entityType, entity_id: action.entityId }, { onConflict: "portfolio_id,entity_type,entity_id" }).select().single();
      return databaseResponse(result);
    }
    const result = await supabase.from("portfolio_items").delete().eq("portfolio_id", portfolioId).eq("user_id", user.id).eq("entity_type", action.entityType).eq("entity_id", action.entityId).select();
    return databaseResponse(result);
  }

  if (action.resource === "application") {
    const result = await supabase.from("applications").insert({ user_id: user.id, title: action.title, provider_name: action.providerName, deadline_at: action.deadlineAt ?? null, programme_id: action.programmeId ?? null, scholarship_id: action.scholarshipId ?? null, state: "considering" }).select().single();
    return databaseResponse(result);
  }

  if (action.resource === "writing") {
    const values = { user_id: user.id, application_id: action.applicationId ?? null, title: action.title, draft: action.draft, state: action.draft ? "draft" : "prompt" };
    const result = action.action === "save" && action.id
      ? await supabase.from("writing_items").update(values).eq("id", action.id).eq("user_id", user.id).select().single()
      : await supabase.from("writing_items").insert(values).select().single();
    return databaseResponse(result);
  }

  if (action.resource === "correction") {
    const result = await supabase.from("correction_tickets").insert({ user_id: user.id, entity_type: action.entityType, entity_id: action.entityId ?? null, field_key: action.fieldKey ?? null, description: action.description, evidence_url: action.evidenceUrl ?? null }).select().single();
    return databaseResponse(result);
  }

  if (action.resource === "funding") {
    const values = { user_id: user.id, application_id: action.applicationId ?? null, title: action.title, currency: action.currency, costs: action.costs, confirmed_funding: action.confirmedFunding, conditional_funding: action.conditionalFunding, exchange_rates: action.exchangeRates };
    const result = action.action === "save" && action.id ? await supabase.from("funding_scenarios").update(values).eq("id", action.id).eq("user_id", user.id).select().single() : await supabase.from("funding_scenarios").insert(values).select().single();
    return databaseResponse(result);
  }

  if (action.resource === "offer") {
    const result = await supabase.from("offers").upsert({ user_id: user.id, application_id: action.applicationId, offer_type: action.offerType, issued_at: action.issuedAt ?? null, response_due_at: action.responseDueAt ?? null, conditions: action.conditions, status: "received" }, { onConflict: "application_id" }).select().single();
    return databaseResponse(result);
  }

  if (action.resource === "profile") {
    const result = await supabase.from("student_profiles").upsert({ user_id: user.id, first_name: action.firstName, nationality: action.nationality, current_country: action.currentCountry, preferred_currency: action.preferredCurrency }, { onConflict: "user_id" }).select().single();
    return databaseResponse(result);
  }
  const result = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", action.id).eq("user_id", user.id).select().single();
  return databaseResponse(result);
}

function databaseResponse(result: { data: unknown; error: { message: string } | null }) {
  if (result.error) return NextResponse.json({ error: "The requested change could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}
