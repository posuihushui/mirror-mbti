import { connection, NextResponse } from "next/server";
import { href, isLocale } from "@/lib/i18n/locale";
import { activeInviteCode, INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "@/lib/invite-codes";
import { shareNoStore } from "@/lib/share-request";

/**
 * An invite link (`/i/K7MQ2X`): a reader of the full report invites someone to take the test.
 * The code is kept in a cookie for 30 days and read only when an order is priced, so the invite
 * price shows after the test and never before it. The link then opens the home page; an unknown
 * or disabled code does the same without the cookie. It never pairs anyone.
 */
export async function GET(request: Request, { params }: { params: Promise<{ lang: string; code: string }> }) {
  await connection();
  const { lang, code } = await params;
  const locale = isLocale(lang) ? lang : "en";
  const response = NextResponse.redirect(new URL(href(locale, "/"), request.url), { status: 303, headers: shareNoStore });
  const invite = await activeInviteCode(code);
  if (invite) {
    response.cookies.set({
      name: INVITE_COOKIE,
      value: invite.code,
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: INVITE_COOKIE_MAX_AGE,
    });
  }
  return response;
}
