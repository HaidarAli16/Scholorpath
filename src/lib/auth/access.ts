export type AppRole = "student" | "research_operator" | "research_reviewer" | "support" | "admin";

const staffRoles = new Set<AppRole>(["research_operator", "research_reviewer", "support", "admin"]);

export function safeInternalPath(value: string | null | undefined, fallback = "/today") {
  if (!value || /[\u0000-\u001f\u007f]/.test(value)) return fallback;
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return fallback; }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) return fallback;
  try {
    const target = new URL(decoded, "https://candidroute.invalid");
    if (target.origin !== "https://candidroute.invalid") return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch { return fallback; }
}

export function canAccessAdmin(roles: readonly string[]) {
  return roles.includes("admin");
}

export function canAccessOperations(roles: readonly string[]) {
  return roles.some((role) => staffRoles.has(role as AppRole));
}

export function requiresStudentSession(pathname: string) {
  return [
    "/portfolio",
    "/report",
    "/applications",
    "/workspace",
    "/profile",
    "/notifications",
    "/help",
    "/settings",
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
