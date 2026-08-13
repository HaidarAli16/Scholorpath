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

export function hasProAccess(access: ProductAccess | null | undefined) {
  return access?.plan === "pro" && (access.active === true);
}
