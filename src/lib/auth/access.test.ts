import { describe, expect, it } from "vitest";
import { canAccessAdmin, canAccessOperations, defaultLandingPath, requiresStudentSession, safeInternalPath } from "./access";

describe("route access", () => {
  it("accepts only internal redirect paths", () => {
    expect(safeInternalPath("/admin")).toBe("/admin");
    expect(safeInternalPath("https://evil.example")).toBe("/today");
    expect(safeInternalPath("//evil.example")).toBe("/today");
    expect(safeInternalPath("/\\evil.example")).toBe("/today");
    expect(safeInternalPath("/%2f%2fevil.example")).toBe("/today");
    expect(safeInternalPath("/%5cevil.example")).toBe("/today");
    expect(safeInternalPath("/today\nLocation:https://evil.example")).toBe("/today");
  });

  it("separates admin and staff permissions", () => {
    expect(canAccessAdmin(["admin"])).toBe(true);
    expect(canAccessAdmin(["research_reviewer"])).toBe(false);
    expect(canAccessOperations(["support"])).toBe(true);
    expect(canAccessOperations(["student"])).toBe(false);
  });

  it("lands each account in its correct workspace", () => {
    expect(defaultLandingPath(["admin", "student"])).toBe("/admin");
    expect(defaultLandingPath(["research_reviewer"])).toBe("/operations");
    expect(defaultLandingPath(["student"])).toBe("/today");
  });

  it("marks private student workspace routes", () => {
    expect(requiresStudentSession("/workspace/documents")).toBe(true);
    expect(requiresStudentSession("/profile")).toBe(true);
    expect(requiresStudentSession("/discover")).toBe(false);
    expect(requiresStudentSession("/countries")).toBe(false);
  });
});
