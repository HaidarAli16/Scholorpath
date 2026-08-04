export type EvidenceSource = { label: string; url: string; verifiedAt: string; nextReviewAt: string };

export type CityIntelligence = {
  id: string;
  name: string;
  monthlyCostLow: number;
  monthlyCostHigh: number;
  accommodationLow: number;
  accommodationHigh: number;
  deposit: string;
  transport: string;
  safety: string;
  climate: string;
  community: string;
  confidence: number;
};

export type CountryFact = {
  id: string;
  category: string;
  label: string;
  value: Record<string, unknown>;
  qualification?: string | null;
  confidence: number;
  source?: EvidenceSource | null;
};

export type CountryIntelligence = {
  code: string;
  slug: string;
  name: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  primaryLanguage: string;
  studentRoute: string;
  visaDifficulty: "lower" | "moderate" | "higher" | "variable";
  visaFeeAmount?: number | null;
  visaFeeCurrency?: string | null;
  proofFundsAmount?: number | null;
  proofFundsCurrency?: string | null;
  proofFundsMonths?: number | null;
  workHours?: number | null;
  postStudyMonths?: number | null;
  monthlyCostLow?: number | null;
  monthlyCostHigh?: number | null;
  costCurrency: string;
  summary: string;
  healthcare: string;
  work: string;
  postStudy: string;
  climate: string;
  community: string;
  visaUncertainty: string;
  lastVerifiedAt: string;
  nextReviewAt: string;
  cities: CityIntelligence[];
  facts: CountryFact[];
};

export type InstitutionRanking = { id: string; publisher: string; name: string; year: number; rankLabel: string; subject?: string | null; source?: EvidenceSource | null };
export type QualificationEquivalency = { id: string; originCountry: "Pakistan" | "India" | "Bangladesh"; studyLevel: string; qualification: string; minimumResult?: string | null; state: "published_threshold" | "case_by_case" | "external_evaluation" | "unverified"; notes: string; source?: EvidenceSource | null };
export type InstitutionRequirement = { id: string; type: string; label: string; description: string; required: boolean; originCountry?: string | null; studyLevel?: string | null; source?: EvidenceSource | null };

export type InstitutionDirectoryItem = {
  id: string;
  slug: string;
  name: string;
  shortName?: string | null;
  type: "university" | "university_of_applied_sciences" | "college" | "pathway_provider" | "consortium";
  countryCode: string;
  countryName: string;
  flag: string;
  city?: string | null;
  websiteUrl: string;
  admissionsUrl?: string | null;
  publicPrivate?: string | null;
  degreeAwarding: boolean;
  sponsorStatus?: string | null;
  summary: string;
  lastVerifiedAt: string;
  nextReviewAt: string;
  campusCount: number;
  programmeCount: number;
  rankings: InstitutionRanking[];
  equivalencies: QualificationEquivalency[];
  requirements: InstitutionRequirement[];
};

export type DirectoryPayload = { mode: "live" | "curated-fallback"; countries: CountryIntelligence[]; institutions: InstitutionDirectoryItem[]; generatedAt: string };

