import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

export const ADMIN_COOKIE = "mirror_admin";
export const SESSION_SECONDS = 8 * 60 * 60;
const derive = promisify(scrypt);
export type AdminConfig = { username: string; passwordHash: string; secret: string; origin: string };

export function adminConfig(): AdminConfig {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  const secret = process.env.ADMIN_SESSION_SECRET;
  const url = process.env.ADMIN_URL;
  if (!username || !passwordHash || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash) || !secret || secret.length < 32 || !url) throw new Error("ADMIN_NOT_CONFIGURED");
  const origin = new URL(url).origin;
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https://") && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) throw new Error("ADMIN_HTTPS_REQUIRED");
  return { username, passwordHash, secret, origin };
}
function equal(a: string, b: string) { return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest()); }
export async function verifyCredentials(username: string, password: string, config: AdminConfig) {
  const [, salt, expected] = config.passwordHash.split(":");
  if (password.length > 256 || username.length > 128) return false;
  const derived = await derive(password, salt, 64) as Buffer;
  return timingSafeEqual(derived, Buffer.from(expected, "hex")) && equal(username, config.username);
}
function mac(payload: string, config: AdminConfig) {
  return createHmac("sha256", config.secret).update(`${config.username}:${config.passwordHash}:${payload}`).digest("base64url");
}
export function issueAdminSession(config: AdminConfig, now = Date.now()) {
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${mac(payload, config)}`;
}
export function validAdminSession(token: string | undefined, config: AdminConfig, now = Date.now()) {
  if (!token || token.length > 200) return false;
  const match = /^(\d{10})\.([A-Za-z0-9_-]{32})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  return expires > now / 1000 && expires <= now / 1000 + SESSION_SECONDS && equal(match[3], mac(`${match[1]}.${match[2]}`, config));
}
export function sameAdminOrigin(req: Request, config: AdminConfig) {
  return req.headers.get("origin") === config.origin && req.headers.get("sec-fetch-site") !== "cross-site";
}
