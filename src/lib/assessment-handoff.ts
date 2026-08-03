import type { AssessmentInput, AssessmentReport } from "@/modules/assessment/types";

const handoffKey = "scholarpath:assessment-handoff";

export type AssessmentHandoff = {
  profile: Partial<AssessmentInput>;
  report: AssessmentReport;
  createdAt: string;
};

export function saveAssessmentHandoff(profile: Partial<AssessmentInput>, report: AssessmentReport) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(handoffKey, JSON.stringify({ profile, report, createdAt: new Date().toISOString() } satisfies AssessmentHandoff));
}

export function loadAssessmentHandoff(): AssessmentHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(handoffKey);
    return value ? JSON.parse(value) as AssessmentHandoff : null;
  } catch {
    return null;
  }
}
