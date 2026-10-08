import { connection } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { appUrl } from "@/lib/env";
import { jsConfig, mpConfigured } from "@/lib/payments/wechat/oauth";

/** JS-SDK signature for share cards. Only signs URLs on this site's own origin. */
export async function GET(req: Request) {
  await connection();
  if (!mpConfigured()) return fail(404, "NOT_CONFIGURED", "未配置微信公众号。");
  const url = new URL(req.url);
  const parsed = z.string().url().safeParse(url.searchParams.get("url"));
  if (!parsed.success || !parsed.data.startsWith(appUrl())) return fail(400, "BAD_URL", "url 必须是本站页面地址。");
  try {
    return ok(await jsConfig(parsed.data.split("#")[0]), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("[wechat jsconfig]", e);
    return fail(502, "JSCONFIG_FAILED", "获取微信签名失败。");
  }
}
