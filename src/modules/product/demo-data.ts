export type Opportunity = {
  id: string;
  kind: "Programme" | "Scholarship";
  title: string;
  provider: string;
  country: string;
  flag: string;
  deadline: string;
  deadlineAt?: string;
  deadlineNote: string;
  value: string;
  match: "Confirmed match" | "Conditional match" | "Needs verification";
  matchScore?: number;
  freshness: "Verified" | "Review due";
  reasons: string[];
  condition: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
  saved?: boolean;
};

export const opportunities: Opportunity[] = [
  {
    id: "leeds-data-science-statistics-online-2026",
    kind: "Programme",
    title: "MSc Data Science (Statistics) Online",
    provider: "University of Leeds",
    country: "United Kingdom",
    flag: "GB",
    deadline: "Deadline not confirmed",
    deadlineNote: "March 2027 intake · confirm availability with Leeds",
    value: "£15,000 published tuition",
    match: "Conditional match",
    matchScore: 78,
    freshness: "Verified",
    reasons: ["Computing and statistics routes can align", "Online delivery lowers relocation dependency"],
    condition: "The application deadline and final academic equivalence remain open checks.",
    sourceUrl: "https://courses.leeds.ac.uk/d053/data-science-statistics-msc",
    lastVerifiedAt: "2026-08-04",
    saved: true,
  },
  {
    id: "saarland-data-science-ai-msc-2027-summer",
    kind: "Programme",
    title: "MSc Data Science and Artificial Intelligence",
    provider: "Saarland University",
    country: "Germany",
    flag: "DE",
    deadline: "15 Nov 2026",
    deadlineAt: "2026-11-15T22:59:00Z",
    deadlineNote: "Europe/Berlin · official programme page",
    value: "No tuition · semester fee applies",
    match: "Needs verification",
    matchScore: 61,
    freshness: "Verified",
    reasons: ["Strong subject alignment", "Lower-tuition route supports your funding constraint"],
    condition: "Exact CS, mathematics and AI prerequisite coverage plus accepted C1 English evidence must be checked.",
    sourceUrl: "https://www.uni-saarland.de/en/study/programmes/master/data-science.html",
    lastVerifiedAt: "2026-08-04",
    saved: true,
  },
  {
    id: "chevening-scholarship-2027-28",
    kind: "Scholarship",
    title: "Chevening Scholarship 2027–28",
    provider: "Chevening / UK Government",
    country: "United Kingdom",
    flag: "GB",
    deadline: "6 Oct 2026",
    deadlineAt: "2026-10-06T11:00:00Z",
    deadlineNote: "11:00 UTC · official application timeline",
    value: "Published full-award route",
    match: "Conditional match",
    matchScore: 84,
    freshness: "Verified",
    reasons: ["Pakistan, India and Bangladesh have country routes", "The cycle is open from 4 August 2026"],
    condition: "All country-page eligibility, leadership evidence and eligible course choices still require review.",
    sourceUrl: "https://www.chevening.org/scholarships/application-timeline/",
    lastVerifiedAt: "2026-08-04",
  },
  {
    id: "nl-scholarship-2026-27",
    kind: "Scholarship",
    title: "NL Scholarship 2026–27",
    provider: "Dutch Ministry and participating institutions",
    country: "Netherlands",
    flag: "NL",
    deadline: "Institution-specific",
    deadlineNote: "Only participating institutions · verify the university deadline",
    value: "€5,000 first-year award",
    match: "Conditional match",
    matchScore: 72,
    freshness: "Verified",
    reasons: ["Non-EEA applicants are in scope", "Bachelor’s and master’s routes can participate"],
    condition: "Your chosen institution and programme must participate in the 2026–27 cycle.",
    sourceUrl: "https://www.studyinnl.org/finances/nl-scholarship",
    lastVerifiedAt: "2026-08-04",
  },
];

export const applications = [
  {
    id: "APP-1042",
    title: "MSc Data Science and Analytics",
    provider: "University of Leeds",
    status: "Preparing",
    deadline: "30 Jun",
    done: 8,
    total: 13,
    next: "Verify mathematics module coverage",
    tone: "amber",
  },
  {
    id: "APP-1038",
    title: "MSc Artificial Intelligence",
    provider: "Saarland University",
    status: "Preparing",
    deadline: "15 May",
    done: 5,
    total: 12,
    next: "Upload official course descriptions",
    tone: "blue",
  },
  {
    id: "APP-1019",
    title: "Erasmus Mundus DSAI",
    provider: "Consortium application",
    status: "Considering",
    deadline: "12 Jan",
    done: 2,
    total: 11,
    next: "Wait for verified 2027 cycle",
    tone: "slate",
  },
];

export const tasks = [
  { title: "Verify mathematics module coverage", context: "Leeds application", due: "Today", state: "To do" },
  { title: "Request official transcript", context: "Academic documents", due: "28 Jul", state: "Waiting on someone" },
  { title: "Draft evidence story bank", context: "Chevening", due: "31 Jul", state: "In progress" },
  { title: "Confirm Saarland ECTS mapping", context: "Saarland application", due: "4 Aug", state: "Blocked" },
];

export const documents = [
  { name: "Passport.pdf", category: "Identity", status: "Uploaded", used: "2 applications", updated: "24 Jul" },
  { name: "BS Transcript.pdf", category: "Academic", status: "Needs review", used: "3 applications", updated: "22 Jul" },
  { name: "Degree Certificate.pdf", category: "Academic", status: "Uploaded", used: "2 applications", updated: "22 Jul" },
  { name: "IELTS TRF", category: "Language", status: "Missing", used: "Required by 2", updated: "—" },
];

export const sourceQueue = [
  { record: "Chevening 2027–28 timeline", type: "Scholarship cycle", state: "Review requested", impact: "146 saved" },
  { record: "Leeds MSc Data Science", type: "Programme", state: "Conflict detected", impact: "18 applications" },
  { record: "Saarland AI entry criteria", type: "Atomic rules", state: "Normalization", impact: "42 saved" },
  { record: "Erasmus DSAI 2027 cycle", type: "Scholarship cycle", state: "Awaiting source", impact: "91 saved" },
];
