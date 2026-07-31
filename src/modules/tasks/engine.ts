import type { ApplicationReadiness, ExecutionTask, ImpactLevel, RequirementInput, TaskState } from "./types";

export const transitionMap: Record<TaskState, TaskState[]> = {
  todo: ["in_progress", "waiting", "blocked", "ready_for_review", "completed", "not_applicable", "cancelled"],
  in_progress: ["todo", "waiting", "blocked", "ready_for_review", "completed", "not_applicable", "cancelled"],
  waiting: ["todo", "in_progress", "blocked", "completed", "not_applicable", "cancelled"],
  blocked: ["todo", "in_progress", "waiting", "not_applicable", "cancelled"],
  ready_for_review: ["in_progress", "completed", "not_applicable", "cancelled"],
  completed: ["todo"],
  not_applicable: ["todo"],
  cancelled: ["todo"],
};

export function canTransition(from: TaskState, to: TaskState) { return from === to || transitionMap[from].includes(to); }

export function impactScore(level: ImpactLevel, dueAt?: string | null, blocking = false, now = new Date()) {
  const base = { critical: 88, high: 68, medium: 44, low: 22 }[level];
  if (!dueAt) return Math.min(100, base + (blocking ? 8 : 0));
  const days = (new Date(dueAt).getTime() - now.getTime()) / 86400000;
  const urgency = days < 0 ? 12 : days <= 3 ? 10 : days <= 7 ? 7 : days <= 30 ? 3 : 0;
  return Math.min(100, base + urgency + (blocking ? 8 : 0));
}

function levelFor(requirement: RequirementInput, now = new Date()): ImpactLevel {
  const days = requirement.due_at ? (new Date(requirement.due_at).getTime() - now.getTime()) / 86400000 : Infinity;
  if (requirement.blocking && days <= 30) return "critical";
  if (requirement.blocking || days <= 14) return "high";
  return requirement.state === "needs_review" ? "medium" : "low";
}

export function requirementDedupeKey(requirement: RequirementInput) {
  const normalized = requirement.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `requirement:${requirement.requirement_type}:${normalized}`;
}

export type GeneratedTask = Omit<ExecutionTask, "id" | "created_at" | "updated_at" | "activity"> & { source_requirement_ids: string[] };

export function generateTasks(requirements: RequirementInput[], existing: Pick<ExecutionTask, "dedupe_key" | "state">[], now = new Date()): GeneratedTask[] {
  const active = new Set(existing.filter((task) => !["cancelled", "not_applicable"].includes(task.state)).map((task) => task.dedupe_key).filter(Boolean));
  const generated = new Map<string, GeneratedTask>();
  for (const req of requirements) {
    if (["confirmed", "waived"].includes(req.state)) continue;
    const key = requirementDedupeKey(req);
    if (active.has(key)) continue;
    const level = levelFor(req, now);
    const current = generated.get(key);
    if (current) {
      current.source_requirement_ids.push(req.id);
      current.impacts.push({ application_id: req.application_id, entity_type: "application", entity_id: req.application_id, application_title: req.application_title, impact_label: `Resolves ${req.title}`, readiness_delta: req.blocking ? 18 : 8 });
      if (req.due_at && (!current.due_at || req.due_at < current.due_at)) current.due_at = req.due_at;
      current.impact_score = Math.max(current.impact_score, impactScore(level, req.due_at, req.blocking, now));
      continue;
    }
    generated.set(key, {
      title: req.state === "needs_review" ? `Verify ${req.title}` : `Provide ${req.title}`,
      description: req.description || `Resolve this ${req.requirement_type.replaceAll("_", " ")} requirement and attach evidence.`,
      state: req.state === "blocked" ? "blocked" : "todo",
      priority: level === "critical" ? 1 : level === "high" ? 2 : level === "medium" ? 3 : 4,
      due_at: req.due_at,
      due_timezone: "Asia/Karachi",
      due_source: "Official application requirement",
      estimated_minutes: req.requirement_type.includes("writing") ? 90 : 30,
      system_generated: true,
      impact_type: req.requirement_type.includes("document") ? "document" : "application_readiness",
      impact_level: level,
      impact_score: impactScore(level, req.due_at, req.blocking, now),
      source_type: "requirement",
      source_id: req.id,
      dedupe_key: key,
      application_id: req.application_id,
      application_title: req.application_title,
      assigned_name: null,
      assigned_email: null,
      evidence_required: [req.title],
      completion_note: null,
      completed_at: null,
      position: 1000,
      dependencies: [],
      impacts: [{ application_id: req.application_id, entity_type: "application", entity_id: req.application_id, application_title: req.application_title, impact_label: req.blocking ? `Unblocks ${req.application_title || "application"}` : `Improves ${req.application_title || "application"} readiness`, readiness_delta: req.blocking ? 18 : 8 }],
      source_requirement_ids: [req.id],
    });
  }
  return [...generated.values()];
}

export function isOverdue(task: Pick<ExecutionTask, "due_at" | "state">, now = new Date()) {
  return Boolean(task.due_at && new Date(task.due_at) < now && !["completed", "cancelled", "not_applicable"].includes(task.state));
}

export function rankTasks(tasks: ExecutionTask[], now = new Date()) {
  return [...tasks].sort((a, b) => {
    const aBlocked = a.state === "blocked" ? 1 : 0; const bBlocked = b.state === "blocked" ? 1 : 0;
    if (aBlocked !== bBlocked) return aBlocked - bBlocked;
    const aOverdue = isOverdue(a, now) ? 1 : 0; const bOverdue = isOverdue(b, now) ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;
    if (a.impact_score !== b.impact_score) return b.impact_score - a.impact_score;
    return (a.due_at ? new Date(a.due_at).getTime() : Infinity) - (b.due_at ? new Date(b.due_at).getTime() : Infinity);
  });
}

export function calculateReadiness(applicationId: string, applicationTitle: string, requirements: RequirementInput[], tasks: ExecutionTask[], now = new Date()): ApplicationReadiness {
  const relevantRequirements = requirements.filter((r) => r.application_id === applicationId);
  const relevantTasks = tasks.filter((t) => t.application_id === applicationId || t.impacts.some((i) => i.application_id === applicationId));
  const total = relevantRequirements.length;
  const confirmed = relevantRequirements.filter((r) => ["confirmed", "waived"].includes(r.state)).length;
  const blockers = relevantRequirements.filter((r) => r.blocking && !["confirmed", "waived"].includes(r.state)).length;
  const overdueCritical = relevantTasks.filter((t) => t.impact_level === "critical" && isOverdue(t, now)).length;
  const raw = total ? (confirmed / total) * 100 : 0;
  const score = Math.max(0, Math.min(100, Math.round(raw - blockers * 6 - overdueCritical * 4)));
  const next = rankTasks(relevantTasks.filter((t) => !["completed", "cancelled", "not_applicable"].includes(t.state)), now)[0];
  return { application_id: applicationId, application_title: applicationTitle, score, confirmed_count: confirmed, total_count: total, blocking_count: blockers, missing_count: Math.max(0, total - confirmed), overdue_critical_count: overdueCritical, next_task_id: next?.id, updated_at: now.toISOString() };
}
