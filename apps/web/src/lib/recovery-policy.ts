import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { isValidOrderId } from "@/lib/ids";

export const RECOVERY_ATTEMPT_LIMIT = 10;
export const RECOVERY_WINDOW_SECONDS = 15 * 60;
export const RECOVERY_BODY_MAX_BYTES = 1024;

export function recoveryOrderId(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("orderId" in body) || typeof body.orderId !== "string") return null;
  const id = body.orderId.trim().toUpperCase();
  return isValidOrderId(id) ? id : null;
}

/** A canonical configured origin prevents host-header based login CSRF. */
export function isRecoverySameOrigin(request: Request, canonicalUrl: string): boolean {
  return request.headers.get("origin") === new URL(canonicalUrl).origin && request.headers.get("sec-fetch-site") !== "cross-site";
}

export function recoveryBucketKey(request: Request, secret: string): string {
  // Use the last proxy-appended address so prepending a forged X-Forwarded-For
  // cannot bypass the throttle. The ingress must append/overwrite this header.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const address = forwarded || request.headers.get("x-real-ip")?.trim() || "";
  const version = isIP(address);
  const normalized = version === 6 ? new URL(`http://[${address}]/`).hostname : version === 4 ? address : "unknown";
  return createHmac("sha256", secret).update(`report-recovery:${normalized}`).digest("hex");
}

/** Bound request-body memory even when the caller omits Content-Length. */
export async function readRecoveryBody(request: Request): Promise<unknown> {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > RECOVERY_BODY_MAX_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
