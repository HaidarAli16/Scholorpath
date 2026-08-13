export const preferredRegion = "sin1";

import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Reference submissions are not configured." }, { status: 503 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await admin.from("recommenders").select("id,name,status,token_expires_at,applications(title,provider_name)").eq("access_token_hash", hash).maybeSingle();
  if (error || !data || !data.token_expires_at || new Date(data.token_expires_at).getTime() < Date.now()) return NextResponse.json({ error: "This invitation is invalid or expired." }, { status: 404 });
  return NextResponse.json({ recommender: { name: data.name, status: data.status, application: data.applications }, accepted: data.status === "submitted" });
}

