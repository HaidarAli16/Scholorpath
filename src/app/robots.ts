import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://candidroute.vercel.app";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/operations", "/workspace", "/applications", "/profile", "/settings", "/auth"] }], sitemap: `${base}/sitemap.xml` };
}
