import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ProductApp } from "@/components/product/product-app";
import { canAccessAdmin, canAccessOperations, requiresStudentSession, type AppRole } from "@/lib/auth/access";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadProductBootstrap, type ProductBootstrap } from "@/lib/product/server-bootstrap";
import type { ProductAccess } from "@/lib/product/entitlements";

const routes: Record<string, string> = {
  today: "today",
  report: "report",
  discover: "discover",
  recommendations: "recommendations",
  countries: "countries",
  institutions: "institutions",
  portfolio: "portfolio",
  applications: "applications",
  workspace: "workspace",
  "workspace/documents": "documents",
  "workspace/writing": "writing",
  "workspace/funding": "funding",
  "workspace/offers": "offers",
  profile: "profile",
  notifications: "notifications",
  help: "help",
  operations: "operations",
  admin: "admin",
  settings: "settings",
  "settings/notifications": "settings-notifications",
  "settings/privacy": "settings-privacy",
  "settings/plan": "settings-plan",
};

export default async function PlatformRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const pathname = `/${slug.join("/")}`;
  const activeModule = slug[0] === "discover" && slug.length === 2 ? "opportunity" : slug[0] === "countries" && slug.length === 2 ? "countries" : routes[slug.join("/")];
  if (!activeModule) notFound();
  const needsAccount = requiresStudentSession(pathname) || activeModule === "operations" || activeModule === "admin";
  if (needsAccount && !isSupabaseConfigured) redirect("/access-denied?reason=service-unavailable");

  let viewerRoles: AppRole[] = [];
  let bootstrap: ProductBootstrap | undefined;
  let initialAccess: ProductAccess = { plan: "free", active: false };
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase!.auth.getUser();
    if (needsAccount && !user) redirect(`/auth?next=${encodeURIComponent(pathname)}`);

    if (user) {
      bootstrap = await loadProductBootstrap(supabase!, user, activeModule);
      const { data: entitlement } = await supabase!.from("subscription_entitlements").select("plan_code,status,current_period_end").eq("user_id", user.id).maybeSingle();
      const periodValid = !entitlement?.current_period_end || new Date(entitlement.current_period_end).getTime() > Date.now();
      const proActive = entitlement?.plan_code === "pro" && ["active", "trialing"].includes(entitlement.status) && periodValid;
      initialAccess = { plan: proActive ? "pro" : "free", active: proActive };
      const { data, error } = await supabase!.from("user_roles").select("role").eq("user_id", user.id);
      if (error && (activeModule === "operations" || activeModule === "admin")) redirect("/access-denied?reason=role-check");
      viewerRoles = (data ?? []).map((row) => row.role as AppRole);
      if (activeModule === "admin" && !canAccessAdmin(viewerRoles)) redirect("/access-denied?area=admin");
      if (activeModule === "operations" && !canAccessOperations(viewerRoles)) redirect("/access-denied?area=operations");
      if (activeModule === "operations" && viewerRoles.includes("admin")) redirect("/admin?tab=review");
    }
  }

  return <ProductApp module={activeModule} viewerRoles={viewerRoles} initialAccess={initialAccess} initialWorkspace={bootstrap?.workspace} initialHandoff={bootstrap?.handoff} initialOpportunities={bootstrap?.opportunities} initialRecommendations={bootstrap?.recommendations} initialDirectory={bootstrap?.directory} />;
}
