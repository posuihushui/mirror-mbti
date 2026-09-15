import "server-only";
import { isAddress as isSolanaAddress } from "@solana/kit";
import { getAddress, isAddress as isEvmAddress } from "viem";
import { env } from "@/lib/env";
import type { CryptoNetwork, CryptoToken } from "../types";

/** Mainnet stablecoins. Testnets must override both addresses (see `.env.example`). */
const ETHEREUM_MAINNET_TOKENS: CryptoToken[] = [
  { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
];
const SOLANA_MAINNET_TOKENS: CryptoToken[] = [
  { symbol: "USDC", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  { symbol: "USDT", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", decimals: 6 },
];
const EXPLORERS: Record<number, string> = { 1: "https://etherscan.io/tx/", 11155111: "https://sepolia.etherscan.io/tx/" };

export type EvmConfig = { receiver: `0x${string}`; rpcUrl: string; chainId: number; confirmations: number; tokens: CryptoToken[]; explorer: string };
export type SolanaConfig = { receiver: string; rpcUrl: string; tokens: CryptoToken[] };
/** A network is `null` when its receiver or RPC is not configured; it is then not offered. */
export type CryptoConfig = { evm: EvmConfig | null; solana: SolanaConfig | null };

export class CryptoConfigError extends Error {}

export function cryptoConfig(): CryptoConfig {
  const e = env();
  let evm: EvmConfig | null = null;
  if (e.CRYPTO_EVM_RECEIVER && e.ETHEREUM_RPC_URL) {
    if (!isEvmAddress(e.CRYPTO_EVM_RECEIVER)) throw new CryptoConfigError("CRYPTO_EVM_RECEIVER is not a valid Ethereum address.");
    const mainnet = e.ETHEREUM_CHAIN_ID === 1;
    const usdc = e.ETHEREUM_USDC_ADDRESS ?? (mainnet ? ETHEREUM_MAINNET_TOKENS[0].address : undefined);
    const usdt = e.ETHEREUM_USDT_ADDRESS ?? (mainnet ? ETHEREUM_MAINNET_TOKENS[1].address : undefined);
    const tokens = [usdc && { symbol: "USDC" as const, address: usdc, decimals: 6 }, usdt && { symbol: "USDT" as const, address: usdt, decimals: 6 }].filter((t): t is CryptoToken => Boolean(t));
    if (tokens.length === 0 || tokens.some((t) => !isEvmAddress(t.address))) throw new CryptoConfigError("Ethereum token addresses are missing or invalid for ETHEREUM_CHAIN_ID.");
    evm = {
      receiver: getAddress(e.CRYPTO_EVM_RECEIVER),
      rpcUrl: e.ETHEREUM_RPC_URL,
      chainId: e.ETHEREUM_CHAIN_ID,
      confirmations: e.ETHEREUM_CONFIRMATIONS,
      tokens: tokens.map((t) => ({ ...t, address: getAddress(t.address) })),
      explorer: EXPLORERS[e.ETHEREUM_CHAIN_ID] ?? EXPLORERS[1],
    };
  }
  let solana: SolanaConfig | null = null;
  if (e.CRYPTO_SOLANA_RECEIVER && e.SOLANA_RPC_URL) {
    if (!isSolanaAddress(e.CRYPTO_SOLANA_RECEIVER)) throw new CryptoConfigError("CRYPTO_SOLANA_RECEIVER is not a valid Solana address.");
    const tokens = [
      { ...SOLANA_MAINNET_TOKENS[0], address: e.SOLANA_USDC_MINT ?? SOLANA_MAINNET_TOKENS[0].address },
      { ...SOLANA_MAINNET_TOKENS[1], address: e.SOLANA_USDT_MINT ?? SOLANA_MAINNET_TOKENS[1].address },
    ];
    if (tokens.some((t) => !isSolanaAddress(t.address))) throw new CryptoConfigError("Solana token mints are invalid.");
    solana = { receiver: e.CRYPTO_SOLANA_RECEIVER, rpcUrl: e.SOLANA_RPC_URL, tokens };
  }
  return { evm, solana };
}

/** Networks the English checkout offers: Solana first (lowest fees), then Ethereum. Empty when unconfigured. */
export function cryptoNetworks(): CryptoNetwork[] {
  try {
    const { evm, solana } = cryptoConfig();
    return [...(solana ? (["solana"] as const) : []), ...(evm ? (["ethereum"] as const) : [])];
  } catch (error) {
    console.error("[crypto] invalid configuration", error instanceof Error ? error.message : error);
    return [];
  }
}
