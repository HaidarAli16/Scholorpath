import { notFound } from "next/navigation";
import { ProductApp } from "@/components/product/product-app";

const routes: Record<string, string> = {
  today: "today",
  report: "report",
  discover: "discover",
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
  const activeModule = slug[0] === "discover" && slug.length === 2 ? "opportunity" : routes[slug.join("/")];
  if (!activeModule) notFound();
  return <ProductApp module={activeModule} />;
}
