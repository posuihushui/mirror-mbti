import { describe, expect, it } from "vitest";
import { minorToValue, paymentTypeOf, priceLabelToMinor, reportCommerce, transactionId } from "@/lib/analytics/commerce";
import { progressMilestone, trackAttrs } from "@/lib/analytics/events";
import { pageInfo, sanitizeLocation, sanitizeReferrer } from "@/lib/analytics/url";
import { newOrderId } from "@/lib/ids";

const origin = "https://mirror.example";
const resultId = "aB3_dE5-gH7i";

describe("pageInfo", () => {
  it("classifies pages in both languages", () => {
    expect(pageInfo("/")).toEqual({ locale: "en", pageType: "home", path: "/" });
    expect(pageInfo("/zh")).toEqual({ locale: "zh", pageType: "home", path: "/zh" });
    expect(pageInfo("/quiz/")).toEqual({ locale: "en", pageType: "quiz", path: "/quiz" });
    expect(pageInfo("/types/INFJ")).toMatchObject({ pageType: "type_detail", path: "/types/INFJ" });
    expect(pageInfo("/result/sample")).toMatchObject({ pageType: "result_sample", path: "/result/sample" });
    expect(pageInfo("/zh/report/sample")).toMatchObject({ locale: "zh", pageType: "report_sample", path: "/zh/report/sample" });
    expect(pageInfo("/my/report")).toMatchObject({ pageType: "my_report", path: "/my/report" });
  });

  it("replaces result IDs and order numbers with placeholders", () => {
    const orderId = newOrderId();
    expect(pageInfo(`/result/${resultId}`)).toMatchObject({ pageType: "result", path: "/result/[id]" });
    expect(pageInfo(`/zh/report/${resultId}`)).toMatchObject({ pageType: "report", path: "/zh/report/[id]" });
    expect(pageInfo(`/pay/${orderId}`)).toMatchObject({ pageType: "pay", path: "/pay/[orderId]" });
    expect(pageInfo(`/somewhere/${orderId}/else`)).toMatchObject({ pageType: "other", path: "/somewhere/[orderId]/else" });
  });
});

describe("sanitizeLocation", () => {
  it("keeps only attribution parameters", () => {
    expect(sanitizeLocation(`${origin}/result/${resultId}?unlock=1&utm_source=wechat&from=timeline#top`)).toBe(`${origin}/result/[id]?utm_source=wechat&from=timeline`);
    expect(sanitizeLocation(`${origin}/report/sample?chapter=3&ga_debug=1`)).toBe(`${origin}/report/sample`);
  });
});

describe("sanitizeReferrer", () => {
  it("redacts this site's pages and drops other sites' queries", () => {
    expect(sanitizeReferrer(`${origin}/pay/${newOrderId()}?x=1`, origin)).toBe(`${origin}/pay/[orderId]`);
    expect(sanitizeReferrer("https://www.google.com/search?q=mbti", origin)).toBe("https://www.google.com/search");
    expect(sanitizeReferrer("", origin)).toBe("");
    expect(sanitizeReferrer("not a url", origin)).toBe("");
  });
});

describe("progressMilestone", () => {
  it("reports each quarter once, when it is crossed", () => {
    expect(progressMilestone(7, 8, 32)).toBe(25);
    expect(progressMilestone(8, 8, 32)).toBeNull();
    expect(progressMilestone(8, 9, 32)).toBeNull();
    expect(progressMilestone(15, 16, 64)).toBe(25);
    expect(progressMilestone(63, 64, 64)).toBe(100);
    expect(progressMilestone(0, 32, 32)).toBe(100);
  });
});

describe("commerce", () => {
  it("converts minor units and names the payment type", () => {
    expect(minorToValue(690)).toBe(6.9);
    expect(priceLabelToMinor("6.9")).toBe(690);
    expect(priceLabelToMinor("1")).toBe(100);
    expect(reportCommerce("CNY", 690)).toEqual({ currency: "CNY", value: 6.9, items: [{ item_id: "full_report", item_name: "Full report", item_category: "report", price: 6.9, quantity: 1 }] });
    expect(paymentTypeOf({ provider: "mock", channel: "mock" })).toBe("mock");
    expect(paymentTypeOf({ provider: "wechat", channel: "jsapi" })).toBe("wechat_jsapi");
    expect(paymentTypeOf({ provider: "crypto", channel: "solana" })).toBe("crypto_solana");
  });

  it("derives a stable, one-way transaction id", async () => {
    const orderId = newOrderId();
    const id = await transactionId(orderId);
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(await transactionId(orderId)).toBe(id);
    expect(await transactionId(newOrderId())).not.toBe(id);
  });
});

describe("trackAttrs", () => {
  it("renders the data attributes the delegated listener reads", () => {
    expect(trackAttrs("start_quiz", "hero")).toEqual({ "data-track": "start_quiz", "data-track-location": "hero" });
  });
});
