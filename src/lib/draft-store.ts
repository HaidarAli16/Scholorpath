import type { AssessmentInput } from "@/modules/assessment/types";

const draftKey = "candidroute.assessment.v2";

export function saveAssessmentDraft(draft: Partial<AssessmentInput>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(draftKey, JSON.stringify(draft));
}

export function loadAssessmentDraft(): Partial<AssessmentInput> | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(draftKey);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Partial<AssessmentInput>;
  } catch {
    window.localStorage.removeItem(draftKey);
    return null;
  }
}

export function clearAssessmentDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(draftKey);
}
