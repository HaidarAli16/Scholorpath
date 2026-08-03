import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Limit = { requests: number; windowSeconds: number };

function requestOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const ownOrigin = new URL(request.url).origin;
  const configured = (process.env.ALLOWED_APP_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  return origin === ownOrigin || configured.includes(origin);
}

function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${scope}:${createHash("sha256").update(address).digest("hex")}`;
}

export async function guardMutation(request: Request, scope: string, limit: Limit) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  if (!requestOriginAllowed(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected.", requestId }, { status: 403 });
  }
  const admin = createSupabaseAdminClient();
  if (!admin && !isSupabaseConfigured) return null;
  if (!admin) return process.env.NODE_ENV === "production"
    ? NextResponse.json({ error: "Server security configuration is incomplete.", requestId }, { status: 503 })
    : null;
  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_bucket_key: clientKey(request, scope),
    p_limit: limit.requests,
    p_window_seconds: limit.windowSeconds,
  });
  if (error) {
    if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Request protection is temporarily unavailable.", requestId }, { status: 503 });
    return null;
  }
  if (!data) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly.", requestId }, {
      status: 429,
      headers: { "Retry-After": String(limit.windowSeconds) },
    });
  }
  return null;
}
