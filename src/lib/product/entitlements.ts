export const FREE_REPORT_LIMITS = Object.freeze({
  opportunities: 3,
  gaps: 3,
  countries: 3,
  institutions: 3,
});

export type ProductAccess = {
  plan: "free" | "pro";
  active: boolean;
};

// Temporary beta policy: server-authenticated testers receive this access state.
// Remove this constant and restore entitlement-backed access when billing launches.
export const AUTHENTICATED_BETA_ACCESS: ProductAccess = Object.freeze({ plan: "pro", active: true });

export function hasProAccess(access: ProductAccess | null | undefined) {
  return access?.plan === "pro" && access.active === true;
}
