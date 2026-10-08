import "server-only";
import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { address, createSolanaRpc, getBase58Decoder, signature as toSignature } from "@solana/kit";
import { createPublicClient, getAddress, http, isAddress, parseAbiItem, type Hex } from "viem";
import type { OrderRow } from "@/db/schema";
import type { CreatePaymentContext, CryptoNetwork, PaymentCandidate, PaymentPayload, PaymentProvider, QueryPaymentResult } from "../types";
import { centsToDecimalString, centsToTokenUnits } from "./amounts";
import { cryptoConfig, type CryptoConfig } from "./config";
import { ethereumEventId, paymentChallenge, transferCandidates, type TransferLogLike } from "./ethereum";
import { matchSolanaPayment, solanaPayUrl, type ParsedTransactionLike } from "./solana-pay";

const transferEvent = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");
/** Many RPC providers cap `eth_getLogs` ranges; 24 h of mainnet blocks fits in two chunks. */
const LOG_CHUNK = BigInt(5000);

/** The chain reads the provider needs, injectable so tests can use fakes. */
export type EvmClient = {
  getBlockNumber(): Promise<bigint>;
  transferLogs(args: { tokens: `0x${string}`[]; from: `0x${string}`; to: `0x${string}`; fromBlock: bigint; toBlock: bigint }): Promise<TransferLogLike[]>;
  verifyMessage(args: { address: `0x${string}`; message: string; signature: Hex }): Promise<boolean>;
};
export type SolanaClient = {
  signaturesFor(reference: string): Promise<{ signature: string; err: unknown }[]>;
  transaction(signature: string): Promise<ParsedTransactionLike>;
};

function viemClient(rpcUrl: string): EvmClient {
  const client = createPublicClient({ transport: http(rpcUrl) });
  return {
    getBlockNumber: () => client.getBlockNumber(),
    transferLogs: async ({ tokens, from, to, fromBlock, toBlock }) =>
      (await client.getLogs({ address: tokens, event: transferEvent, args: { from, to }, fromBlock, toBlock })) as unknown as TransferLogLike[],
    // Public-client verification also accepts smart-contract wallets (ERC-1271 / ERC-6492).
    verifyMessage: (args) => client.verifyMessage(args),
  };
}

function kitClient(rpcUrl: string): SolanaClient {
  const rpc = createSolanaRpc(rpcUrl);
  return {
    signaturesFor: async (reference) =>
      (await rpc.getSignaturesForAddress(address(reference), { limit: 20 }).send()).map((s) => ({ signature: s.signature, err: s.err })),
    transaction: async (sig) =>
      (await rpc.getTransaction(toSignature(sig), { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }).send()) as unknown as ParsedTransactionLike,
  };
}

export class CryptoPayerError extends Error {
  constructor(public code: "NOT_ETHEREUM" | "INVALID_SIGNATURE") {
    super(code);
  }
}

export type CryptoProvider = PaymentProvider & {
  readonly mode: "crypto";
  readonly networks: CryptoNetwork[];
  /** Checks that `payer` signed the order's challenge. Returns the lowercase payer address. */
  verifyPayer(order: OrderRow, payer: string, signature: string): Promise<string>;
};

/**
 * USDT/USDC on Solana (Solana Pay reference) and Ethereum (signed payer). No gateway: payments go
 * straight to the configured receivers and are read back from the chains. `queryPayment` returns
 * candidates; `refreshOrder` claims them so one transfer can only ever pay one order.
 */
