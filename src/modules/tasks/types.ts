export const taskStates = ["todo", "in_progress", "waiting", "blocked", "ready_for_review", "completed", "not_applicable", "cancelled"] as const;
export type TaskState = (typeof taskStates)[number];
export type ImpactLevel = "critical" | "high" | "medium" | "low";
export type ImpactType = "eligibility" | "application_readiness" | "scholarship" | "funding" | "deadline" | "document" | "offer" | "visa" | "profile" | "research";
export type SourceType = "profile_gap" | "requirement" | "deadline" | "document" | "offer" | "personal" | "system";

export type TaskImpact = {
  id?: string;
  application_id?: string | null;
  entity_type: "programme" | "scholarship" | "application" | "profile" | "funding" | "offer";
  entity_id?: string | null;
  impact_label: string;
  readiness_delta: number;
  application_title?: string;
};

export type TaskDependency = {
  id?: string;
  depends_on_task_id: string;
  relation: "blocks" | "enables";
  title?: string;
  state?: TaskState;
};

export type ExecutionTask = {
  id: string;
  title: string;
  description?: string | null;
  state: TaskState;
  priority: number;
  due_at?: string | null;
  due_timezone: string;
  due_source?: string | null;
  estimated_minutes?: number | null;
  system_generated: boolean;
  impact_type: ImpactType;
  impact_level: ImpactLevel;
  impact_score: number;
  source_type: SourceType;
  source_id?: string | null;
  dedupe_key?: string | null;
  application_id?: string | null;
  application_title?: string | null;
  assigned_name?: string | null;
  assigned_email?: string | null;
  evidence_required: string[];
  completion_note?: string | null;
  completed_at?: string | null;
  position: number;
  dependencies: TaskDependency[];
  impacts: TaskImpact[];
  activity?: TaskActivity[];
  created_at: string;
  updated_at: string;
};

export type TaskActivity = { id: string | number; event_type: string; from_state?: TaskState | null; to_state?: TaskState | null; created_at: string; metadata?: Record<string, unknown> };

export type ApplicationReadiness = {
  application_id: string;
  application_title: string;
  score: number;
  confirmed_count: number;
  total_count: number;
  blocking_count: number;
  missing_count: number;
  overdue_critical_count: number;
  next_task_id?: string;
  updated_at: string;
};

export type RequirementInput = {
  id: string;
  application_id: string;
  application_title?: string;
  title: string;
  description?: string | null;
  requirement_type: string;
  state: "confirmed" | "missing" | "needs_review" | "blocked" | "waived";
  blocking: boolean;
  due_at?: string | null;
};

