import "server-only";
import { env } from "@/lib/env";

export type WeChatPayConfig = {
  mchid: string;
  appid: string;
  serialNo: string;
  privateKey: string;
  apiv3Key: string;
  publicKeyId: string | null;
  publicKey: string | null;
};

function pem(value: string | undefined): string | null {
  if (!value) return null;
  return value.includes("\\n") ? value.replace(/\\n/g, "\n") : value;
}

/** Reads and validates the merchant configuration; throws a clear error when incomplete. */
export function weChatPayConfig(): WeChatPayConfig {
  const e = env();
  const missing = (["WECHAT_PAY_MCHID", "WECHAT_PAY_APPID", "WECHAT_PAY_SERIAL_NO", "WECHAT_PAY_PRIVATE_KEY", "WECHAT_PAY_APIV3_KEY"] as const).filter((k) => !e[k]);
  if (missing.length) throw new Error(`WeChat Pay is enabled but missing env: ${missing.join(", ")}`);
  if (e.WECHAT_PAY_APIV3_KEY!.length !== 32) throw new Error("WECHAT_PAY_APIV3_KEY must be exactly 32 characters");
  return {
    mchid: e.WECHAT_PAY_MCHID!,
    appid: e.WECHAT_PAY_APPID!,
    serialNo: e.WECHAT_PAY_SERIAL_NO!,
    privateKey: pem(e.WECHAT_PAY_PRIVATE_KEY)!,
    apiv3Key: e.WECHAT_PAY_APIV3_KEY!,
    publicKeyId: e.WECHAT_PAY_PUBLIC_KEY_ID || null,
    publicKey: pem(e.WECHAT_PAY_PUBLIC_KEY),
  };
}
