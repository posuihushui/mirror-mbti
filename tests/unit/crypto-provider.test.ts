import { describe, expect, it, vi } from "vitest";
import type { OrderRow } from "@/db/schema";
import { createCryptoProvider, CryptoPayerError, type EvmClient, type SolanaClient } from "@/lib/payments/crypto";
import type { CryptoConfig } from "@/lib/payments/crypto/config";
import type { PaymentPayload } from "@/lib/payments/types";

vi.mock("@/lib/env", () => ({ env: () => ({}) }));

const evmReceiver = "0x2222222222222222222222222222222222222222" as const;
const payer = "0x1111111111111111111111111111111111111111";
const usdc = { symbol: "USDC" as const, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 };
const solReceiver = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const solUsdc = { symbol: "USDC" as const, address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };

const config: CryptoConfig = {
  evm: { receiver: evmReceiver, rpcUrl: "https://eth.example", chainId: 1, confirmations: 3, tokens: [usdc], explorer: "https://etherscan.io/tx/" },
  solana: { receiver: solReceiver, rpcUrl: "https://sol.example", tokens: [solUsdc] },
};

function order(over: Partial<OrderRow>): OrderRow {
  return {
    id: "M20260914000000000000000000ABCD", visitorId: "v", resultId: "r", amountFen: 100, currency: "USD", provider: "crypto", channel: "solana", status: "created",
    providerTxnId: null, prepayPayload: null, paidAt: null, payerAddress: null, paymentReference: null, startBlock: null,
    expiresAt: new Date("2026-09-14T00:30:00Z"), updatedAt: new Date(), createdAt: new Date("2026-09-14T00:00:00Z"), ...over,
  };
}

function fakeEvm(over: Partial<EvmClient> = {}): EvmClient {
  return { getBlockNumber: vi.fn(async () => BigInt(20_000_000)), transferLogs: vi.fn(async () => []), verifyMessage: vi.fn(async () => true), ...over };
}

describe("crypto provider · Solana", () => {
  it("creates one Solana Pay request per token sharing a fresh reference", async () => {
    const provider = createCryptoProvider({ config, evm: fakeEvm(), solana: { signaturesFor: vi.fn(), transaction: vi.fn() } });
    const payload = await provider.createPayment(order({}), { channel: "solana", network: "solana", clientIp: "", userAgent: null, description: "", notifyUrl: "", returnUrl: "" });
    expect(payload.kind).toBe("solana");
    if (payload.kind !== "solana") return;
    expect(payload.amount).toBe("1");
    expect(payload.reference).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(payload.tokens[0].url).toContain(`reference=${payload.reference}`);
    expect(payload.tokens[0].qrSvg).toContain("<svg");
  });

  it("returns a claimable candidate only for successful transfers of at least the price", async () => {
    const tx = (amount: string) => ({ meta: { err: null, preTokenBalances: [], postTokenBalances: [{ accountIndex: 1, mint: solUsdc.address, owner: solReceiver, uiTokenAmount: { amount, decimals: 6 } }] } });
    const solana: SolanaClient = {
      signaturesFor: vi.fn(async () => [{ signature: "failed", err: { InstructionError: [] } }, { signature: "short", err: null }, { signature: "good", err: null }]),
      transaction: vi.fn(async (sig: string) => (sig === "short" ? tx("990000") : tx("1000000"))),
    };
    const provider = createCryptoProvider({ config, evm: fakeEvm(), solana });
    const result = await provider.queryPayment(order({ paymentReference: "ref" }));
    expect(result.status).toBe("paid");
    expect(result.candidates?.map((c) => c.eventId)).toEqual(["solana:good"]);
    expect(solana.transaction).not.toHaveBeenCalledWith("failed");
  });
});

describe("crypto provider · Ethereum", () => {
  const ethPayload = { kind: "ethereum", chainId: 1, recipient: evmReceiver, amount: "1", tokens: [usdc], challenge: "sign me", payer: null, explorer: "", startBlock: 19_990_000 } satisfies PaymentPayload;

  it("stays pending until a payer is confirmed, and respects confirmations", async () => {
    const evm = fakeEvm({ getBlockNumber: vi.fn(async () => BigInt(19_990_001)) });
    const provider = createCryptoProvider({ config, evm, solana: { signaturesFor: vi.fn(), transaction: vi.fn() } });
    expect((await provider.queryPayment(order({ channel: "ethereum", startBlock: 19_990_000 }))).status).toBe("pending");
    // latest − (confirmations − 1) is below the start block, so no logs are read yet
    expect((await provider.queryPayment(order({ channel: "ethereum", startBlock: 19_990_000, payerAddress: payer }))).status).toBe("pending");
    expect(evm.transferLogs).not.toHaveBeenCalled();
  });

  it("scans in chunks and turns the payer's transfers into per-log candidates", async () => {
    const transferLogs = vi.fn(async ({ fromBlock }: { fromBlock: bigint }) =>
      fromBlock === BigInt(19_990_000)
        ? [{ address: usdc.address, transactionHash: "0xabc", logIndex: 7, blockNumber: BigInt(19_990_010), args: { from: payer, to: evmReceiver, value: BigInt(1_000_000) } }]
        : [],
    );
    const evm = fakeEvm({ transferLogs });
    const provider = createCryptoProvider({ config, evm, solana: { signaturesFor: vi.fn(), transaction: vi.fn() } });
    const result = await provider.queryPayment(order({ channel: "ethereum", startBlock: 19_990_000, payerAddress: payer }));
    expect(transferLogs).toHaveBeenCalledTimes(2);
    expect(result.candidates).toEqual([expect.objectContaining({ eventId: "ethereum:1:0xabc:7", txnId: "0xabc" })]);
  });

  it("verifies the signed challenge and rejects bad signatures or non-Ethereum orders", async () => {
    const verifyMessage = vi.fn(async ({ signature }: { signature: string }) => signature === "0x01");
    const provider = createCryptoProvider({ config, evm: fakeEvm({ verifyMessage }), solana: { signaturesFor: vi.fn(), transaction: vi.fn() } });
    const eth = order({ channel: "ethereum", prepayPayload: ethPayload });
    await expect(provider.verifyPayer(eth, payer.toUpperCase().replace("0X", "0x"), "0x01")).resolves.toBe(payer);
    expect(verifyMessage).toHaveBeenCalledWith(expect.objectContaining({ message: "sign me" }));
    await expect(provider.verifyPayer(eth, payer, "0x02")).rejects.toBeInstanceOf(CryptoPayerError);
    await expect(provider.verifyPayer(eth, "not-an-address", "0x01")).rejects.toBeInstanceOf(CryptoPayerError);
    await expect(provider.verifyPayer(order({ channel: "solana" }), payer, "0x01")).rejects.toMatchObject({ code: "NOT_ETHEREUM" });
  });
});
