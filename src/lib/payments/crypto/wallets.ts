/**
 * Browser wallet discovery for the Ethereum checkout: EIP-6963 announcements, with the legacy
 * `window.ethereum` injection as a fallback. Read through `useSyncExternalStore`; snapshots are
 * stable references so React only re-renders when a new wallet announces itself.
 */

export type Eip1193Provider = { request(args: { method: string; params?: unknown }): Promise<unknown> };
export type WalletInfo = { uuid: string; name: string; icon: string; rdns: string };
export type DiscoveredWallet = { info: WalletInfo; provider: Eip1193Provider };

const NO_WALLETS: DiscoveredWallet[] = [];
let announced: DiscoveredWallet[] = NO_WALLETS;
let injected: DiscoveredWallet[] | null = null;
const listeners = new Set<() => void>();

function onAnnounce(event: Event) {
  const detail = (event as CustomEvent<DiscoveredWallet>).detail;
  if (!detail?.info?.uuid || typeof detail.provider?.request !== "function") return;
  if (announced.some((wallet) => wallet.info.uuid === detail.info.uuid)) return;
  announced = [...announced, detail];
  for (const listener of listeners) listener();
}

export function subscribeWallets(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("eip6963:announceProvider", onAnnounce);
  listeners.add(listener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("eip6963:announceProvider", onAnnounce);
  };
}

export function getWallets(): DiscoveredWallet[] {
  if (announced.length > 0) return announced;
  const legacy = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  if (!legacy) return NO_WALLETS;
  injected ??= [{ info: { uuid: "injected", name: "Browser wallet", icon: "", rdns: "injected" }, provider: legacy }];
  return injected;
}

export function getServerWallets(): DiscoveredWallet[] {
  return NO_WALLETS;
}
