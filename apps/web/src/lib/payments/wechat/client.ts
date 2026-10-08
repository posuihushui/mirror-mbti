import "server-only";
import { buildAuthorization, decryptAesGcm, nonce, requestMessage, responseMessage, rsaSha256Sign, rsaSha256Verify } from "./crypto";
import type { WeChatPayConfig } from "./config";

export const WECHAT_PAY_ORIGIN = "https://api.mch.weixin.qq.com";

export class WeChatPayError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type PlatformCert = { serial: string; publicKey: string; expiresAt: number };
const certCache = globalThis as unknown as { __wxpayCerts?: Map<string, PlatformCert> };

export class WeChatPayClient {
  constructor(private cfg: WeChatPayConfig) {}

  /** Signed JSON request to the APIv3 gateway. */
  async request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonceStr = nonce();
    const payload = body === undefined ? "" : JSON.stringify(body);
    const signature = rsaSha256Sign(requestMessage(method, path, timestamp, nonceStr, payload), this.cfg.privateKey);
    const res = await fetch(`${WECHAT_PAY_ORIGIN}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "mirror-mbti/1.0 (+nextjs)",
        Authorization: buildAuthorization({ mchid: this.cfg.mchid, serialNo: this.cfg.serialNo, nonceStr, timestamp, signature }),
        ...(this.cfg.publicKeyId ? { "Wechatpay-Serial": this.cfg.publicKeyId } : {}),
      },
      body: payload || undefined,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      let code = "WECHAT_ERROR";
      let message = text;
      try {
        const j = JSON.parse(text) as { code?: string; message?: string };
        code = j.code ?? code;
        message = j.message ?? message;
      } catch {
        /* non-JSON error body */
      }
      throw new WeChatPayError(res.status, code, message);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  /** Resolves the public key for a `Wechatpay-Serial`: configured public key or a cached/fetched platform certificate. */
  async publicKeyForSerial(serial: string): Promise<string | null> {
    if (this.cfg.publicKeyId && serial === this.cfg.publicKeyId && this.cfg.publicKey) return this.cfg.publicKey;
    const cached = certCache.__wxpayCerts?.get(serial);
    if (cached && cached.expiresAt > Date.now()) return cached.publicKey;
    await this.refreshPlatformCerts();
    return certCache.__wxpayCerts?.get(serial)?.publicKey ?? null;
  }

  private async refreshPlatformCerts() {
    type CertList = { data: Array<{ serial_no: string; expire_time: string; encrypt_certificate: { nonce: string; associated_data: string; ciphertext: string } }> };
    const list = await this.request<CertList>("GET", "/v3/certificates");
    const map = (certCache.__wxpayCerts ??= new Map());
    for (const item of list.data) {
      const pemCert = decryptAesGcm({
        apiv3Key: this.cfg.apiv3Key,
        nonce: item.encrypt_certificate.nonce,
        associatedData: item.encrypt_certificate.associated_data,
        ciphertext: item.encrypt_certificate.ciphertext,
      });
      const { createPublicKey } = await import("node:crypto");
      const publicKey = createPublicKey(pemCert).export({ type: "spki", format: "pem" }).toString();
      map.set(item.serial_no, { serial: item.serial_no, publicKey, expiresAt: Date.parse(item.expire_time) });
    }
  }

  /** Verifies a callback (or response) signature using the headers WeChat sends. */
  async verifySignature(headers: { timestamp: string; nonce: string; serial: string; signature: string }, body: string): Promise<boolean> {
    const skew = Math.abs(Date.now() / 1000 - Number(headers.timestamp));
    if (!Number.isFinite(skew) || skew > 5 * 60) return false;
    const key = await this.publicKeyForSerial(headers.serial);
    if (!key) return false;
    return rsaSha256Verify(responseMessage(headers.timestamp, headers.nonce, body), headers.signature, key);
  }

  decryptResource(resource: { nonce: string; associated_data?: string; ciphertext: string }): string {
    return decryptAesGcm({ apiv3Key: this.cfg.apiv3Key, nonce: resource.nonce, associatedData: resource.associated_data ?? "", ciphertext: resource.ciphertext });
  }
}
