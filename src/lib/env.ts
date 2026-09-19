import "server-only";
import { z } from "zod";
import type { Locale } from "@/lib/i18n/locale";
import { formatPriceFen } from "@/lib/site";

const isProd = process.env.NODE_ENV === "production";
const DEV_SECRET = "mirror-dev-session-secret-not-for-production";

const schema = z.object({
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).optional(),
  SESSION_SECRET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "wechat"]).default("mock"),
  PRICE_FEN: z.coerce.number().int().positive().default(690),
  // English site: card via Waffo Pancake (`waffo`), USDT/USDC on Ethereum or Solana (`crypto`), or `mock`.
  EN_PAYMENT_PROVIDER: z.enum(["mock", "crypto", "waffo"]).default("mock"),
  PRICE_USD_CENTS: z.coerce.number().int().positive().default(690),
  CRYPTO_EVM_RECEIVER: z.string().optional(),
  CRYPTO_SOLANA_RECEIVER: z.string().optional(),
  ETHEREUM_RPC_URL: z.string().url().optional(),
  // 1 = Ethereum mainnet. A testnet (e.g. 11155111 Sepolia) also needs the token address overrides below.
  ETHEREUM_CHAIN_ID: z.coerce.number().int().positive().default(1),
  ETHEREUM_CONFIRMATIONS: z.coerce.number().int().min(1).default(3),
  ETHEREUM_USDC_ADDRESS: z.string().optional(),
  ETHEREUM_USDT_ADDRESS: z.string().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
  SOLANA_USDC_MINT: z.string().optional(),
  SOLANA_USDT_MINT: z.string().optional(),
  WAFFO_MERCHANT_ID: z.string().optional(),
  WAFFO_PRIVATE_KEY: z.string().optional(),
  WAFFO_STORE_ID: z.string().optional(),
  WAFFO_PRODUCT_ID: z.string().optional(),
  WAFFO_WEBHOOK_PUBLIC_KEY: z.string().optional(),
  WAFFO_API_BASE: z.string().url().default("https://api.waffo.ai"),
  WECHAT_PAY_MCHID: z.string().optional(),
  WECHAT_PAY_APPID: z.string().optional(),
  WECHAT_PAY_SERIAL_NO: z.string().optional(),
  WECHAT_PAY_PRIVATE_KEY: z.string().optional(),
  WECHAT_PAY_APIV3_KEY: z.string().optional(),
  WECHAT_PAY_PUBLIC_KEY_ID: z.string().optional(),
  WECHAT_PAY_PUBLIC_KEY: z.string().optional(),
  WECHAT_PAY_NOTIFY_URL: z.string().optional(),
  WECHAT_SHARE_ENABLED: z.enum(["true", "false"]).default("false"),
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

/** Chinese pages use WeChat Pay (or mock); English pages use their own provider. */
export function paymentModeFor(locale: Locale) {
  return locale === "en" ? env().EN_PAYMENT_PROVIDER : env().PAYMENT_PROVIDER;
}

/** Report price in the locale's minor unit: fen for `zh` (CNY), cents for `en` (USD). */
export function priceMinorFor(locale: Locale) {
  return locale === "en" ? env().PRICE_USD_CENTS : env().PRICE_FEN;
}

export function priceLabelFor(locale: Locale) {
  return formatPriceFen(priceMinorFor(locale));
}
