import { describe, expect, it } from "vitest";
import { llmsFullText, llmsText } from "@/lib/llms";
import { names, TYPES } from "@/lib/personality";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { faqs, site } from "@/lib/site";
import { typeContext } from "@/lib/type-context";

const ctx = { baseUrl: "https://mirror.example", priceLabel: "6.9" };

describe("pageMetadata", () => {
  it("keeps share defaults that shallow metadata merging would otherwise drop", () => {
    const meta = pageMetadata({ title: "16 种人格倾向", description: "d", path: "/types" });
    expect(meta.alternates?.canonical).toBe("/types");
    expect(meta.openGraph).toMatchObject({ siteName: site.name, locale: site.locale, url: "/types", title: `16 种人格倾向 · ${site.name}` });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })]);
  });
  it("points a segment's own share image at its public, locale-prefixed URL", () => {
    const zh = pageMetadata({ title: "INFJ", description: "d", path: "/types/INFJ", image: "/types/INFJ/opengraph-image" });
    expect(zh.openGraph?.images).toEqual([expect.objectContaining({ url: "/types/INFJ/opengraph-image" })]);
    expect(zh.twitter?.images).toEqual([expect.objectContaining({ url: "/types/INFJ/opengraph-image" })]);
    const en = pageMetadata({ locale: "en", title: "INFJ", description: "d", path: "/types/INFJ", image: "/types/INFJ/opengraph-image" });
    expect(en.openGraph?.images).toEqual([expect.objectContaining({ url: "/en/types/INFJ/opengraph-image" })]);
  });
  it("uses an absolute title without appending the brand twice", () => {
    const meta = pageMetadata({ title: site.title, description: "d", path: "/", absoluteTitle: true });
    expect(meta.title).toEqual({ absolute: site.title });
    expect(meta.openGraph?.title).toBe(site.title);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers items and resolves the home path to the origin", () => {
    const list = breadcrumbJsonLd(ctx.baseUrl, [["home", "/"], ["types", "/types"]]);
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "home", item: ctx.baseUrl },
      { "@type": "ListItem", position: 2, name: "types", item: `${ctx.baseUrl}/types` },
    ]);
  });
});

describe("typeContext definition", () => {
  it("names the type, its four poles and the self-exploration boundary", () => {
    const text = typeContext("INFJ").definition;
    expect(text).toContain("INFJ（提倡者）");
    expect(text).toContain("内向（I）、直觉（N）、情感（F）、判断（J）");
    expect(text).toContain("不代表能力");
  });
});

describe("llms files", () => {
  it("llms.txt links every public section, all 16 types and the price", () => {
    const text = llmsText(ctx);
    expect(text.startsWith(`# ${site.name}\n\n> `)).toBe(true);
    for (const path of ["/quiz", "/result/sample", "/report/sample", "/preferences", "/about", "/types", "/help", "/llms-full.txt"]) {
      expect(text).toContain(`](${ctx.baseUrl}${path})`);
    }
    for (const type of TYPES) expect(text).toContain(`[${type} ${names[type][0]}](${ctx.baseUrl}/types/${type})`);
    expect(text).toContain("¥6.9");
    expect(text).toContain("并非官方 MBTI 量表");
    expect(text).not.toMatch(/\/(my|pay|api)\//);
  });
  it("llms-full.txt carries the FAQ and every type definition", () => {
    const text = llmsFullText(ctx);
    for (const [q, a] of faqs(ctx.priceLabel)) expect(text).toContain(`### ${q}\n\n${a}`);
    for (const type of TYPES) expect(text).toContain(typeContext(type).definition);
  });
});
