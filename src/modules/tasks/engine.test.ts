import { describe, expect, it } from "vitest";
import { calculateReadiness, canTransition, generateTasks } from "./engine";
import type { ExecutionTask, RequirementInput } from "./types";

const requirement = (id: string, applicationId: string, title = "Official transcript"): RequirementInput => ({
  id, application_id: applicationId, application_title: applicationId, title, requirement_type: "document",
  state: "missing", blocking: true, due_at: "2026-09-01T00:00:00Z",
});

describe("task execution engine", () => {
  it("rejects unsafe task transitions", () => {
    expect(canTransition("blocked", "completed")).toBe(false);
    expect(canTransition("ready_for_review", "completed")).toBe(true);
  });

  it("deduplicates shared evidence while preserving every application impact", () => {
    const tasks = generateTasks([requirement("r1", "a1"), requirement("r2", "a2")], [], new Date("2026-08-01T00:00:00Z"));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].source_requirement_ids).toEqual(["r1", "r2"]);
    expect(tasks[0].impacts).toHaveLength(2);
  });

  it("penalizes unresolved blockers in readiness", () => {
    const req = requirement("r1", "a1");
    const task = { application_id: "a1", impacts: [], state: "todo", impact_level: "critical", due_at: "2026-07-01T00:00:00Z", impact_score: 95 } as unknown as ExecutionTask;
    const result = calculateReadiness("a1", "Application", [req], [task], new Date("2026-08-01T00:00:00Z"));
    expect(result.score).toBe(0);
    expect(result.blocking_count).toBe(1);
    expect(result.overdue_critical_count).toBe(1);
  });
});
