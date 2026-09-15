import type { Locale } from "@/lib/i18n/locale";

export type PageType =
  | "home"
  | "quiz"
  | "result"
  | "result_sample"
  | "report"
  | "report_sample"
  | "pay"
  | "my_report"
  | "types"
  | "type_detail"
  | "preferences"
  | "about"
  | "help"
  | "privacy"
  | "terms"
  | "share"
  | "invitation"
  | "comparison"
  | "my_shares"
  | "other";

const STATIC_PAGES: Record<string, PageType> = {
  quiz: "quiz",
  types: "types",
  preferences: "preferences",
  about: "about",
  help: "help",
  privacy: "privacy",
  terms: "terms",
};

/** Campaign and share parameters GA attributes traffic with; WeChat shares append `from=`. Everything else is dropped. */
const ATTRIBUTION_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "gclid", "gbraid", "wbraid", "from"];

const ORDER_NUMBER = /M\d{8}[0-9A-F]{16,22}/gi;

function classify(path: string): [PageType, string] {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return ["home", "/"];
  const [first, second] = segments;
  if (first === "s") return ["share", `/s/[token]${segments[2] === "image" ? "/image" : ""}`];
  if (first === "t") return ["invitation", `/t/[token]${segments[2] === "join" ? "/join" : ""}`];
  if (first === "compare") return ["comparison", "/compare/[id]"];
  if (first === "my" && second === "shares") return ["my_shares", "/my/shares"];
  if (segments.length === 1 && STATIC_PAGES[first]) return [STATIC_PAGES[first], `/${first}`];
  if (segments.length === 2) {
    if (first === "result") return second === "sample" ? ["result_sample", "/result/sample"] : ["result", "/result/[id]"];
    if (first === "report") return second === "sample" ? ["report_sample", "/report/sample"] : ["report", "/report/[id]"];
    if (first === "pay") return ["pay", "/pay/[orderId]"];
    if (first === "my" && second === "report") return ["my_report", "/my/report"];
    if (first === "types") return ["type_detail", `/types/${second.replace(ORDER_NUMBER, "[orderId]")}`];
  }
  return ["other", path.replace(ORDER_NUMBER, "[orderId]")];
}

/**
 * Page type, language and the path GA may see. Result IDs and order numbers become placeholders:
 * order numbers recover a visitor, and result links expose someone's result.
 */
export function pageInfo(pathname: string): { locale: Locale; pageType: PageType; path: string } {
  const normalized = pathname.replace(/^\/zh(?=\/|$)/, "") || "/";
  const trimmed = normalized.replace(/\/+$/, "") || "/";
  const en = trimmed === "/en" || trimmed.startsWith("/en/");
  const [pageType, path] = classify(en ? trimmed.slice(3) : trimmed);
  return { locale: en ? "en" : "zh", pageType, path: en ? (path === "/" ? "/en" : `/en${path}`) : path };
}

/** `page_location` for GA: redacted path plus attribution parameters only. */
export function sanitizeLocation(href: string): string {
  const url = new URL(href);
  const params = new URLSearchParams();
  const sensitive = /^(?:\/(?:en|zh))?\/(?:s|t|compare|my\/shares)(?:\/|$)/.test(url.pathname);
  for (const key of sensitive ? [] : ATTRIBUTION_PARAMS) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value.slice(0, 100));
  }
  const query = params.toString();
  return `${url.origin}${pageInfo(url.pathname).path}${query ? `?${query}` : ""}`;
}

/** `page_referrer` for GA: our own pages are redacted like `page_location`; other sites keep origin and path. */
export function sanitizeReferrer(referrer: string, origin: string): string {
  if (!referrer) return "";
  try {
    const url = new URL(referrer);
    if (url.origin === origin) return `${url.origin}${pageInfo(url.pathname).path}`;
    return `${url.origin}${url.pathname.replace(ORDER_NUMBER, "[orderId]")}`;
  } catch {
    return "";
  }
}
