import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, sessionKey } from "@/modules/auth/session-key";
import { blogRoute } from "@/modules/blog/routes";

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
  const blogMatch = /^\/blog\/([^/]+)$/.exec(pathname);
  if (blogMatch && (request.method === "GET" || request.method === "HEAD")) {
    const route = await blogRoute(decodeURIComponent(blogMatch[1]));
    if (route?.redirect) { const url = request.nextUrl.clone(); url.pathname = `/blog/${route.slug}`; return NextResponse.redirect(url, 301); }
  }
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next();

  // Optimistic check only: admin pages and actions verify the session again
  // against the database via requireAdmin().
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await jwtVerify(token, sessionKey());
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    } catch {
      // fall through to the redirect
    }
  }
  // Back to the requested page after logging in (checked again by the login action).
  const login = new URL("/admin/login", request.url);
  if (pathname !== "/admin") login.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except build assets, which are served as files.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
