import "server-only";
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";
const DEV_SECRET = "mirror-dev-session-secret-not-for-production";

const schema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "wechat"]).default("mock"),
  PRICE_FEN: z.coerce.number().int().positive().default(690),
  WECHAT_PAY_MCHID: z.string().optional(),
  WECHAT_PAY_APPID: z.string().optional(),
  WECHAT_PAY_SERIAL_NO: z.string().optional(),
  WECHAT_PAY_PRIVATE_KEY: z.string().optional(),
  WECHAT_PAY_APIV3_KEY: z.string().optional(),
  WECHAT_PAY_PUBLIC_KEY_ID: z.string().optional(),
  WECHAT_PAY_PUBLIC_KEY: z.string().optional(),
  WECHAT_PAY_NOTIFY_URL: z.string().optional(),
  WECHAT_MP_APPID: z.string().optional(),
  WECHAT_MP_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

/** Parsed environment. Safe to call at build time; secrets are validated lazily by `sessionSecret()`. */
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  cached = parsed.data;
  return cached;
}

/** HMAC secret for visitor cookies and OAuth state. Required in production; a fixed dev value otherwise. */
export function sessionSecret(): string {
  const value = env().SESSION_SECRET;
  if (value && value.length >= 16) return value;
  if (isProd) throw new Error("SESSION_SECRET must be set in production (at least 16 characters).");
  return DEV_SECRET;
}

export function appUrl(): string {
  return env().APP_URL.replace(/\/$/, "");
}

export function paymentMode() {
  return env().PAYMENT_PROVIDER;
}

export function priceFen() {
  return env().PRICE_FEN;
}
