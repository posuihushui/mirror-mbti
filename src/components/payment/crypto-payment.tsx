"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowSquareOut, Check, CircleNotch, Copy } from "@phosphor-icons/react";
import { cn } from "cn";
import { toast } from "sonner";
import { createWalletClient, custom, erc20Abi, getAddress, UserRejectedRequestError } from "viem";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cryptoMessages as t } from "@/lib/i18n/messages/crypto";
import { centsToTokenUnits } from "@/lib/payments/crypto/amounts";
import { getServerWallets, getWallets, subscribeWallets, type DiscoveredWallet } from "@/lib/payments/crypto/wallets";
import type { CryptoNetwork, OrderView, PaymentPayload } from "@/lib/payments/types";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };
type SolanaPayload = Extract<PaymentPayload, { kind: "solana" }>;
type EthereumPayload = Extract<PaymentPayload, { kind: "ethereum" }>;

const POLL_MS = 4000;
const noopSubscribe = () => () => {};

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) throw Object.assign(new Error(json.error.message), { code: json.error.code });
  return json.data;
}

type Props = {
  resultId: string;
  networks: CryptoNetwork[];
  onPaid: (orderId: string) => void;
  onAlreadyUnlocked: () => void;
};

/**
 * USDT/USDC checkout for the English report. Loaded only when the English provider is `crypto`.
 * An order is created per chosen network; the server reads the chain and this island polls the
 * order until it is paid. Solana uses a Solana Pay request; Ethereum ties the order to a signed wallet.
 */
export function CryptoPayment({ resultId, networks, onPaid, onAlreadyUnlocked }: Props) {
  const compact = useMediaQuery("(max-width: 720px)", true);
  const [network, setNetwork] = useState<CryptoNetwork | null>(null);
  const [orders, setOrders] = useState<Partial<Record<CryptoNetwork, OrderView>>>({});
  const [creating, setCreating] = useState(false);
  const [token, setToken] = useState(0);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef<number | null>(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, []);

  const poll = (orderId: string) => {
    if (pollRef.current) window.clearTimeout(pollRef.current);
    const tick = async () => {
      if (unmounted.current) return;
      try {
        const order = await api<OrderView>(`/api/orders/${orderId}`);
        if (order.status === "paid") return onPaid(order.id);
        // Expired crypto orders are still checked server-side for a day, so keep polling.
        setExpired(order.status !== "created");
      } catch {
        /* transient: keep polling */
      }
      pollRef.current = window.setTimeout(tick, POLL_MS);
    };
    pollRef.current = window.setTimeout(tick, POLL_MS);
  };

  const choose = async (next: CryptoNetwork) => {
    if (creating) return;
    setNetwork(next);
    setToken(0);
    setExpired(false);
    const existing = orders[next];
    if (existing) {
      poll(existing.id);
      return;
    }
    setCreating(true);
    try {
      const order = await api<OrderView>("/api/orders", { method: "POST", body: JSON.stringify({ resultId, network: next }) });
      if (unmounted.current) return;
      setOrders((previous) => ({ ...previous, [next]: order }));
      poll(order.id);
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === "ALREADY_UNLOCKED") return onAlreadyUnlocked();
      toast(err.message || t.createFailed);
      setNetwork(null);
    } finally {
      setCreating(false);
    }
  };

  const order = network ? orders[network] : undefined;
  const payload = order?.payload;

  return (
    <div className="mt-[18px] md:mt-[25px]">
      <p className="text-[12px] text-mist">{t.choose}</p>
      <div role="tablist" aria-label={t.networkLabel} className="mt-3 grid grid-cols-2 gap-2">
        {networks.map((n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={network === n}
            disabled={creating}
            onClick={() => choose(n)}
            className={cn("flex min-h-[58px] min-w-0 flex-col items-start justify-center rounded-[3px] border border-[#cdd9dc] px-[15px] text-left", network === n && "border-ink")}
          >
            <span className="text-[13px] font-medium">{t.networks[n]}</span>
            <small className="mt-1 text-[9px] text-[#7e8d93]">{t.networkNotes[n]}</small>
          </button>
        ))}
      </div>
      {creating && (
        <p role="status" className="mt-4 flex items-center gap-2 text-[11px] text-mist">
          <CircleNotch className="animate-spin" size={16} />
          {t.creating}
        </p>
      )}
      {payload?.kind === "solana" && <SolanaPanel payload={payload} token={token} onToken={setToken} compact={compact} />}
      {payload?.kind === "ethereum" && order && (
        <EthereumPanel key={order.id} order={order} payload={payload} token={token} onToken={setToken} onOrder={(next) => setOrders((previous) => ({ ...previous, ethereum: next }))} />
      )}
      {order && (
        <>
          <p role="status" className="mt-5 text-[11px] leading-[1.9] text-[#4f5c61]">{expired ? t.expired : t.waiting}</p>
          <p className="mt-2 text-[10px] leading-[1.8] text-[#8c775f]">{t.final}</p>
        </>
      )}
    </div>
  );
}

