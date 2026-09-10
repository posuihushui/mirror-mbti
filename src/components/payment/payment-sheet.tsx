"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Check, CircleNotch, WechatLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { ResponsiveSheet } from "@/components/site/responsive-sheet";
import { PrimaryButton } from "@/components/site/primary-button";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { OrderView, PaymentPayload } from "@/lib/payments/types";
import { unlockBullets, type PaymentMode } from "@/lib/site";
import { isWeChat } from "@/lib/ua";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultId: string;
  type: string;
  name: string;
  priceLabel: string;
  mode: PaymentMode;
  onUnlocked: () => void;
  onRead: () => void;
};

type PayState = "ready" | "processing" | "success" | "cancelled";
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

declare global {
  interface Window {
    WeixinJSBridge?: { invoke: (name: string, params: unknown, cb: (res: { err_msg: string }) => void) => void };
  }
}

const MIN_PROCESSING_MS = 900;
const POLL_MS = 2000;

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.ok) {
    const err = new Error(json.error.message) as Error & { code?: string };
    err.code = json.error.code;
    throw err;
  }
  return json.data;
}

/**
 * Payment flow for the full report. In `mock` mode it reproduces the prototype exactly
 * (simulated unlock, no charge). In `wechat` mode it runs JSAPI / H5 / Native depending
 * on the environment and polls the order until the callback lands.
 */
export function PaymentSheet({ open, onOpenChange, ...flow }: Props) {
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="更完整地，认识自己。" description="完整人格分析 · 一次解锁">
      {open && <PaymentFlow onOpenChange={onOpenChange} {...flow} />}
    </ResponsiveSheet>
  );
}

const noopSubscribe = () => () => {};

