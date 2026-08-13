import { NextResponse, type NextRequest } from "next/server";
import { refreshSupabaseSession } from "./src/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const publicDataRoute = ["/api/catalogue", "/api/countries", "/api/institutions", "/api/fx", "/api/scholarships/live"].some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`));
  if (request.method === "GET" && publicDataRoute) return NextResponse.next({ request });
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
