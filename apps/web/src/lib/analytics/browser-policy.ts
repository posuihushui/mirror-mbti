import { pageInfo } from "./url";

/** Unknown routes, free text and all query strings are discarded on the server too. */
export function browserPath(input: string) {
  const info = pageInfo(input.split(/[?#]/, 1)[0]);
  if (info.pageType === "other") return { ...info, path: info.locale === "zh" ? "/zh/[other]" : "/[other]" };
  if (info.pageType === "type_detail") return { ...info, path: info.locale === "zh" ? "/zh/types/[type]" : "/types/[type]" };
  return info;
}

export function referrerHost(input: string | undefined): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.length <= 253 ? url.hostname : null;
  } catch { return null; }
}

export function browserDevice(ua: string): "phone" | "tablet" | "desktop" {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  return /Mobile|iPhone|iPod/i.test(ua) ? "phone" : "desktop";
}
