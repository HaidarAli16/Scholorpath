import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchLiveScholarships } from "@/modules/catalogue/live-scholarships";

const querySchema = z.object({
  destination: z.enum(["suggest", "UK", "Germany", "Europe"]).default("suggest"),
  nationality: z.enum(["Pakistan", "India", "Bangladesh"]).optional(),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid live scholarship query.", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const result = await fetchLiveScholarships({ destinationPreference: parsed.data.destination, nationality: parsed.data.nationality }, parsed.data.limit);
    return NextResponse.json({ mode: result.items.length ? "live-discovery" : "unavailable", ...result });
  } catch {
    return NextResponse.json({ mode: "unavailable", items: [], error: "The discovery feed is temporarily unavailable." }, { status: 503 });
  }
}