function TokenToggle({ symbols, value, onChange }: { symbols: string[]; value: number; onChange: (index: number) => void }) {
  return (
    <div role="radiogroup" aria-label={t.tokenLabel} className="flex gap-2">
      {symbols.map((symbol, i) => (
        <button
          key={symbol}
          type="button"
          role="radio"
          aria-checked={value === i}
          onClick={() => onChange(i)}
          className={cn("min-h-11 rounded-[50px] border border-[#cdd9dc] px-5 text-[12px]", value === i && "border-ink bg-ink text-paper")}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}

function CopyField({ value, label }: { value: string; label?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast(t.copied);
    } catch {
      toast(t.copyFailed);
    }
  };
  return (
    <div className="mt-2 flex flex-col gap-1">
      {label && <span className="text-[11px] text-mist">{label}</span>}
      <code className="block break-all text-[12px] leading-[1.8] select-all">{value}</code>
      <Button variant="link" onClick={copy} className="min-h-11 self-start text-[12px]">
        <Copy size={16} data-icon="inline-start" />
        {t.copy}
      </Button>
    </div>
  );
}

function SolanaPanel({ payload, token, onToken, compact }: { payload: SolanaPayload; token: number; onToken: (i: number) => void; compact: boolean }) {
  const current = payload.tokens[token] ?? payload.tokens[0];
  return (
    <div className="mt-5">
      <TokenToggle symbols={payload.tokens.map((x) => x.symbol)} value={token} onChange={onToken} />
      <p className="mt-4 text-[12px] leading-[1.9]">{t.atLeast(payload.amount, current.symbol, t.networks.solana)}</p>
      {!compact && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="size-[180px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: current.qrSvg }} />
          <p className="text-center text-[10px] text-[#7e8d93]">{t.solana.scan}</p>
        </div>
      )}
      <a href={current.url} className="pill mt-4 min-h-[54px]">
        {t.solana.open}
        <ArrowSquareOut size={18} />
      </a>
      <p className="mt-3 text-[10px] leading-[1.8] text-mist">{t.solana.manual}</p>
    </div>
  );
}

function EthereumPanel({ order, payload, token, onToken, onOrder }: { order: OrderView; payload: EthereumPayload; token: number; onToken: (i: number) => void; onOrder: (order: OrderView) => void }) {
  const wallets = useSyncExternalStore(subscribeWallets, getWallets, getServerWallets);
  const [wallet, setWallet] = useState<DiscoveredWallet | null>(null);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [step, setStep] = useState<"idle" | "connecting" | "signing" | "paying">("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const current = payload.tokens[token] ?? payload.tokens[0];
  const busy = step !== "idle";

  const failed = (e: unknown) => {
    setStep("idle");
    const rejected = e instanceof UserRejectedRequestError || (e as { code?: number }).code === 4001;
    toast(rejected ? t.ethereum.rejected : (e as { code?: string }).code ? (e as Error).message : t.ethereum.failed);
  };

  const connect = async (next: DiscoveredWallet) => {
    setStep("connecting");
    try {
      const client = createWalletClient({ transport: custom(next.provider) });
      const [address] = await client.requestAddresses();
      try {
        await client.switchChain({ id: payload.chainId });
      } catch {
        toast(t.ethereum.wrongChain);
      }
      if (payload.payer && address.toLowerCase() !== payload.payer) {
        toast(t.ethereum.otherWallet);
        setStep("idle");
        return;
      }
      setWallet(next);
      setAccount(address);
      if (payload.payer) {
        setStep("idle");
        return;
      }
      setStep("signing");
      const signature = await client.signMessage({ account: address, message: payload.challenge });
      onOrder(await api<OrderView>(`/api/orders/${order.id}/payer`, { method: "POST", body: JSON.stringify({ address, signature }) }));
      setStep("idle");
    } catch (e) {
      failed(e);
    }
  };

  const pay = async () => {
    if (!wallet || !account) return;
    setStep("paying");
    try {
      const client = createWalletClient({ transport: custom(wallet.provider) });
      const hash = await client.writeContract({
        account,
        chain: null,
        address: getAddress(current.address),
        abi: erc20Abi,
        functionName: "transfer",
        args: [getAddress(payload.recipient), centsToTokenUnits(order.amountFen, current.decimals)],
      });
      setTxHash(hash);
      setStep("idle");
    } catch (e) {
      failed(e);
    }
  };

  const stepLabel = step === "signing" ? t.ethereum.signing : t.ethereum.connecting;

  return (
    <div className="mt-5">
      <TokenToggle symbols={payload.tokens.map((x) => x.symbol)} value={token} onChange={onToken} />
      <p className="mt-4 text-[11px] leading-[1.8] text-[#997c60]">{t.ethereum.gas}</p>
      {!payload.payer ? (
        wallets.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-[12px] text-mist">{t.ethereum.wallets}</p>
            {wallets.map((w) => (
              <Button key={w.info.uuid} variant="pill" className="min-h-[54px]" disabled={busy} onClick={() => connect(w)}>
                {busy ? stepLabel : t.ethereum.connectWith(w.info.name)}
                {/* eslint-disable-next-line @next/next/no-img-element -- EIP-6963 icons are data URIs supplied by the wallet */}
                {w.info.icon ? <img src={w.info.icon} alt="" width={20} height={20} /> : null}
              </Button>
            ))}
            <p className="text-[10px] leading-[1.8] text-mist">{t.ethereum.signNote}</p>
          </div>
        ) : (
          <WalletLinks orderId={order.id} />
        )
      ) : (
        <div className="mt-4">
          <p className="flex items-center gap-2 text-[12px]">
            <Check size={15} />
            {t.ethereum.confirmed(payload.payer)}
          </p>
          {wallet && account ? (
            <Button variant="pill" className="mt-3 min-h-[54px]" disabled={busy || Boolean(txHash)} onClick={pay}>
              {step === "paying" ? t.ethereum.paying : t.ethereum.pay(payload.amount, current.symbol)}
            </Button>
          ) : (
            wallets.map((w) => (
              <Button key={w.info.uuid} variant="pill" className="mt-3 min-h-[54px]" disabled={busy} onClick={() => connect(w)}>
                {busy ? stepLabel : t.ethereum.reconnect(w.info.name)}
              </Button>
            ))
          )}
          {txHash && (
            <p className="mt-3 text-[11px] leading-[1.9]">
              {t.ethereum.sent}{" "}
              <a href={`${payload.explorer}${txHash}`} target="_blank" rel="noreferrer" className="underline">
                {t.ethereum.viewTx}
              </a>
            </p>
          )}
          <p className="mt-4 text-[11px] leading-[1.9] text-mist">{t.ethereum.manual(payload.amount, current.symbol)}</p>
          <CopyField value={payload.recipient} />
        </div>
      )}
    </div>
  );
}

/**
 * Phones without an injected wallet reopen this page inside a wallet app. The links carry only the
 * public page URL: order numbers are recovery credentials, and these deep-link services receive the
 * URL. The buyer copies the order number and restores the test on the page that opens.
 */
function WalletLinks({ orderId }: { orderId: string }) {
  const url = useSyncExternalStore(noopSubscribe, () => window.location.href.split("#")[0], () => "");
  const links: [string, string][] = [
    ["MetaMask", `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, "")}`],
    ["Coinbase Wallet", `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`],
    ["Trust Wallet", `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(url)}`],
  ];
  return (
    <div className="mt-4">
      <p className="text-[12px] leading-[1.9] text-mist">{t.ethereum.noWallet}</p>
      <div className="mt-2 flex flex-col">
        {links.map(([name, link]) => (
          <a key={name} href={link} className="text-link min-h-11 text-[13px]">
            {name}
            <ArrowSquareOut size={15} />
          </a>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-[1.9] text-mist">{t.ethereum.handoff}</p>
      <CopyField value={orderId} label={t.ethereum.orderNumber} />
    </div>
  );
}
