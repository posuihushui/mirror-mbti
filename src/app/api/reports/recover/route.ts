import { connection, NextResponse } from "next/server";
import { appUrl, sessionSecret } from "@/lib/env";
import { consumeRecoveryAttempt, visitorForRecoveryOrder } from "@/lib/recovery";
import { isRecoverySameOrigin, readRecoveryBody, recoveryBucketKey, recoveryOrderId } from "@/lib/recovery-policy";
import { signVisitorToken, VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE } from "@/lib/visitor-token";

function failure(status: number, code: string, message: string, headers?: Record<string, string>) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status, headers: { "cache-control": "no-store", ...headers } });
}

function invalidOrder(status = 400) {
  return failure(status, "INVALID_ORDER", "未能找到对应记录，请检查完整订单号后重试。");
}

/** Order numbers are recovery credentials: accept them only in a same-origin POST body. */
export async function POST(request: Request) {
  await connection();
  const canonicalUrl = appUrl();
  if (!isRecoverySameOrigin(request, canonicalUrl)) return failure(403, "INVALID_ORIGIN", "请在本站页面中找回测试记录。");

  try {
    const secret = sessionSecret();
    const attempt = await consumeRecoveryAttempt(recoveryBucketKey(request, secret));
    if (!attempt.allowed) {
      return failure(429, "RECOVERY_RATE_LIMITED", "尝试次数较多，请 15 分钟后再试。", { "retry-after": String(attempt.retryAfter) });
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
    return failure(503, "RECOVERY_UNAVAILABLE", "暂时无法找回记录，请稍后重试。");
  }
}
