import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, sessionKey } from "@/modules/auth/session-key";

function isMalformed(pathname: string) {
  try {
    decodeURIComponent(pathname);
    return false;
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // A broken percent-escape (e.g. /services/%ff) would otherwise crash the
  // route with a 500; it is a bad request.
  if (isMalformed(pathname)) {
    return new NextResponse("Bad Request", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next();

  // Optimistic check only: admin pages and actions verify the session again
  // against the database via requireAdmin().
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await jwtVerify(token, sessionKey());
      return NextResponse.next();
    } catch {
      // fall through to the redirect
    }
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  // Everything except build assets, which are served as files.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
