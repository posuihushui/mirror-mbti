/**
 * The list price, struck through beside an invite price or 请 TA. `<s>` is not announced as a
 * former price, so the label is spoken before it and hidden from sight.
 */
export function ListPrice({ was, currency, price, className }: { was: string; currency: string; price: string; className?: string }) {
  return (
    <s className={className}>
      <span className="sr-only">{was} </span>
      {currency}
      {price}
    </s>
  );
}