/** Mounted only while the sheet is open, so every open starts from "ready" without effects. */
function PaymentFlow({ onOpenChange, resultId, type, name, priceLabel, mode, onUnlocked, onRead }: Omit<Props, "open">) {
  const compact = useMediaQuery("(max-width: 720px)", true);
  const inWeChat = useSyncExternalStore(noopSubscribe, () => isWeChat(navigator.userAgent), () => false);
  const [state, setState] = useState<PayState>("ready");
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      window.clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }

  const succeed = () => {
    stopPolling();
    setState("success");
    onUnlocked();
  };

  const pollUntilPaid = (orderId: string) => {
    const tick = async () => {
      if (cancelledRef.current) return;
      try {
        const order = await api<OrderView>(`/api/orders/${orderId}`);
        if (order.status === "paid") return succeed();
        if (order.status === "expired" || order.status === "cancelled" || order.status === "failed") {
          setState("cancelled");
          return;
        }
      } catch {
        /* transient: keep polling */
      }
      pollRef.current = window.setTimeout(tick, POLL_MS);
    };
    pollRef.current = window.setTimeout(tick, POLL_MS);
  };

  const runMock = async (order: OrderView, startedAt: number) => {
    const paid = await api<OrderView>(`/api/orders/${order.id}/mock-pay`, { method: "POST" });
    const remaining = MIN_PROCESSING_MS - (Date.now() - startedAt);
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
    if (cancelledRef.current) return;
    if (paid.status === "paid") succeed();
    else setState("cancelled");
  };

  const runWeChat = (order: OrderView, payload: PaymentPayload) => {
    if (payload.kind === "jsapi") {
      const bridge = window.WeixinJSBridge;
      if (!bridge) {
        toast("请在微信内打开本页面完成支付");
        setState("cancelled");
        return;
      }
      bridge.invoke("getBrandWCPayRequest", payload.params, (res) => {
        if (res.err_msg === "get_brand_wcpay_request:ok") pollUntilPaid(order.id);
        else setState("cancelled");
      });
      return;
    }
    if (payload.kind === "native") {
      setQrSvg(payload.qrSvg);
      pollUntilPaid(order.id);
      return;
    }
    if (payload.kind === "h5") {
      window.location.href = payload.mwebUrl;
      return;
    }
    setState("cancelled");
  };

  const pay = async () => {
    if (state === "processing") return;
    const startedAt = Date.now();
    cancelledRef.current = false;
    setState("processing");
    try {
      const order = await api<OrderView>("/api/orders", { method: "POST", body: JSON.stringify({ resultId }) });
      if (cancelledRef.current) return;
      if (order.provider === "mock") await runMock(order, startedAt);
      else if (order.payload) runWeChat(order, order.payload);
      else setState("cancelled");
    } catch (e) {
      const err = e as Error & { code?: string };
      if (err.code === "OPENID_REQUIRED") {
        const back = `${window.location.pathname}?unlock=1`;
        // The route handler 302s to open.weixin.qq.com, so this must be a full navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/api/wechat/oauth?return=${encodeURIComponent(back)}`;
        return;
      }
      if (err.code === "ALREADY_UNLOCKED") {
        succeed();
        return;
      }
      toast(err.message || "暂时无法发起支付，请稍后重试");
      setState("ready");
    }
  };

  const cancel = () => {
    if (state === "processing") {
      cancelledRef.current = true;
      stopPolling();
      setState("cancelled");
      return;
    }
    onOpenChange(false);
    toast("支付已取消，测试结果已保留");
  };

  const scanMode = !inWeChat && !compact;
  const methodTitle = scanMode ? "微信扫码支付" : "微信支付";
  const methodSub = scanMode ? "使用手机微信完成支付" : mode === "wechat" && !inWeChat ? "跳转微信完成支付" : "在微信内确认支付";

  return (
    <>
      {state === "success" ? (
        <div className="pt-[22px] pb-[15px] text-center md:pt-[35px]">
          <Check size={44} weight="light" className="mx-auto mb-[22px] text-[#748777]" />
          <p className="eyebrow text-[9px] tracking-[0.16em] text-[#8a9a9c]">READY FOR YOU</p>
          <h3 className="mt-[25px] mb-[18px] text-[26px] leading-[1.5] font-normal whitespace-pre-line">{"你的完整报告，\n已经准备好了。"}</h3>
          <p className="text-[11px] text-[#7e8b91]">{mode === "mock" ? "演示解锁成功，本次未产生扣款。" : "支付成功，本次报告已解锁。"}</p>
          <PrimaryButton className="mt-[35px]" onClick={onRead}>
            开始阅读报告
          </PrimaryButton>
        </div>
      ) : (
        <div>
          <div className="mt-0 flex items-center justify-between border-b border-line pt-[13px] pb-[22px] md:mt-[10px] md:pt-[26px]">
            <span className="text-[14px] font-medium">
              {type} · {name}
              <small className="mt-2 block text-[10px] font-normal text-[#7c8b93]">完整人格分析报告</small>
            </span>
            <strong className="text-[39px] font-medium tracking-[-2px] md:text-[45px]">
              <small className="mr-1 text-[20px]">¥</small>
              {priceLabel}
            </strong>
          </div>
          <ul className="my-[18px] list-none p-0 md:my-[22px]">
            {unlockBullets.map((l) => (
              <li key={l} className="my-3 flex items-center gap-[9px] text-[11px] text-[#5d707a]">
                <Check size={15} className="text-[#8d9c8b]" />
                {l}
              </li>
            ))}
          </ul>
          <div className="mt-[18px] flex items-center gap-3 rounded-[3px] border border-[#cdd9dc] px-[15px] py-4 md:mt-[25px]">
            <WechatLogo size={25} weight="fill" className="text-[#299c63]" />
            <span className="text-[13px] font-medium">
              {methodTitle}
              <small className="mt-[5px] block text-[9px] font-normal text-[#7e8d93]">{methodSub}</small>
            </span>
            <Check size={17} className="ml-auto" />
          </div>
          {qrSvg && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="size-[180px] bg-white p-2 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="text-[10px] text-[#7e8d93]">请使用微信「扫一扫」完成支付，支付后本页会自动刷新。</p>
            </div>
          )}
          <p className="mt-[18px] mb-3 text-center text-[10px] text-[#8c775f] md:mt-6">
            {mode === "mock" ? "支付演示 · 本次不会扣款" : "安全支付 · 由微信支付提供服务"}
          </p>
          {state === "cancelled" && (
            <p role="status" className="my-[10px] text-[11px] text-[#997c60]">
              支付已取消。你的测试结果仍可查看。
            </p>
          )}
          <Button variant="pill" className="min-h-[54px]" disabled={state === "processing"} onClick={pay}>
            {state === "processing" ? (
              <>
                <CircleNotch className="animate-spin" size={20} />
                {mode === "mock" ? "正在演示解锁…" : "正在等待支付…"}
              </>
            ) : (
              <>
                {mode === "mock" ? "模拟支付" : "微信支付"} ¥{priceLabel}
                <ArrowUpRight size={18} />
              </>
            )}
          </Button>
          <button type="button" onClick={cancel} className="block min-h-11 w-full text-center text-[11px] text-[#78888d]">
            暂不支付
          </button>
          <p className="mt-[6px] text-center text-[9px] text-[#92a1a6]">单次购买 · 无自动续费</p>
        </div>
      )}
    </>
  );
}
