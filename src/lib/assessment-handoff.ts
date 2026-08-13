import type { AssessmentInput, AssessmentReport } from "@/modules/assessment/types";

const handoffKey = "candidroute:assessment-handoff";
const legacyHandoffKey = "scholarpath:assessment-handoff";

export type AssessmentHandoff = {
  profile: Partial<AssessmentInput>;
  report: AssessmentReport;
  createdAt: string;
  requiresClaim?: boolean;
  idempotencyKey?: string;
};

export function saveAssessmentHandoff(profile: Partial<AssessmentInput>, report: AssessmentReport, options: { requiresClaim?: boolean; idempotencyKey?: string } = {}) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(handoffKey, JSON.stringify({ profile, report, createdAt: new Date().toISOString(), ...options } satisfies AssessmentHandoff));
  window.sessionStorage.removeItem(legacyHandoffKey);
}

export function loadAssessmentHandoff(): AssessmentHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(handoffKey) ?? window.sessionStorage.getItem(legacyHandoffKey);
    return value ? JSON.parse(value) as AssessmentHandoff : null;
  } catch {
    return null;
  }
}
