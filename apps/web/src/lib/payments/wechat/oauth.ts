import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { appUrl, env, sessionSecret } from "@/lib/env";
import { nonce } from "./crypto";

export function mpConfigured() {
  const e = env();
  return Boolean(e.WECHAT_MP_APPID && e.WECHAT_MP_SECRET);
}

/** Only same-site paths may be used as a post-OAuth return target. */
export function safeReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/";
  return value;
}

function stateSecret() {
  return sessionSecret();
}

export function signState(returnPath: string): string {
  const payload = Buffer.from(JSON.stringify({ r: returnPath, t: Date.now() })).toString("base64url");
  const sig = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyState(state: string | null): string | null {
  if (!state) return null;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { r, t } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { r: string; t: number };
    if (Date.now() - t > 10 * 60 * 1000) return null;
    return safeReturnPath(r);
  } catch {
    return null;
  }
}

export function authorizeUrl(returnPath: string): string {
  const e = env();
  const redirect = `${appUrl()}/api/wechat/oauth/callback`;
  const params = new URLSearchParams({
    appid: e.WECHAT_MP_APPID!,
    redirect_uri: redirect,
    response_type: "code",
    scope: "snsapi_base",
    state: signState(returnPath),
  });
  return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
}

export async function exchangeCodeForOpenid(code: string): Promise<string> {
  const e = env();
  const params = new URLSearchParams({ appid: e.WECHAT_MP_APPID!, secret: e.WECHAT_MP_SECRET!, code, grant_type: "authorization_code" });
  const res = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${params}`, { cache: "no-store" });
  const json = (await res.json()) as { openid?: string; errcode?: number; errmsg?: string };
  if (!json.openid) throw new Error(`WeChat OAuth failed: ${json.errcode ?? ""} ${json.errmsg ?? ""}`);
  return json.openid;
}

type Cached = { value: string; expiresAt: number };
const cache = globalThis as unknown as { __wxToken?: Cached; __wxTicket?: Cached };

async function accessToken(): Promise<string> {
  if (cache.__wxToken && cache.__wxToken.expiresAt > Date.now()) return cache.__wxToken.value;
  const e = env();
  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${e.WECHAT_MP_APPID}&secret=${e.WECHAT_MP_SECRET}`, { cache: "no-store" });
  const json = (await res.json()) as { access_token?: string; expires_in?: number; errmsg?: string };
  if (!json.access_token) throw new Error(`WeChat token failed: ${json.errmsg ?? "unknown"}`);
  cache.__wxToken = { value: json.access_token, expiresAt: Date.now() + ((json.expires_in ?? 7200) - 300) * 1000 };
  return json.access_token;
}

async function jsapiTicket(): Promise<string> {
  if (cache.__wxTicket && cache.__wxTicket.expiresAt > Date.now()) return cache.__wxTicket.value;
  const token = await accessToken();
  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`, { cache: "no-store" });
  const json = (await res.json()) as { ticket?: string; expires_in?: number; errmsg?: string };
  if (!json.ticket) throw new Error(`WeChat ticket failed: ${json.errmsg ?? "unknown"}`);
  cache.__wxTicket = { value: json.ticket, expiresAt: Date.now() + ((json.expires_in ?? 7200) - 300) * 1000 };
  return json.ticket;
}

/** JS-SDK `wx.config` signature for the current page URL (without the hash). */
export async function jsConfig(url: string) {
  const ticket = await jsapiTicket();
  const nonceStr = nonce(16);
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = createHash("sha1").update(raw).digest("hex");
  return { appId: env().WECHAT_MP_APPID!, timestamp, nonceStr, signature };
}
