import { connection, NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { exchangeCodeForOpenid, mpConfigured, verifyState } from "@/lib/payments/wechat/oauth";
import { getVisitorId } from "@/lib/session";
import { setVisitorOpenid } from "@/lib/visitors";

export async function GET(req: Request) {
  await connection();
  if (!mpConfigured()) return fail(404, "NOT_CONFIGURED", "未配置微信公众号。");
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const returnPath = verifyState(url.searchParams.get("state"));
  if (!code || !returnPath) return fail(400, "BAD_STATE", "授权状态无效，请重试。");
  const visitorId = await getVisitorId();
  if (!visitorId) return fail(401, "NO_SESSION", "缺少访客会话。");
  try {
    const openid = await exchangeCodeForOpenid(code);
    await setVisitorOpenid(visitorId, openid);
  } catch (e) {
    console.error("[wechat oauth] exchange failed", e);
    return fail(502, "OAUTH_FAILED", "微信授权失败，请重试。");
  }
  return NextResponse.redirect(`${appUrl()}${returnPath}`, 302);
}
