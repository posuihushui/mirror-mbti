import { NextResponse, type NextRequest } from "next/server";
import { issueVisitorToken, verifyVisitorToken, VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE } from "@/lib/visitor-token";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production (at least 16 characters).");
  return "mirror-dev-session-secret-not-for-production";
}

/** Root-level routes that live outside `app/[lang]` and must never be locale-rewritten. */
const ROOT_ROUTES = /^\/(api\/|robots\.txt$|sitemap\.xml$|llms(-full)?\.txt$|manifest\.webmanifest$|favicon\.ico$|icon|apple-icon|opengraph-image)/;

/**
 * Pages live under `app/[lang]`. Chinese keeps its unprefixed URLs: `/quiz` is served by
 * `/zh/quiz` through a rewrite, and a typed `/zh/quiz` redirects back so there is one URL per page.
 */
function routeLocale(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  if (pathname === "/zh" || pathname.startsWith("/zh/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (ROOT_ROUTES.test(pathname) || pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/zh" : `/zh${pathname}`;
  return NextResponse.rewrite(url);
}

/**
 * Routes each request to its locale tree and issues the signed anonymous visitor cookie on
 * first visit so results and orders can be attributed without accounts. Runs on the Node.js runtime.
 */
export function proxy(request: NextRequest) {
  // The recovery route sets the recovered cookie itself. A proxy cookie would
  // otherwise compete with that Set-Cookie header on a session-less request.
  if (request.method === "POST" && request.nextUrl.pathname === "/api/reports/recover") return NextResponse.next();

  const response = routeLocale(request);
  if (response.status === 308) return response;

  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  if (verifyVisitorToken(existing, secret())) return response;

  const { token } = issueVisitorToken(secret());
  response.cookies.set({
    name: VISITOR_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|llms.txt|llms-full.txt|manifest.webmanifest|assets/).*)"],
};
