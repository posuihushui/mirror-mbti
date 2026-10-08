/** React streams resolved Suspense content in hidden containers before moving it with JS.
 * With JS disabled, expose only containers containing these already-authorized server pages.
 * This never fetches data or changes authorization, and has no effect with JS enabled.
 */
export function StaticStreamFallback() {
 return <div data-share-loading aria-busy="true" className="min-h-[60vh]"><noscript><style>{`@layer base { div[hidden]:has([data-share-static]) { display: contents !important; } [data-share-loading] { display: none !important; } }`}</style></noscript></div>;
}
