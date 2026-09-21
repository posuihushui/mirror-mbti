import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComparisonReading } from "@/components/compare/comparison-reading";
import { generateCompareContent } from "@/lib/compare-content";
import {
  COMPARE_GUEST_CONSENT_VERSION,
  COMPARE_HOST_CONSENT_VERSION,
  type CompareOutputSnapshotV1,
  type CompareOutputSnapshotV2,
} from "@/lib/compare-types";
import { compareMessages } from "@/lib/i18n/messages/compare";
import { pairingMessages } from "@/lib/i18n/messages/pairing";
import { getPairingExample } from "@/lib/pairing-example";

describe("paid pairing content and shared example", () => {
  it("uses separate current consent versions for each participant", () => {
    expect(COMPARE_HOST_CONSENT_VERSION).toBe("compare-host-v3");
    expect(COMPARE_GUEST_CONSENT_VERSION).toBe("compare-guest-v2");
  });

  it.each(["zh", "en"] as const)("uses the real generator with fixed fictional JP differences (%s)", (locale) => {
    const { host, guest, content } = getPairingExample(locale);
    expect(host.categories).toEqual({ EI: "balanced", SN: "balanced", TF: "balanced", JP: "J" });
    expect(guest.categories).toEqual({ EI: "balanced", SN: "balanced", TF: "balanced", JP: "P" });
    expect(content).toEqual(generateCompareContent(host, guest, locale));
    expect(content.highlight.dimension).toBe("JP");
    expect(content.highlight.body).toBe(compareMessages[locale].highlights.opposite.JP);
    expect(content.highlight.openingLine).toBe(compareMessages[locale].openingLines.JP);
    expect(content.practice).toBe(compareMessages[locale].practices.JP);
    expect(content.differentQuestionnaires).toBe(false);

    // Callers cannot mutate a shared module-level object and taint later examples.
    host.categories.JP = "balanced";
    content.highlight.openingLine = "changed";
    const fresh = getPairingExample(locale);
    expect(fresh.host.categories.JP).toBe("J");
    expect(fresh.content.highlight.openingLine).toBe(compareMessages[locale].openingLines.JP);
  });

  it.each(["zh", "en"] as const)("renders all frozen v3 content in static HTML, with and without enhancement (%s)", (locale) => {
    const content = getPairingExample(locale).content;
    for (const animate of [true, false]) {
      const html = renderToStaticMarkup(createElement(ComparisonReading, { content, locale, animate }));
      expect(html).toContain('data-compare-reading="compare-v3"');
      expect(html.match(/data-compare-card=/gu)).toHaveLength(4);
      for (const card of content.cards) {
        expect(html).toContain(card.body);
        expect(html).toContain(card.scene);
        expect(html).toContain(compareMessages[locale].themes[card.dimension]);
      }
      expect(html).toContain(content.highlight.body);
      expect(html).toContain(content.highlight.openingLine);
      expect(html).toContain(content.practice);
      expect(html).toContain(compareMessages[locale].cardsTitle);
      expect(html).not.toMatch(/<button|<a /u);
      if (locale === "en") expect(html).not.toMatch(/[\u3400-\u9fff]/u);
    }
  });

  it.each(["zh", "en"] as const)("previews only the emphasised dimension and says the guide covers four (%s)", (locale) => {
    const content = getPairingExample(locale).content;
    const html = renderToStaticMarkup(createElement(ComparisonReading, { content, locale, compact: true, animate: false }));
    expect(html.match(/data-compare-card=/gu)).toHaveLength(1);
    expect(html).toContain('data-compare-card="JP"');
    expect(html).toContain(compareMessages[locale].moreDimensions);
    expect(html).not.toContain(compareMessages[locale].cardsTitle);
    expect(html).toContain(content.highlight.body);
    expect(html).toContain(content.highlight.openingLine);
    for (const card of content.cards.filter(({ dimension }) => dimension !== "JP")) expect(html).not.toContain(card.body);
    // A preview never carries the paid reading's closing practice or its full note.
    expect(html).not.toContain(content.practice);
    expect(html).not.toContain(compareMessages[locale].note);
  });

  it.each(["zh", "en"] as const)("names both sides on a card when the reader knows who they are (%s)", (locale) => {
    const { host, guest, content } = getPairingExample(locale);
    const m = compareMessages[locale];
    const html = renderToStaticMarkup(createElement(ComparisonReading, {
      content, locale, animate: false,
      sides: { you: host.categories, other: guest.categories, youLabel: m.you, otherLabel: m.other },
    }));
    expect(html).toContain(`${m.you} ${m.categoryLabels.J}`);
    expect(html).toContain(`${m.other} ${m.categoryLabels.P}`);
    expect(html).toContain(`${m.you} ${m.categoryLabels.balanced}`);
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

  it("preserves stored v2 text rather than re-rendering it as a v3 reading", () => {
    const stored: CompareOutputSnapshotV2 = {
      contentVersion: "compare-v2", locale: "zh", differentQuestionnaires: false,
      sections: [
        { title: "存档第一章", body: "存档第一段。" },
        { title: "存档第二章", body: "存档第二段。" },
        { title: "存档第三章", body: "存档第三段。", openingLine: "存档的一句话。", practice: "存档的练习。" },
      ],
    };
    const html = renderToStaticMarkup(createElement(ComparisonReading, { content: stored, locale: "zh", animate: false }));
    expect(html).toContain('data-compare-reading="compare-v2"');
    expect(html.match(/<section /gu)).toHaveLength(3);
    expect(html).not.toContain("data-compare-card=");
    expect(html).not.toContain(compareMessages.zh.cardsTitle);
    for (const section of stored.sections) expect(html).toContain(section.body);
    expect(html).toContain("存档的一句话。");
    expect(html).toContain("存档的练习。");
  });

  it.each(["zh", "en"] as const)("introduces the invitation before testing and keeps consent explicit (%s)", (locale) => {
    const tokenUrl = "https://example.test/t/fictional-public-token";
    const message = pairingMessages[locale].invitationText(tokenUrl);
    expect(message).toContain(tokenUrl);
    expect(message).not.toMatch(/付费|解锁|订阅|续费|\bpaid\b|\bunlock|\bsubscription\b/iu);
    if (locale === "zh") {
      expect(message).toContain("各自完成测试并确认");
      expect(message).toContain("你确认后才会加入");
    } else {
      expect(message).toContain("each need to complete a test and confirm");
      expect(message).toContain("only join after agreeing");
      expect(message).not.toMatch(/[\u3400-\u9fff]/u);
    }
  });
});
