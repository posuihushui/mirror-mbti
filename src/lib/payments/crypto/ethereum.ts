/**
 * Ethereum payment rules. ERC-20 transfers carry no order reference, so an order is tied to the
 * wallet that signs its challenge: once the payer is confirmed, a transfer of an accepted token
 * from that wallet to the receiver, at or after `startBlock`, for at least the price, pays it.
 * Pure: no RPC access, so matching is unit-tested directly.
 */

export type ChallengeInput = { orderId: string; recipient: string; nonce: string; expiresAt: Date };

/** The message the buyer signs. Signing is free (`personal_sign`) and moves no funds. */
export function paymentChallenge({ orderId, recipient, nonce, expiresAt }: ChallengeInput): string {
  return [
    "mirror · confirm your payment wallet",
    "",
    "Sign to confirm the wallet you will pay from. Signing is free and does not move any funds.",
    "",
    `Order: ${orderId}`,
    `Receiver: ${recipient}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt.toISOString()}`,
  ].join("\n");
}

/** The subset of a decoded viem `Transfer` log that matching reads. */
export type TransferLogLike = {
  address: string;
  transactionHash: string | null;
  logIndex: number | null;
  blockNumber: bigint | null;
  args: { from?: string; to?: string; value?: bigint };
};

export type TransferMatch<T> = { log: TransferLogLike & { transactionHash: string; logIndex: number; blockNumber: bigint }; token: T };

/**
 * Transfers that could pay the order, oldest first. Each is a candidate; the caller claims them in
 * order so one on-chain transfer can never unlock two orders.
 */
export function transferCandidates<T extends { address: string }>(
  logs: readonly TransferLogLike[],
  { payer, recipient, tokens, minUnits, startBlock }: { payer: string; recipient: string; tokens: readonly T[]; minUnits: (token: T) => bigint; startBlock: bigint },
): TransferMatch<T>[] {
  const same = (a: string | undefined, b: string) => a?.toLowerCase() === b.toLowerCase();
  return logs
    .flatMap((log) => {
      const token = tokens.find((t) => same(log.address, t.address));
      if (!token || log.transactionHash === null || log.logIndex === null || log.blockNumber === null) return [];
      if (!same(log.args.from, payer) || !same(log.args.to, recipient)) return [];
      if (log.blockNumber < startBlock || (log.args.value ?? BigInt(0)) < minUnits(token)) return [];
      return [{ log: { ...log, transactionHash: log.transactionHash, logIndex: log.logIndex, blockNumber: log.blockNumber }, token }];
    })
    .sort((a, b) => (a.log.blockNumber === b.log.blockNumber ? a.log.logIndex - b.log.logIndex : a.log.blockNumber < b.log.blockNumber ? -1 : 1));
}

/** Idempotency key for a claimed transfer; unique across chains and log positions. */
export function ethereumEventId(chainId: number, transactionHash: string, logIndex: number): string {
  return `ethereum:${chainId}:${transactionHash.toLowerCase()}:${logIndex}`;
}
