"use client";

import { useEffect } from "react";
import { isWeChat } from "@/lib/ua";

declare global {
  interface Window {
    wx?: {
      config: (cfg: Record<string, unknown>) => void;
      ready: (cb: () => void) => void;
      updateAppMessageShareData: (data: Record<string, unknown>) => void;
      updateTimelineShareData: (data: Record<string, unknown>) => void;
    };
  }
}

let sdk: Promise<void> | null = null;
type Props = { title: string; desc: string; imgUrl: string; link: string };

/** Configures the WeChat JS-SDK share card. Loads nothing outside the WeChat browser. */
export function WeChatShare({ title, desc, imgUrl, link }: Props) {
  useEffect(() => {
    if (!isWeChat(navigator.userAgent)) return;
    const target = new URL(link);
    if (target.origin !== window.location.origin || target.search || target.hash || !/^\/(?:en\/)?(?:s|t)\/[A-Za-z0-9_-]{32}$/.test(target.pathname)) return;
    let cancelled = false;
    const setup = async () => {
      const res = await fetch(`/api/wechat/jsconfig?url=${encodeURIComponent(window.location.href.split("#")[0])}`);
      const json = (await res.json()) as { ok: boolean; data?: { appId: string; timestamp: number; nonceStr: string; signature: string } };
      if (!json.ok || !json.data || cancelled) return;
      if (!window.wx) {
        await (sdk ??= new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("jweixin load failed"));
          document.head.appendChild(s);
        }).catch(error => { sdk = null; throw error; }));
      }
      const wx = window.wx;
      if (!wx || cancelled) return;
      wx.config({ debug: false, ...json.data, jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"] });
      wx.ready(() => {
        if (cancelled) return;
        wx.updateAppMessageShareData({ title, desc, link, imgUrl });
        wx.updateTimelineShareData({ title, link, imgUrl });
      });
    };
    setup().catch(() => {
      /* share config is best-effort */
    });
    return () => {
      cancelled = true;
    };
  }, [title, desc, imgUrl, link]);
  return null;
}
