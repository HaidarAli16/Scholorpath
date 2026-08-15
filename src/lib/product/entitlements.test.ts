import { describe, expect, it } from "vitest";
import { AUTHENTICATED_BETA_ACCESS, hasProAccess } from "./entitlements";

describe("product entitlements", () => {
  it("grants Pro to the server-authenticated beta access state", () => {
    expect(hasProAccess(AUTHENTICATED_BETA_ACCESS)).toBe(true);
  });

  it("does not grant Pro to missing, free, or inactive access states", () => {
    expect(hasProAccess(null)).toBe(false);
    expect(hasProAccess({ plan: "free", active: false })).toBe(false);
    expect(hasProAccess({ plan: "pro", active: false })).toBe(false);
  });
});
