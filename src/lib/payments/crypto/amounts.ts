/**
 * Orders store prices in cents; stablecoins count in `decimals` units (USDC/USDT use 6).
 * `centsToTokenUnits(100, 6)` → `1_000_000`. Pure, so it is unit-tested directly.
 */
export function centsToTokenUnits(cents: number, decimals: number): bigint {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Invalid cents amount: ${cents}`);
  if (!Number.isInteger(decimals) || decimals < 2) throw new Error(`Unsupported token decimals: ${decimals}`);
  return BigInt(cents) * BigInt(10) ** BigInt(decimals - 2);
}

/** Human amount for payment requests: `100` → `"1"`, `150` → `"1.5"`, `199` → `"1.99"`. */
export function centsToDecimalString(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error(`Invalid cents amount: ${cents}`);
  const whole = Math.floor(cents / 100);
  const fraction = cents % 100;
  if (fraction === 0) return String(whole);
  return `${whole}.${String(fraction).padStart(2, "0").replace(/0$/, "")}`;
}
