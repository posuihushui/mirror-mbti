import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { expect, test, type APIRequestContext } from "@playwright/test";
const origin = process.env.E2E_BASE_URL ?? "http://localhost:3000";
async function fixture(request: APIRequestContext) {
  await request.get("/");
  const result = await request.post("/api/results", { data: { answers: Array(32).fill(0) } });
  expect(result.status()).toBe(201);
  const { id } = (await result.json()).data;
  const options = (await (await request.get(`/api/results/${id}/share-options`)).json()).data;
  const response = await request.post("/api/shares", { headers: { origin }, data: { resultId: id, selectedIds: options.defaultSelectedIds, showType: false, showDimensions: false, consentVersion: "share-public-v1", requestId: randomUUID() } });
  expect(response.status()).toBe(201);
  return (await response.json()).data;
}
type ObservedWindow = Window & { shareStarts?: number };

test("public card reveals once; CTA remains outside animated ancestors", async ({ page }) => {
  const share = await fixture(page.request);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    (window as ObservedWindow).shareStarts = 0;
    const count = (node: Element) => { if (node.matches("[data-share-reveal]")) (window as ObservedWindow).shareStarts!++; };
    document.addEventListener("animationstart", event => { if (event.target instanceof Element) count(event.target); }, true);
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) { count(this); return original.apply(this, args); };
  });
  await page.goto(new URL(share.url).pathname);
  const card = page.locator("[data-share-card]");
  const cta = page.locator('main a[href="/quiz"]');
  await expect(cta).toBeEnabled();
  expect(await cta.evaluate(node => !!node.closest("[data-share-motion], [data-share-reveal]"))).toBe(false);
  await expect.poll(() => page.evaluate(() => (window as ObservedWindow).shareStarts ?? 0)).toBeGreaterThan(0);
  await expect.poll(() => card.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
  const starts = await page.evaluate(() => (window as ObservedWindow).shareStarts ?? 0);
  expect(starts).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await card.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => (window as ObservedWindow).shareStarts)).toBe(starts);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const node of await card.locator("[data-share-reveal]").all()) {
    await expect(node).toHaveCSS("opacity", "1");
    await expect(node).toHaveCSS("transform", "none");
  }
});

test("reduced motion, print, no-JS and 320/720/721 layouts retain complete card", async ({ page, browser }, info) => {
  const share = await fixture(page.request);
  const path = new URL(share.url).pathname;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mkdir("docs/verification/share-growth", { recursive: true });
  for (const width of [320, 720, 721]) {
    await page.setViewportSize({ width, height: 852 });
    await page.goto(path);
    const card = page.locator("[data-share-card]");
    await expect(card.locator("ol li")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await card.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length)).toBe(0);
    await page.screenshot({ path: `docs/verification/share-growth/breakpoint-${width}-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  }
  await page.emulateMedia({ media: "print" });
  for (const node of await page.locator("[data-share-reveal]").all()) {
    await expect(node).toHaveCSS("opacity", "1");
    await expect(node).toHaveCSS("transform", "none");
  }
  await page.screenshot({ path: `docs/verification/share-growth/print-${info.project.name}.png`, fullPage: true });
  const noJs = await browser.newContext({ baseURL: origin, javaScriptEnabled: false, viewport: { width: 393, height: 852 } });
  const staticPage = await noJs.newPage();
  await staticPage.goto(path);
  await expect(staticPage.locator("[data-share-card] ol li")).toHaveCount(3);
  for (const line of share.snapshot.lines) await expect(staticPage.locator("[data-share-card]")).toContainText(line);
  await expect(staticPage.locator('main a[href="/quiz"]')).toBeVisible();
  await staticPage.screenshot({ path: `docs/verification/share-growth/no-js-${info.project.name}.png`, fullPage: true });
  await noJs.close();
});
