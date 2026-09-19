import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComparisonReading } from "@/components/compare/comparison-reading";
import { generateCompareContent } from "@/lib/compare-content";
import {
  COMPARE_GUEST_CONSENT_VERSION,
  COMPARE_HOST_CONSENT_VERSION,
  type CompareOutputSnapshotV1,
} from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { getPairingExample } from "@/lib/pairing-example";

describe("paid pairing content and shared example", () => {
  it("uses separate current consent versions for each participant", () => {
    expect(COMPARE_HOST_CONSENT_VERSION).toBe("compare-host-v2");
    expect(COMPARE_GUEST_CONSENT_VERSION).toBe("compare-guest-v2");
  });

  it.each(["zh", "en"] as const)("uses the real generator with fixed fictional JP differences (%s)", (locale) => {
    const { host, guest, content } = getPairingExample(locale);
    expect(host.categories).toEqual({ EI: "balanced", SN: "balanced", TF: "balanced", JP: "J" });
    expect(guest.categories).toEqual({ EI: "balanced", SN: "balanced", TF: "balanced", JP: "P" });
    expect(content).toEqual(generateCompareContent(host, guest, locale));
    expect(content.sections[1].body).toBe(compareMessages[locale].opposite.JP);
    expect(content.sections[2].openingLine).toBe(compareMessages[locale].openingLines.JP);
    expect(content.sections[2].practice).toBe(compareMessages[locale].practices.JP);
    expect(content.differentQuestionnaires).toBe(false);

    // Callers cannot mutate a shared module-level object and taint later examples.
    host.categories.JP = "balanced";
    content.sections[2].openingLine = "changed";
    const fresh = getPairingExample(locale);
    expect(fresh.host.categories.JP).toBe("J");
    expect(fresh.content.sections[2].openingLine).toBe(compareMessages[locale].openingLines.JP);
  });

  it.each(["zh", "en"] as const)("renders all frozen v2 content in static HTML, with and without enhancement (%s)", (locale) => {
    const content = getPairingExample(locale).content;
    for (const animate of [true, false]) {
      const html = renderToStaticMarkup(createElement(ComparisonReading, { content, locale, animate }));
      expect(html.match(/<section /gu)).toHaveLength(3);
      expect(html).toContain('data-compare-reading="compare-v2"');
      for (const section of content.sections) {
        expect(html).toContain(section.title);
        expect(html).toContain(section.body);
      }
      expect(html).toContain(content.sections[2].openingLine);
      expect(html).toContain(content.sections[2].practice);
      expect(html).not.toMatch(/<button|<a /u);
      if (locale === "en") expect(html).not.toMatch(/[\u3400-\u9fff]/u);
    }
  });

  it.each(["zh", "en"] as const)("compact preview renders exactly the same second and third sections (%s)", (locale) => {
    const content = getPairingExample(locale).content;
    const html = renderToStaticMarkup(createElement(ComparisonReading, { content, locale, compact: true, animate: false }));
    expect(html.match(/<section /gu)).toHaveLength(2);
    expect(html).not.toContain(content.sections[0].body);
    expect(html).toContain(content.sections[1].body);
    expect(html).toContain(content.sections[2].body);
    expect(html).toContain(content.sections[2].openingLine);
    expect(html).toContain(content.sections[2].practice);
  });

  it("preserves stored v1 text and does not inject v2 examples or practice labels", () => {
    const historical: CompareOutputSnapshotV1 = {
      contentVersion: "compare-v1", locale: "en", differentQuestionnaires: true,
      sections: [
        { title: "Stored first heading", body: "Stored first paragraph." },
        { title: "Stored second heading", body: "Stored second paragraph." },
        { title: "Stored third heading", body: "Stored third paragraph.", practice: "Stored practice." },
      ],
    };
    const html = renderToStaticMarkup(createElement(ComparisonReading, { content: historical, locale: "en", animate: false }));
    for (const section of historical.sections) {
      expect(html).toContain(section.title);
      expect(html).toContain(section.body);
    }
    expect(html).toContain("Stored practice.");
    expect(html).toContain(compareMessages.en.differentQuestionnaires);
    expect(html).not.toContain(compareMessages.en.openingLineLabel);
    expect(html).not.toContain(compareMessages.en.practiceLabel);
    expect(html).not.toContain("<blockquote");
  });

  it.each(["zh", "en"] as const)("makes the invitation text's fee and consent requirements explicit (%s)", (locale) => {
    const tokenUrl = "https://example.test/t/fictional-public-token";
    const message = pairingMessages[locale].invitationText(tokenUrl);
    expect(message).toContain(tokenUrl);
    if (locale === "zh") {
      expect(message).toContain("各自完成测试并解锁用于配对的报告");
      expect(message).toContain("你确认后才会加入");
    } else {
      expect(message).toContain("each need to complete a test and unlock the report we use");
      expect(message).toContain("only join after agreeing");
      expect(message).not.toMatch(/[\u3400-\u9fff]/u);
    }
  });
});
