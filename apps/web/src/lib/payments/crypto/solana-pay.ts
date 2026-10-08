/**
 * Solana Pay (spec v1.1) transfer requests and payment matching. Pure: no RPC access, so the
 * matching rules are unit-tested against recorded `getTransaction` shapes.
 *
 * Each order gets a random `reference` key. Wallets add it to the transfer instruction as a
 * read-only account, so `getSignaturesForAddress(reference)` finds exactly this order's payment.
 */

export type SolanaPayRequest = {
  recipient: string;
  /** Decimal token amount, e.g. `"1"`. */
  amount: string;
  splToken: string;
  reference: string;
  label?: string;
  message?: string;
};

/** Parameters are percent-encoded (not `+` for spaces), as the spec requires. */
export function solanaPayUrl({ recipient, amount, splToken, reference, label, message }: SolanaPayRequest): string {
  const params: [string, string][] = [["amount", amount], ["spl-token", splToken], ["reference", reference]];
  if (label) params.push(["label", label]);
  if (message) params.push(["message", message]);
  return `solana:${recipient}?${params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`;
}

/** The subset of a `jsonParsed` `getTransaction` result that payment matching reads. */
export type TokenBalanceLike = { accountIndex: number; mint: string; owner?: string | null; uiTokenAmount: { amount: string; decimals: number } };
export type ParsedTransactionLike = {
  meta: { err: unknown; preTokenBalances?: readonly TokenBalanceLike[] | null; postTokenBalances?: readonly TokenBalanceLike[] | null } | null;
} | null;

/**
 * Raw token units of `mint` that `recipient` gained in a successful transaction: the sum of
 * positive post − pre balances over the recipient's token accounts. A newly created token account
 * has no pre balance and counts from zero. Failed transactions count as nothing.
 */
export function receivedTokenUnits(tx: ParsedTransactionLike, recipient: string, mint: string): bigint {
  if (!tx?.meta || tx.meta.err) return BigInt(0);
  const pre = tx.meta.preTokenBalances ?? [];
  let received = BigInt(0);
  for (const post of tx.meta.postTokenBalances ?? []) {
    if (post.owner !== recipient || post.mint !== mint) continue;
    const before = pre.find((balance) => balance.accountIndex === post.accountIndex && balance.mint === mint);
    const delta = BigInt(post.uiTokenAmount.amount) - BigInt(before?.uiTokenAmount.amount ?? "0");
    if (delta > BigInt(0)) received += delta;
  }
  return received;
}

/** The first accepted token the transaction paid at least `minUnits(token)` of, or null. */
export function matchSolanaPayment<T extends { address: string }>(tx: ParsedTransactionLike, recipient: string, tokens: readonly T[], minUnits: (token: T) => bigint): T | null {
  return tokens.find((token) => receivedTokenUnits(tx, recipient, token.address) >= minUnits(token)) ?? null;
}
