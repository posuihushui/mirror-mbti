import { connection, NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { authorizeUrl, mpConfigured, safeReturnPath } from "@/lib/payments/wechat/oauth";

/** Starts a silent `snsapi_base` authorization so JSAPI payments can obtain the visitor's openid. */
export async function GET(req: Request) {
  await connection();
  if (!mpConfigured()) return fail(404, "NOT_CONFIGURED", "未配置微信公众号。");
  const url = new URL(req.url);
  const returnPath = safeReturnPath(url.searchParams.get("return"));
  return NextResponse.redirect(authorizeUrl(returnPath), 302);
}
