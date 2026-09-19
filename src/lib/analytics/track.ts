import type { OrderView } from "@/lib/payments/types";
import { isWeChat } from "@/lib/ua";
import { paymentTypeOf, reportCommerce, transactionId } from "./commerce";
import type { AnalyticsEventName, AnalyticsEvents, CtaId, CtaLocation } from "./events";
import { pageInfo, sanitizeLocation, sanitizeReferrer } from "./url";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = /^G-[A-Z0-9]{4,}$/;
const DEBUG_KEY = "mirror.analytics.debug";
const PURCHASES_KEY = "mirror.analytics.purchases.v1";

/**
 * Commands wait in `dataLayer` until gtag.js loads. Without a measurement ID nothing loads and
 * the queue stays in the page, which is also what the e2e tests read.
 */
function gtag(...args: unknown[]) {
  if (!window.gtag) {
    const dataLayer = (window.dataLayer ??= []);
    window.gtag = function queue() {
      // gtag.js only executes `arguments` objects from the queue; pushed arrays are ignored.
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
  }
  window.gtag(...args);
}

type Args<E extends AnalyticsEventName> = keyof AnalyticsEvents[E] extends never ? [] : [params: AnalyticsEvents[E]];

/** Sends a catalogued event. Every event carries `page_type` and `site_language`; booleans become `"true"`/`"false"`. */
export function track<E extends AnalyticsEventName>(name: E, ...args: Args<E>): void {
  if (typeof window === "undefined") return;
  try {
    const { locale, pageType } = pageInfo(window.location.pathname);
    const params: Record<string, unknown> = { page_type: pageType, site_language: locale };
    for (const [key, value] of Object.entries(args[0] ?? {})) {
      if (value !== undefined) params[key] = typeof value === "boolean" ? String(value) : value;
    }
    gtag("event", name, params);
  } catch {
    // Measurement must never break the page.
  }
}

let configuredMeasurementId: string | undefined;
function protectCapabilityPage() {
  const sensitive = ["share", "invitation", "comparison", "my_shares", "my_pairing"].includes(pageInfo(window.location.pathname).pageType);
  if (configuredMeasurementId) (window as unknown as Record<string, unknown>)[`ga-disable-${configuredMeasurementId}`] = sensitive;
  return sensitive;
}

let lastPath: string | null = null;
let lastLocation = "";

/** One `page_view` per pathname: `?chapter=` and `?unlock=1` changes stay on the same page. */
export function trackPageView() {
  if (typeof window === "undefined") return;
  protectCapabilityPage();
  const path = window.location.pathname;
  if (path === lastPath) return;
  const pageLocation = sanitizeLocation(window.location.href);
  const pageReferrer = lastPath === null ? sanitizeReferrer(document.referrer, window.location.origin) : lastLocation;
  lastPath = path;
  lastLocation = pageLocation;
  // Automatic events (scroll, user_engagement) read these too, so IDs never reach them either.
  gtag("set", { page_location: pageLocation, page_referrer: pageReferrer });
  track("page_view", { page_location: pageLocation, page_referrer: pageReferrer });
}

/** Delegated `cta_click` for elements marked with `trackAttrs`. */
function trackClick(event: MouseEvent) {
  // Disable collection before a client navigation can trigger enhanced history/link events.
  const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
  if (anchor && configuredMeasurementId) {
    try {
      const target = new URL(anchor.href, window.location.href);
      if (target.origin === window.location.origin && ["share", "invitation", "comparison", "my_shares", "my_pairing"].includes(pageInfo(target.pathname).pageType)) {
        (window as unknown as Record<string, unknown>)[`ga-disable-${configuredMeasurementId}`] = true;
      }
    } catch { /* malformed links do not affect navigation */ }
  }
  const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-track]") : null;
  // An expanded disclosure is being closed, not opened.
  if (!element || element.getAttribute("aria-expanded") === "true") return;
  const { track: ctaId, trackLocation } = element.dataset;
  if (ctaId && trackLocation) track("cta_click", { cta_id: ctaId as CtaId, cta_location: trackLocation as CtaLocation });
}

/** `?ga_debug=1` turns on GA DebugView for this tab (WeChat has no Tag Assistant); `?ga_debug=0` turns it off. */
function debugRequested(): boolean {
  try {
    const flag = new URLSearchParams(window.location.search).get("ga_debug");
    if (flag === "1") window.sessionStorage.setItem(DEBUG_KEY, "1");
    if (flag === "0") window.sessionStorage.removeItem(DEBUG_KEY);
    return window.sessionStorage.getItem(DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

function loadGtag(measurementId: string) {
  const inject = () => {
    if (protectCapabilityPage()) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  };
  // Commands already queue in `dataLayer`, so gtag.js can wait until the page has loaded.
  if (document.readyState === "complete") inject();
  else window.addEventListener("load", inject, { once: true });
}

let started = false;

/** Called once from `instrumentation-client.ts`, before hydration, so `config` precedes every page event. */
export function initAnalytics(measurementId: string | undefined) {
  if (started || typeof window === "undefined") return;
  started = true;
  configuredMeasurementId = measurementId;
  protectCapabilityPage();
  try {
    gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    gtag("js", new Date());
    gtag("set", "user_properties", { wechat_browser: String(isWeChat(navigator.userAgent)) });
    if (measurementId && MEASUREMENT_ID.test(measurementId)) {
      gtag("config", measurementId, {
        send_page_view: false,
        page_location: sanitizeLocation(window.location.href),
        page_referrer: sanitizeReferrer(document.referrer, window.location.origin),
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        // Any `debug_mode` value, even `false`, enables DebugView, so the key is only present on request.
        ...(debugRequested() ? { debug_mode: true } : {}),
      });
      loadGtag(measurementId);
    }
    trackPageView();
    document.addEventListener("click", trackClick, { capture: true });
  } catch {
    // Measurement must never break the page.
  }
}

/** Remembers purchases already sent from this browser; GA also deduplicates by `transaction_id`. */
function firstPurchaseReport(id: string): boolean {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(PURCHASES_KEY) ?? "[]");
    const seen = Array.isArray(stored) ? stored.filter((x): x is string => typeof x === "string") : [];
    if (seen.includes(id)) return false;
    window.localStorage.setItem(PURCHASES_KEY, JSON.stringify([...seen, id].slice(-20)));
  } catch {
    /* storage unavailable: rely on GA's deduplication */
  }
  return true;
}

/** `purchase` for a paid order, whichever surface noticed the payment first. */
export async function trackPurchase(order: OrderView) {
  if (typeof window === "undefined" || order.status !== "paid") return;
  try {
    const id = await transactionId(order.id);
    if (id && !firstPurchaseReport(id)) return;
    track("purchase", {
      ...reportCommerce(order.currency, order.amountFen),
      payment_mode: order.provider,
      payment_type: paymentTypeOf(order),
      transaction_id: id,
    });
  } catch {
    // Measurement must never break the page.
  }
}
