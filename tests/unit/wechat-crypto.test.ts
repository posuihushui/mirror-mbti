import { createCipheriv, generateKeyPairSync, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildAuthorization, decryptAesGcm, jsapiPayParams, requestMessage, responseMessage, rsaSha256Sign, rsaSha256Verify } from "@/lib/payments/wechat/crypto";
import { mapTradeState } from "@/lib/payments/wechat/index";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const pubPem = publicKey.export({ type: "spki", format: "pem" }).toString();

describe("WeChat Pay APIv3 crypto", () => {
  it("signs request messages that verify with the public key", () => {
    const msg = requestMessage("POST", "/v3/pay/transactions/jsapi", "1700000000", "nonce", '{"a":1}');
    expect(msg).toBe('POST\n/v3/pay/transactions/jsapi\n1700000000\nnonce\n{"a":1}\n');
    const sig = rsaSha256Sign(msg, privPem);
    expect(rsaSha256Verify(msg, sig, pubPem)).toBe(true);
    expect(rsaSha256Verify(msg + "x", sig, pubPem)).toBe(false);
  });

  it("verifies callback messages in WeChat's timestamp/nonce/body layout", () => {
    const body = '{"id":"evt"}';
    const msg = responseMessage("1700000000", "n0nce", body);
    expect(msg).toBe('1700000000\nn0nce\n{"id":"evt"}\n');
    expect(rsaSha256Verify(msg, rsaSha256Sign(msg, privPem), pubPem)).toBe(true);
  });

  it("builds the Authorization header", () => {
    const h = buildAuthorization({ mchid: "1900000109", serialNo: "ABC", nonceStr: "n", timestamp: "1", signature: "s" });
    expect(h).toBe('WECHATPAY2-SHA256-RSA2048 mchid="1900000109",nonce_str="n",signature="s",timestamp="1",serial_no="ABC"');
  });

  it("decrypts AES-256-GCM resources produced with the APIv3 key", () => {
    const apiv3Key = randomBytes(16).toString("hex");
    const nonce = randomBytes(6).toString("hex");
    const aad = "transaction";
    const plain = JSON.stringify({ out_trade_no: "M1", trade_state: "SUCCESS" });
    const cipher = createCipheriv("aes-256-gcm", Buffer.from(apiv3Key), Buffer.from(nonce));
    cipher.setAAD(Buffer.from(aad));
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final(), cipher.getAuthTag()]);
    const out = decryptAesGcm({ apiv3Key, nonce, associatedData: aad, ciphertext: enc.toString("base64") });
    expect(JSON.parse(out).trade_state).toBe("SUCCESS");
    expect(() => decryptAesGcm({ apiv3Key, nonce, associatedData: "wrong", ciphertext: enc.toString("base64") })).toThrow();
  });

  it("produces JSAPI bridge params whose paySign verifies", () => {
    const p = jsapiPayParams("wx1234567890", "wx20260910abc", privPem, 1_700_000_000_000);
    expect(p.timeStamp).toBe("1700000000");
    expect(p.package).toBe("prepay_id=wx20260910abc");
    expect(p.signType).toBe("RSA");
    expect(rsaSha256Verify(`${p.appId}\n${p.timeStamp}\n${p.nonceStr}\n${p.package}\n`, p.paySign, pubPem)).toBe(true);
  });

  it("maps trade states", () => {
    expect(mapTradeState({ trade_state: "SUCCESS", out_trade_no: "M", transaction_id: "t", success_time: "2026-09-10T10:00:00+08:00" })).toMatchObject({ status: "paid", txnId: "t" });
    expect(mapTradeState({ trade_state: "NOTPAY", out_trade_no: "M" }).status).toBe("pending");
    expect(mapTradeState({ trade_state: "USERPAYING", out_trade_no: "M" }).status).toBe("pending");
    expect(mapTradeState({ trade_state: "CLOSED", out_trade_no: "M" }).status).toBe("closed");
  });
});
