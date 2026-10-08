/** Waffo amounts are display strings; orders keep minor units. Pure, so it can be unit-tested. */

/** Minor units to the display-format amount the API expects: `690` -> `"6.90"`. */
export function centsToAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Display-format amount back to minor units, for comparing a callback against the order. */
export function amountToCents(amount: string): number | null {
  // `Number("")` is 0, so an absent amount must be rejected before the conversion.
  if (!amount.trim()) return null;
  const value = Number(amount);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}
