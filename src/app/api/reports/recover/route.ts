import { connection, NextResponse } from "next/server";
import { appUrl, sessionSecret } from "@/lib/env";
import { requestLocale } from "@/lib/i18n/request";
import { consumeRecoveryAttempt, visitorForRecoveryOrder } from "@/lib/recovery";
import { isRecoverySameOrigin, readRecoveryBody, recoveryBucketKey, recoveryOrderId } from "@/lib/recovery-policy";
import { signVisitorToken, VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE } from "@/lib/visitor-token";

const messages = {
  zh: {
    invalidOrder: "未能找到对应记录，请检查完整订单号后重试。",
    invalidOrigin: "请在本站页面中找回测试记录。",
    rateLimited: "尝试次数较多，请 15 分钟后再试。",
    unavailable: "暂时无法找回记录，请稍后重试。",
  },
  en: {
    invalidOrder: "No matching record was found. Please check the full order number and try again.",
    invalidOrigin: "Please recover your tests from a page on this site.",
    rateLimited: "Too many attempts. Please try again in 15 minutes.",
    unavailable: "Couldn’t recover records right now. Please try again later.",
  },
};

function failure(status: number, code: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status, headers: { "cache-control": "no-store", ...headers } });
}

/** Order numbers are recovery credentials: accept them only in a same-origin POST body. */
export async function POST(request: Request) {
  await connection();
  const t = messages[requestLocale(request)];
  const invalidOrder = (status = 400) => failure(status, "INVALID_ORDER", t.invalidOrder);
  const canonicalUrl = appUrl();
  if (!isRecoverySameOrigin(request, canonicalUrl)) return failure(403, "INVALID_ORIGIN", t.invalidOrigin);

  try {
    const secret = sessionSecret();
    const attempt = await consumeRecoveryAttempt(recoveryBucketKey(request, secret));
    if (!attempt.allowed) {
      return failure(429, "RECOVERY_RATE_LIMITED", t.rateLimited, { "retry-after": String(attempt.retryAfter) });
    }

    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return invalidOrder();
    const orderId = recoveryOrderId(await readRecoveryBody(request));
    if (!orderId) return invalidOrder();
    const visitorId = await visitorForRecoveryOrder(orderId);
    if (!visitorId) return invalidOrder(404);

    const response = NextResponse.json({ ok: true, data: { recovered: true } }, { headers: { "cache-control": "no-store" } });
    response.cookies.set({
      name: VISITOR_COOKIE,
      value: signVisitorToken(visitorId, secret),
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(canonicalUrl).protocol === "https:",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    // Do not log order numbers, database parameters, or visitor identifiers.
    console.error("[recovery] request failed", error instanceof Error ? error.name : "UnknownError");
    return failure(503, "RECOVERY_UNAVAILABLE", t.unavailable);
  }
}
