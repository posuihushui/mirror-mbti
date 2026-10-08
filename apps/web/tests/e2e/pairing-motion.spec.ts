import { expect, test } from "@playwright/test";

test("pairing reveals run once, keep actions outside, and settle for motion preferences", async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      if (this.matches("[data-pairing-reveal]") || this.parentElement?.matches("[data-pairing-reveal]")) {
        this.setAttribute("data-test-starts", String(Number(this.getAttribute("data-test-starts") ?? 0) + 1));
      }
      return animate.apply(this, args);
    };
  });
  await page.goto("/pairing");
  const panels = page.locator("[data-pairing-reveal]");
  await expect(page.locator("[data-pairing-reveal] a, [data-pairing-reveal] button")).toHaveCount(0);
  for (const panel of await panels.all()) {
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toHaveAttribute("data-motion", "done");
    await expect(panel).toHaveCSS("opacity", "1");
  }
  const animated = page.locator("[data-test-starts]");
  expect(await animated.count()).toBeGreaterThan(0);
  const starts = await animated.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-test-starts")));
  expect(starts.every(count => count === "1")).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await panels.last().scrollIntoViewIfNeeded();
  expect(await animated.evaluateAll(nodes => nodes.map(node => node.getAttribute("data-test-starts")))).toEqual(starts);

  for (const preference of ["reduce", "print"] as const) {
    await page.emulateMedia({ reducedMotion: "no-preference", media: "screen" });
    await page.reload();
    const target = page.locator("[data-pairing-reveal]").last();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveAttribute("data-motion", /running|done/);
    await page.emulateMedia(preference === "reduce" ? { reducedMotion: "reduce" } : { media: "print" });
    await expect(target).toHaveAttribute("data-motion", "done");
    await expect(target).toHaveCSS("opacity", "1");
    await expect.poll(() => target.evaluate(node => node.getAnimations({ subtree: true }).filter(a => a.playState === "running").length)).toBe(0);
  }
});
