import type { IntelligenceReport } from "../intelligence/engine";

export const originOptions = [
  "Pakistan", "India", "Bangladesh",
  "Nigeria", "China", "United States", "Indonesia", "Brazil", "Russia", "Mexico",
  "Japan", "Philippines", "Ethiopia", "Egypt", "Vietnam", "DR Congo", "Turkey",
  "Iran", "Germany", "Thailand", "United Kingdom", "France", "Italy", "Tanzania",
  "South Africa", "Myanmar", "Kenya", "South Korea", "Colombia", "Spain",
  "Uganda", "Argentina", "Algeria", "Sudan", "Ukraine", "Iraq", "Afghanistan",
  "Poland", "Canada", "Morocco", "Saudi Arabia", "Uzbekistan", "Peru", "Angola",
  "Malaysia", "Mozambique", "Ghana", "Yemen", "Nepal", "Venezuela"
] as const;
export type OriginCountry = string;

export const residenceOptions = [
  "Pakistan", "India", "Bangladesh",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "United Kingdom",
  "United States", "Canada", "Australia", "Germany", "France",
  "Italy", "Spain", "Malaysia", "Singapore", "Oman", "Kuwait",
  "Bahrain", "China", "Japan", "South Korea", "Turkey", "Egypt",
  "South Africa", "Nigeria", "Kenya", "Brazil", "Mexico", "Other"
] as const;

export const qualificationOptions: Record<string, readonly string[]> = {
  Pakistan: [
    "Four-year bachelor's degree",
    "Two-year bachelor's + master's",
    "MBBS / BDS / professional degree",
    "Master's degree",
    "Other qualification",
  ],
  India: [
    "Four-year bachelor's degree",
    "Three-year bachelor's degree",
    "Integrated master's degree",
    "Master's degree",
    "Other qualification",
  ],
  Bangladesh: [
    "Four-year bachelor's degree",
    "Three-year bachelor's degree",
    "MBBS / BDS / professional degree",
    "Master's degree",
    "Other qualification",
  ],
  _default: [
    "Bachelor's degree (3-year)",
    "Bachelor's degree (4-year)",
    "Master's degree",
    "Professional degree (Medicine, Law, etc.)",
    "PhD or doctoral degree",
    "Other qualification",
  ],
};

export const fieldOptions = [
  "Business, management and law",
  "Computing and information technology",
  "Engineering and engineering trades",
  "Natural sciences, mathematics and statistics",
  "Health and welfare",
  "Social sciences and journalism",
  "Education",
  "Arts and humanities",
  "Agriculture and veterinary",
  "Services",
] as const;

function generateIntakeOptions(): string[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const options: string[] = [];
  for (let year = currentYear; year <= currentYear + 2; year++) {
    if (year === currentYear && currentMonth >= 6) continue;
    options.push(`September ${year}`);
  }
  for (let year = currentYear + 1; year <= currentYear + 2; year++) {
    options.push(`January ${year}`);
  }
  options.sort();
  options.push("I am flexible");
  return options;
}
export const intakeOptions: readonly string[] = generateIntakeOptions();

export type FundingNeed = "full" | "major" | "partial" | "self";
export type EnglishStatus = "not_started" | "preparing" | "booked" | "completed";
export type CompletionStatus = "completed" | "final_year" | "result_awaited";
export type ResearchEvidence =
  | "thesis"
  | "assistantship"
  | "publication"
  | "project"
  | "none";

export interface AssessmentInput {
  firstName: string;
  nationality: string;
  currentCountry: string;
  qualification: string;
  institution: string;
  fieldFamily: string;
  completionStatus: CompletionStatus;
  graduationYear: number;
  gradeValue: number;
  gradeMaximum: 4 | 5 | 10 | 100;
  intake: string;
  fundingNeed: FundingNeed;
  budgetCurrency: "PKR" | "INR" | "BDT" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "CNY" | "KRW" | "SGD" | "MYR" | "TRY" | "HUF" | "NZD" | "SAR" | "SEK" | "CHF" | "NOK";
  availableBudget: number;
  destinationPreference: "suggest" | "World" | "UK" | "Germany" | "Europe" | "US" | "Canada" | "Australia" | "Japan" | "Korea" | "Singapore" | "Malaysia";
  englishStatus: EnglishStatus;
  englishTest?: "IELTS" | "TOEFL" | "PTE" | "Other";
  englishScore?: number;
  experienceRange: "none" | "under_one" | "one_to_two" | "three_plus";
  researchEvidence: ResearchEvidence[];
  weeklyHours: number;
  biggestBlocker:
    | "where_to_start"
    | "eligibility"
    | "funding"
    | "documents"
    | "deadlines";
}

export type EvidenceState = "verified_requirement" | "derived" | "assumption" | "suggestion";
export type RouteState = "conditional" | "unknown" | "not_recommended";
export type RouteStrength = "strong" | "promising" | "explore";

export interface PathwayLane {
  id: string;
  title: string;
  subtitle: string;
  state: RouteState;
  strength: RouteStrength;
  why: string[];
  conditions: string[];
  nextAction: string;
  sourceLabel: string;
  sourceUrl: string;
  evidenceState: EvidenceState;
}

export interface ActionItem {
  id: string;
  title: string;
  detail: string;
  horizon: "Today" | "This week" | "Next";
  impact: "critical" | "high" | "medium";
  complete: boolean;
}

export interface ProfileSnapshot {
  academic: string;
  goal: string;
  funding: string;
  evidence: string;
}

export type ReadinessState = "ready" | "developing" | "blocked";

export interface ReadinessDimension {
  id: "academic" | "language" | "funding" | "evidence" | "execution";
  label: string;
  score: number;
  state: ReadinessState;
  summary: string;
  nextMove: string;
}

export interface LiveScholarshipPreview {
  id: string;
  title: string;
  provider: string;
  country: string;
  value: string;
  fundingType: string;
  eligibilitySummary: string;
  sourceUrl: string;
  sourceName: string;
  verificationState: "third_party_discovery";
  fitReasons: string[];
}

export interface AssessmentReport {
  generatedAt: string;
  profileCompleteness: number;
  confidence: "medium" | "developing";
  headline: string;
  summary: string;
  snapshot: ProfileSnapshot;
  readiness: ReadinessDimension[];
  strongestSignals: string[];
  evidenceGaps: string[];
  pathways: PathwayLane[];
  actionPlan: ActionItem[];
  assumptions: string[];
  liveScholarships?: LiveScholarshipPreview[];
  liveDataNotice?: string;
  intelligence: IntelligenceReport;
}
