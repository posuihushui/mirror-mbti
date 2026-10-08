import { describe, expect, it } from "vitest";
import { centsToDecimalString, centsToTokenUnits } from "@/lib/payments/crypto/amounts";
import { ethereumEventId, paymentChallenge, transferCandidates, type TransferLogLike } from "@/lib/payments/crypto/ethereum";
import { matchSolanaPayment, receivedTokenUnits, solanaPayUrl, type TokenBalanceLike } from "@/lib/payments/crypto/solana-pay";

describe("amounts", () => {
  it("converts cents to 6-decimal stablecoin units", () => {
    expect(centsToTokenUnits(100, 6)).toBe(BigInt(1_000_000));
    expect(centsToTokenUnits(199, 6)).toBe(BigInt(1_990_000));
    expect(centsToTokenUnits(100, 18)).toBe(BigInt(10) ** BigInt(18));
    expect(() => centsToTokenUnits(1.5, 6)).toThrow();
  });
  it("formats request amounts without trailing zeros", () => {
    expect(centsToDecimalString(100)).toBe("1");
    expect(centsToDecimalString(150)).toBe("1.5");
    expect(centsToDecimalString(199)).toBe("1.99");
    expect(centsToDecimalString(5)).toBe("0.05");
  });
});

describe("Solana Pay", () => {
  const recipient = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
  const usdc = { symbol: "USDC" as const, address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 };
  const usdt = { symbol: "USDT" as const, address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 };
  const balance = (accountIndex: number, mint: string, owner: string, amount: string): TokenBalanceLike => ({ accountIndex, mint, owner, uiTokenAmount: { amount, decimals: 6 } });

  it("builds a spec transfer request with percent-encoded parameters", () => {
    const url = solanaPayUrl({ recipient, amount: "1", splToken: usdc.address, reference: "ref111", label: "mirror", message: "Full report M1" });
    expect(url).toBe(`solana:${recipient}?amount=1&spl-token=${usdc.address}&reference=ref111&label=mirror&message=Full%20report%20M1`);
  });

  it("counts the recipient's balance increase, including a newly created token account", () => {
    const tx = { meta: { err: null, preTokenBalances: [balance(1, usdc.address, "payer", "5000000")], postTokenBalances: [balance(1, usdc.address, "payer", "4000000"), balance(2, usdc.address, recipient, "1000000")] } };
    expect(receivedTokenUnits(tx, recipient, usdc.address)).toBe(BigInt(1_000_000));
    expect(matchSolanaPayment(tx, recipient, [usdc, usdt], () => BigInt(1_000_000))).toEqual(usdc);
  });

  it("rejects failed transactions, wrong mints, other owners and underpayment", () => {
    const paid = { preTokenBalances: [balance(2, usdc.address, recipient, "3000000")], postTokenBalances: [balance(2, usdc.address, recipient, "4000000")] };
    const min = () => BigInt(1_000_000);
    expect(matchSolanaPayment({ meta: { err: { InstructionError: [0, "Custom"] }, ...paid } }, recipient, [usdc], min)).toBeNull();
    expect(matchSolanaPayment({ meta: { err: null, ...paid } }, recipient, [usdt], min)).toBeNull();
    expect(matchSolanaPayment({ meta: { err: null, ...paid } }, "someone-else", [usdc], min)).toBeNull();
    const short = { meta: { err: null, preTokenBalances: [], postTokenBalances: [balance(2, usdc.address, recipient, "999999")] } };
    expect(matchSolanaPayment(short, recipient, [usdc], min)).toBeNull();
    expect(matchSolanaPayment(null, recipient, [usdc], min)).toBeNull();
  });
});

describe("Ethereum matching", () => {
  const payer = "0x1111111111111111111111111111111111111111";
  const recipient = "0x2222222222222222222222222222222222222222";
  const usdc = { symbol: "USDC" as const, address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 };
  const usdt = { symbol: "USDT" as const, address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 };
  const log = (over: Partial<TransferLogLike> & { args?: TransferLogLike["args"] }): TransferLogLike => ({
    address: usdc.address.toLowerCase(),
    transactionHash: "0xaaa",
    logIndex: 0,
    blockNumber: BigInt(100),
    ...over,
    args: { from: payer.toUpperCase().replace("0X", "0x"), to: recipient, value: BigInt(1_000_000), ...over.args },
  });
  const opts = { payer, recipient, tokens: [usdc, usdt], minUnits: () => BigInt(1_000_000), startBlock: BigInt(90) };

  it("accepts transfers from the signed payer to the receiver, case-insensitively, oldest first", () => {
    const matches = transferCandidates([log({ transactionHash: "0xbbb", blockNumber: BigInt(101), address: usdt.address }), log({})], opts);
    expect(matches.map((m) => [m.log.transactionHash, m.token.symbol])).toEqual([["0xaaa", "USDC"], ["0xbbb", "USDT"]]);
  });

  it("ignores other senders, other receivers, unknown tokens, early blocks, pending logs and underpayment", () => {
    const rejected = [
      log({ args: { from: "0x3333333333333333333333333333333333333333" } }),
      log({ args: { to: "0x3333333333333333333333333333333333333333" } }),
      log({ address: "0x4444444444444444444444444444444444444444" }),
      log({ blockNumber: BigInt(89) }),
      log({ blockNumber: null }),
      log({ args: { value: BigInt(999_999) } }),
    ];
    expect(transferCandidates(rejected, opts)).toEqual([]);
  });

  it("signs a challenge that names the order and receiver and keys claims per log", () => {
    const challenge = paymentChallenge({ orderId: "M1", recipient, nonce: "abc", expiresAt: new Date("2026-09-14T00:30:00Z") });
    expect(challenge).toContain("Order: M1");
    expect(challenge).toContain(`Receiver: ${recipient}`);
    expect(challenge).toContain("does not move any funds");
    expect(ethereumEventId(1, "0xABC", 3)).toBe("ethereum:1:0xabc:3");
  });
});
