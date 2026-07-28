export type Opportunity = {
  id: string;
  kind: "Programme" | "Scholarship";
  title: string;
  provider: string;
  country: string;
  flag: string;
  deadline: string;
  deadlineNote: string;
  value: string;
  match: "Confirmed match" | "Conditional match" | "Needs verification";
  freshness: "Verified" | "Review due";
  reasons: string[];
  condition: string;
  saved?: boolean;
};

export const opportunities: Opportunity[] = [
  {
    id: "msc-data-leeds",
    kind: "Programme",
    title: "MSc Data Science and Analytics",
    provider: "University of Leeds",
    country: "United Kingdom",
    flag: "GB",
    deadline: "30 Jun 2027",
    deadlineNote: "23:59 UK time · confirm before submission",
    value: "£31,000 tuition",
    match: "Conditional match",
    freshness: "Verified",
    reasons: ["Your computing degree is academically adjacent", "September 2027 fits your stated intake"],
    condition: "Module-level mathematics prerequisites need transcript review.",
    saved: true,
  },
  {
    id: "msc-ai-saarland",
    kind: "Programme",
    title: "MSc Artificial Intelligence",
    provider: "Saarland University",
    country: "Germany",
    flag: "DE",
    deadline: "15 May 2027",
    deadlineNote: "Local institutional time",
    value: "No tuition · semester fee applies",
    match: "Needs verification",
    freshness: "Verified",
    reasons: ["Strong subject alignment", "Lower-tuition route supports your funding constraint"],
    condition: "Exact ECTS coverage and degree equivalence must be checked.",
    saved: true,
  },
  {
    id: "erasmus-dsai",
    kind: "Scholarship",
    title: "Erasmus Mundus Joint Master in Data Science & AI",
    provider: "European university consortium",
    country: "Multiple countries",
    flag: "EU",
    deadline: "12 Jan 2027",
    deadlineNote: "Cycle date · review due 01 Sep 2026",
    value: "Potential full award",
    match: "Conditional match",
    freshness: "Review due",
    reasons: ["Funding-first route", "Research evidence improves relevance"],
    condition: "The next consortium cycle and origin eligibility are not yet published.",
  },
  {
    id: "chevening",
    kind: "Scholarship",
    title: "Chevening Scholarship 2027–28",
    provider: "UK Government",
    country: "United Kingdom",
    flag: "GB",
    deadline: "6 Oct 2026",
    deadlineNote: "11:00 UTC · official cycle timeline",
    value: "Fully funded award",
    match: "Conditional match",
    freshness: "Verified",
    reasons: ["Pakistan is an eligible territory", "Your intended UK intake matches the cycle"],
    condition: "Leadership evidence and post-graduation work requirements require review.",
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

