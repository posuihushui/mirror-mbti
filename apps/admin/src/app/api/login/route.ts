import { connection, NextResponse } from "next/server";
import { adminConfig, ADMIN_COOKIE, issueAdminSession, SESSION_SECONDS, sameAdminOrigin, verifyCredentials } from "@/lib/auth-policy";
import { consumeLoginAttempt } from "@/lib/db";

export async function POST(req: Request) {
  await connection();
  let config;
  try { config = adminConfig(); } catch { return NextResponse.redirect(new URL("/login?error=config", req.url), 303); }
  if (!sameAdminOrigin(req, config)) return new Response(null, { status: 403 });
  // Read incrementally, including requests without Content-Length.
  if (!req.body) return new Response(null, { status: 400 });
  const reader = req.body.getReader(); let body = "";
  try {
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > 2048) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
    body = Buffer.concat(chunks).toString("utf8");
  } finally { reader.releaseLock(); }
  if (!req.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) return new Response(null, { status: 415 });
  try {
    const throttle = await consumeLoginAttempt();
    if (!throttle.allowed) return NextResponse.redirect(new URL("/login?error=rate", config.origin), { status: 303, headers: { "Retry-After": String(throttle.retryAfter) } });
    const form = new URLSearchParams(body);
    if (!await verifyCredentials(form.get("username") ?? "", form.get("password") ?? "", config)) return NextResponse.redirect(new URL("/login?error=credentials", config.origin), 303);
    const res = NextResponse.redirect(new URL("/", config.origin), 303);
    res.cookies.set(ADMIN_COOKIE, issueAdminSession(config), { httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "strict", path: "/", maxAge: SESSION_SECONDS });
    return res;
  } catch { return NextResponse.redirect(new URL("/login?error=unavailable", config.origin), 303); }
}
