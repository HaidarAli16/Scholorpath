import { notFound } from "next/navigation";
import { ProductApp } from "@/components/product/product-app";

const routes: Record<string, string> = {
  today: "today",
  discover: "discover",
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
};

export default async function PlatformRoute({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const module = routes[slug.join("/")];
  if (!module) notFound();
  return <ProductApp module={module} />;
}