export function createCryptoProvider(options: { config?: CryptoConfig; evm?: EvmClient; solana?: SolanaClient } = {}): CryptoProvider {
  const config = options.config ?? cryptoConfig();
  const evm = config.evm ? (options.evm ?? viemClient(config.evm.rpcUrl)) : null;
  const sol = config.solana ? (options.solana ?? kitClient(config.solana.rpcUrl)) : null;
  const networks: CryptoNetwork[] = [...(config.solana ? (["solana"] as const) : []), ...(config.evm ? (["ethereum"] as const) : [])];

  return {
    mode: "crypto",
    networks,

    async createPayment(order: OrderRow, ctx: CreatePaymentContext): Promise<PaymentPayload> {
      const amount = centsToDecimalString(order.amountFen);
      if (ctx.network === "solana" && config.solana) {
        const cfg = config.solana;
        const reference = getBase58Decoder().decode(new Uint8Array(randomBytes(32)));
        const tokens = await Promise.all(
          cfg.tokens.map(async (token) => {
            const url = solanaPayUrl({ recipient: cfg.receiver, amount, splToken: token.address, reference, label: "mirror", message: `Full report ${order.id}` });
            return { ...token, url, qrSvg: await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" }) };
          }),
        );
        return { kind: "solana", recipient: cfg.receiver, reference, amount, tokens };
      }
      if (ctx.network === "ethereum" && config.evm && evm) {
        const cfg = config.evm;
        // Transfers from the confirmed payer count from the order's creation, so paying before signing still works.
        const startBlock = Number(await evm.getBlockNumber());
        const challenge = paymentChallenge({ orderId: order.id, recipient: cfg.receiver, nonce: randomBytes(16).toString("hex"), expiresAt: order.expiresAt });
        return { kind: "ethereum", chainId: cfg.chainId, recipient: cfg.receiver, amount, tokens: cfg.tokens, challenge, payer: null, explorer: cfg.explorer, startBlock };
      }
      throw new Error(`Crypto network not available: ${ctx.network ?? "none"}`);
    },

    async queryPayment(order: OrderRow): Promise<QueryPaymentResult> {
      const minUnits = (token: { decimals: number }) => centsToTokenUnits(order.amountFen, token.decimals);
      let candidates: PaymentCandidate[] = [];
      if (order.channel === "solana" && sol && config.solana && order.paymentReference) {
        const cfg = config.solana;
        for (const found of await sol.signaturesFor(order.paymentReference)) {
          if (found.err) continue;
          const token = matchSolanaPayment(await sol.transaction(found.signature), cfg.receiver, cfg.tokens, minUnits);
          if (token) candidates.push({ eventId: `solana:${found.signature}`, txnId: found.signature, raw: { network: "solana", signature: found.signature, token: token.symbol, mint: token.address } });
        }
      } else if (order.channel === "ethereum" && evm && config.evm && order.payerAddress && order.startBlock !== null) {
        const cfg = config.evm;
        const start = BigInt(order.startBlock);
        const toBlock = (await evm.getBlockNumber()) - BigInt(cfg.confirmations - 1);
        const logs: TransferLogLike[] = [];
        for (let from = start; from <= toBlock; from += LOG_CHUNK) {
          const end = from + LOG_CHUNK - BigInt(1) < toBlock ? from + LOG_CHUNK - BigInt(1) : toBlock;
          logs.push(...(await evm.transferLogs({ tokens: cfg.tokens.map((t) => t.address as `0x${string}`), from: getAddress(order.payerAddress), to: cfg.receiver, fromBlock: from, toBlock: end })));
        }
        candidates = transferCandidates(logs, { payer: order.payerAddress, recipient: cfg.receiver, tokens: cfg.tokens, minUnits, startBlock: start }).map(({ log, token }) => ({
          eventId: ethereumEventId(cfg.chainId, log.transactionHash, log.logIndex),
          txnId: log.transactionHash,
          raw: { network: "ethereum", chainId: cfg.chainId, transactionHash: log.transactionHash, logIndex: log.logIndex, blockNumber: log.blockNumber.toString(), token: token.symbol, value: (log.args.value ?? BigInt(0)).toString(), from: order.payerAddress },
        }));
      }
      return candidates.length > 0 ? { status: "paid", candidates } : { status: "pending" };
    },

    async verifyPayer(order: OrderRow, payer: string, signature: string): Promise<string> {
      const payload = order.prepayPayload as PaymentPayload | null;
      if (order.channel !== "ethereum" || payload?.kind !== "ethereum" || !evm) throw new CryptoPayerError("NOT_ETHEREUM");
      if (!isAddress(payer) || !/^0x[0-9a-fA-F]+$/.test(signature)) throw new CryptoPayerError("INVALID_SIGNATURE");
      const valid = await evm.verifyMessage({ address: getAddress(payer), message: payload.challenge, signature: signature as Hex }).catch(() => false);
      if (!valid) throw new CryptoPayerError("INVALID_SIGNATURE");
      return payer.toLowerCase();
    },
  };
}
