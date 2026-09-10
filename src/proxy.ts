import { NextResponse, type NextRequest } from "next/server";
import { issueVisitorToken, verifyVisitorToken, VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE } from "@/lib/visitor-token";

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return value;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET must be set in production (at least 16 characters).");
  return "mirror-dev-session-secret-not-for-production";
}

/**
 * Issues the signed anonymous visitor cookie on first visit so results and
 * orders can be attributed without accounts. Runs on the Node.js runtime.
 */
export function proxy(request: NextRequest) {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  if (verifyVisitorToken(existing, secret())) return NextResponse.next();

  const { token } = issueVisitorToken(secret());
  const response = NextResponse.next();
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|assets/).*)"],
};
