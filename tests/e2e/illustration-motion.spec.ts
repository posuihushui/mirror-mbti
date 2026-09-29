import { expect, test, type Locator } from "@playwright/test";

/** Running animations inside a scene, split into its entrance (finite) and its loops (infinite). */
function running(scene: Locator) {
  return scene.evaluate((node) => {
    const active = node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running");
    const loops = active.filter((animation) => animation.effect?.getTiming().iterations === Infinity).length;
    return { entrance: active.length - loops, loops };
  });
}

test("illustrations enter once, loop while seen and hold still off screen", async ({ page }) => {
  await page.goto("/zh/result/sample");
  const hero = page.locator("svg[data-scene]").first();
  // On screen at load: the entrance plays from first paint, then the loops take over.
  await expect(hero).toHaveAttribute("data-scene-motion", "live", { timeout: 10_000 });
  await expect.poll(async () => (await running(hero)).loops).toBeGreaterThan(0);
  expect((await running(hero)).entrance).toBe(0);

  // A scene below the fold waits, untouched, until it is seen.
  const card = page.locator("#dimensions svg[data-scene]").first();
  await expect(card).toHaveAttribute("data-scene-motion", "deferred");
  expect(await running(card)).toEqual({ entrance: 0, loops: 0 });
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute("data-scene-motion", /play|live/);
  await expect(card).toHaveAttribute("data-scene-motion", "live", { timeout: 10_000 });

  // Off screen, nothing moves.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(hero).toHaveAttribute("data-scene-paused", "");
  expect(await running(hero)).toEqual({ entrance: 0, loops: 0 });
});

test("a chapter shown again keeps its loops but never replays the entrance", async ({ page }) => {
  await page.goto("/zh/report/sample");
  const scene = page.locator("#chapter-panel-1 svg[data-scene]").first();
  await scene.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute("data-scene-motion", "live", { timeout: 10_000 });
  // The sample's contents open each chapter on phones and desktop alike.
  await page.getByRole("button", { name: /四组优势/ }).click();
  await expect(scene).toBeHidden();
  await page.getByRole("button", { name: /四个维度的长处/ }).click();
  await expect(scene).toBeVisible();
  expect((await running(scene)).entrance).toBe(0);
});

test("illustrations stay still for reduced motion and in print", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/zh/types/ESTP");
  for (const scene of await page.locator("svg[data-scene]").all()) {
    await expect(scene).toHaveAttribute("data-scene-motion", "done");
    expect(await scene.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
  await page.emulateMedia({ reducedMotion: "no-preference", media: "print" });
  await page.reload();
  for (const scene of await page.locator("svg[data-scene]").all()) {
    expect(await scene.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
});
