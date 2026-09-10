import { createDecipheriv, createSign, createVerify, randomBytes } from "node:crypto";

/** Pure crypto helpers for WeChat Pay APIv3. Kept free of env/DB access so they can be unit-tested with fixtures. */

export function nonce(length = 32): string {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

export function rsaSha256Sign(message: string, privateKeyPem: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(message, "utf8");
  return signer.sign(privateKeyPem, "base64");
}

export function rsaSha256Verify(message: string, signatureBase64: string, publicKeyPem: string): boolean {
  const verifier = createVerify("RSA-SHA256");
  verifier.update(message, "utf8");
  try {
    return verifier.verify(publicKeyPem, signatureBase64, "base64");
  } catch {
    return false;
  }
}

/** Message signed on outgoing requests. */
export function requestMessage(method: string, pathWithQuery: string, timestamp: string, nonceStr: string, body: string): string {
  return `${method}\n${pathWithQuery}\n${timestamp}\n${nonceStr}\n${body}\n`;
}

/** Message WeChat signs on callbacks and responses. */
export function responseMessage(timestamp: string, nonceStr: string, body: string): string {
  return `${timestamp}\n${nonceStr}\n${body}\n`;
}

export function buildAuthorization(input: { mchid: string; serialNo: string; nonceStr: string; timestamp: string; signature: string }): string {
  return `WECHATPAY2-SHA256-RSA2048 mchid="${input.mchid}",nonce_str="${input.nonceStr}",signature="${input.signature}",timestamp="${input.timestamp}",serial_no="${input.serialNo}"`;
}

/** AES-256-GCM decryption of `resource` blocks (callbacks, platform certificates). */
export function decryptAesGcm(input: { apiv3Key: string; nonce: string; associatedData: string; ciphertext: string }): string {
  const buf = Buffer.from(input.ciphertext, "base64");
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(input.apiv3Key, "utf8"), Buffer.from(input.nonce, "utf8"));
  decipher.setAuthTag(tag);
  decipher.setAAD(Buffer.from(input.associatedData, "utf8"));
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Parameters handed to `WeixinJSBridge.invoke("getBrandWCPayRequest")`. */
export function jsapiPayParams(appId: string, prepayId: string, privateKeyPem: string, now = Date.now()) {
  const timeStamp = String(Math.floor(now / 1000));
  const nonceStr = nonce();
  const pkg = `prepay_id=${prepayId}`;
  const paySign = rsaSha256Sign(`${appId}\n${timeStamp}\n${nonceStr}\n${pkg}\n`, privateKeyPem);
  return { appId, timeStamp, nonceStr, package: pkg, signType: "RSA" as const, paySign };
}
