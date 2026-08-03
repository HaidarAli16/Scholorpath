import type { AssessmentInput, LiveScholarshipPreview } from "@/modules/assessment/types";

const providerBaseUrl = "https://api.worqnow.ai";
type ProviderCountry = "uk" | "de" | "nl" | "ie" | "usa" | "ca" | "au";

type ProviderScholarship = {
  name?: string;
  type?: string;
  value?: string;
  eligibility?: string;
  notes?: string;
};

type ScholarshipFeed = {
  data?: Array<{ university_code?: string; scholarships?: ProviderScholarship[] }>;
};

type UniversityFeed = {
  data?: Array<{ code?: string; name?: string; website?: string }>;
};

const countryNames: Record<ProviderCountry, string> = {
  uk: "United Kingdom",
  de: "Germany",
  nl: "Netherlands",
  ie: "Ireland",
  usa: "United States",
  ca: "Canada",
  au: "Australia",
};

function clean(value?: string) {
  return (value ?? "")
    .replaceAll("Â£", "£")
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—")
    .replaceAll("â€™", "’")
    .trim();
}

function stableId(...parts: string[]) {
  return parts.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 110);
}

function countriesFor(input?: Partial<AssessmentInput>): ProviderCountry[] {
  if (input?.destinationPreference === "UK") return ["uk"];
  if (input?.destinationPreference === "Germany") return ["de"];
  if (input?.destinationPreference === "Europe") return ["de", "nl", "ie"];
  return ["uk", "de", "nl", "ie"];
}

function fitReasons(scholarship: ProviderScholarship, input?: Partial<AssessmentInput>) {
  const reasons: string[] = [];
  const type = clean(scholarship.type).toLowerCase();
  if (type.includes("automatic")) reasons.push("The feed describes this as automatic consideration; the university must confirm it.");
  if (type.includes("merit")) reasons.push("Your declared academic result can be checked against this merit route.");
  if (input?.fundingNeed === "full" || input?.fundingNeed === "major") reasons.push("This is relevant to your funding-first search strategy.");
  if (input?.nationality) reasons.push(`${input.nationality} eligibility is still an open check.`);
  return reasons.slice(0, 3);
}

async function fetchCountry(country: ProviderCountry, input?: Partial<AssessmentInput>): Promise<LiveScholarshipPreview[]> {
  const feedUrl = `${providerBaseUrl}/education/${country}/scholarships`;
  const universitiesRequest = fetch(`${providerBaseUrl}/education/${country}/universities`, { headers: { accept: "application/json" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(5000) }).catch(() => null);
  const scholarshipsResponse = await fetch(feedUrl, { headers: { accept: "application/json" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) });
  const universitiesResponse = await universitiesRequest;
  if (!scholarshipsResponse.ok) throw new Error(`Scholarship provider returned ${scholarshipsResponse.status}.`);
  const scholarshipFeed = await scholarshipsResponse.json() as ScholarshipFeed;
  const universityFeed = universitiesResponse?.ok ? await universitiesResponse.json() as UniversityFeed : {};
  const universities = new Map((universityFeed.data ?? []).map((item) => [item.code, item]));

  return (scholarshipFeed.data ?? []).flatMap((group) => {
    const university = universities.get(group.university_code);
    const provider = clean(university?.name) || clean(group.university_code).replaceAll("_", " ") || "University provider";
    return (group.scholarships ?? []).map((scholarship) => ({
      id: `worqnow-${stableId(country, group.university_code ?? provider, scholarship.name ?? "scholarship")}`,
      title: clean(scholarship.name) || "Scholarship opportunity",
      provider,
      country: countryNames[country],
      value: clean(scholarship.value) || "Value requires verification",
      fundingType: clean(scholarship.type) || "Funding type unclassified",
      eligibilitySummary: [clean(scholarship.eligibility), clean(scholarship.notes)].filter(Boolean).join(" ") || "Eligibility requires verification.",
      sourceUrl: clean(university?.website) || feedUrl,
      sourceName: "WorqNow live discovery feed",
      verificationState: "third_party_discovery" as const,
      fitReasons: fitReasons(scholarship, input),
    }));
  });
}

export async function fetchLiveScholarships(input?: Partial<AssessmentInput>, limit = 12) {
  const countries = countriesFor(input);
  const results = await Promise.allSettled(countries.map((country) => fetchCountry(country, input)));
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const unique = [...new Map(items.map((item) => [item.id, item])).values()];
  return {
    items: unique.slice(0, Math.max(1, Math.min(limit, 30))),
    source: "WorqNow live discovery feed",
    fetchedAt: new Date().toISOString(),
    verificationRequired: true,
    providerErrors: results.filter((result) => result.status === "rejected").length,
  };
}
