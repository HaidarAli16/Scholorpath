import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const supported = ["GBP", "EUR", "PKR", "INR", "BDT", "USD"] as const;
const schema = z.object({ from: z.enum(supported), to: z.enum(supported), amount: z.coerce.number().min(0).max(100_000_000) });

export async function GET(request: Request) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Choose supported currencies and a valid amount." }, { status: 400 });
  const { from, to, amount } = parsed.data;
  if (from === to) return NextResponse.json({ amount, converted: amount, rate: 1, from, to, state: "live", source: "Identity conversion", asOf: new Date().toISOString() });
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${from}`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(4500) });
    if (!response.ok) throw new Error("FX provider unavailable");
    const payload = await response.json() as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    const rate = payload.rates?.[to];
    if (payload.result !== "success" || !rate) throw new Error("FX rate unavailable");
    return NextResponse.json({ amount, converted: Math.round(amount * rate * 100) / 100, rate, from, to, state: "live", source: "ExchangeRate-API indicative rate", asOf: payload.time_last_update_utc ?? new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Live exchange-rate data is temporarily unavailable. No estimated rate was substituted." }, { status: 503 });
  }
}

