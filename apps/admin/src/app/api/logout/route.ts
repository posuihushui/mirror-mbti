import { connection, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ADMIN_COOKIE, sameAdminOrigin } from "@/lib/auth-policy";
export async function POST(req: Request) {
  await connection();
  const config = await requireAdmin();
  if (!sameAdminOrigin(req, config)) return new Response(null, { status: 403 });
  const res = NextResponse.redirect(new URL("/login", config.origin), 303);
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
