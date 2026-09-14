import { expect, test, type Locator, type Page } from "@playwright/test";

type MotionTestWindow = Window & { radarMotionStarts?: WeakMap<Element, number> };

/** Observe both first-paint CSS motion and the deferred viewport reveal. */
async function recordRadarMotion(page: Page) {
  await page.addInitScript(() => {
    const starts = new WeakMap<Element, number>();
    (window as MotionTestWindow).radarMotionStarts = starts;
    const record = (element: Element) => {
      if (element.matches("[data-radar-outline], [data-radar-fill]")) {
        starts.set(element, (starts.get(element) ?? 0) + 1);
      }
    };
    document.addEventListener("animationstart", (event) => {
      if (event.target instanceof Element) record(event.target);
    }, true);
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      record(this);
      return animate.apply(this, args);
    };
  });
}

async function radarStarts(radar: Locator) {
  return radar.locator("[data-radar-fill], [data-radar-outline]").evaluateAll((paths) =>
    paths.map((path) => (window as MotionTestWindow).radarMotionStarts?.get(path) ?? 0),
  );
}

async function expectCompleteRadar(radar: Locator) {
  await expect(radar.getByRole("img")).toBeVisible();
  await expect(radar.locator("[data-radar-fill]")).toHaveCSS("opacity", "1");
  await expect(radar.locator("[data-radar-outline]")).toHaveCSS("stroke-dashoffset", "0px");
  await expect.poll(() => radar.evaluate((root) => root.getAnimations({ subtree: true })
    .filter((animation) => animation.playState === "running" || animation.pending).length)).toBe(0);
}

function chapterNavigation(page: Page) {
  return page.locator('nav[aria-label="报告章节"] button, [role="tablist"][aria-label="报告章节"] [role="tab"]').filter({ visible: true });
}

test.describe("first-round motion", () => {
  test("reduced motion keeps home, result and report content complete without animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const homeMotion = page.locator(".home-title-motion, .home-description-motion, .home-portrait-motion");
    await expect(homeMotion).toHaveCount(4);
    for (const element of await homeMotion.all()) {
      await expect(element).toBeVisible();
      await expect(element).toHaveCSS("opacity", "1");
      await expect(element).toHaveCSS("transform", "none");
      await expect(element).toHaveCSS("animation-name", "none");
    }
    await expect(page.getByRole("link", { name: /开始人格测试/ }).first()).toBeVisible();

    for (const path of ["/result/sample", "/report/sample"]) {
      await page.goto(path);
      const radar = page.locator("[data-radar-motion]");
      await expect(radar).toHaveAttribute("data-radar-motion", "done");
      await radar.scrollIntoViewIfNeeded();
      await expectCompleteRadar(radar);
      for (const element of await radar.locator("[data-radar-fill], [data-radar-outline]").all()) {
        await expect(element).toHaveCSS("animation-name", "none");
      }
    }
    await chapterNavigation(page).nth(1).click();
    const chapter = page.locator("#chapter-panel-2");
    await expect(chapter).toBeVisible();
    await expect(chapter).toHaveCSS("opacity", "1");
    await expect(chapter).toHaveCSS("transform", "none");
    await expect(chapter).toHaveCSS("animation-name", "none");
  });

  test("a result radar draws when scrolled into view and never repeats on return", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    // Keep each project's layout width, but force the chart below the first viewport.
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 160 });
    await recordRadarMotion(page);
    await page.goto("/result/sample");
    const radar = page.locator("[data-radar-motion]");
    await expect(radar).toHaveAttribute("data-radar-motion", "deferred");
    const beforeReveal = await radarStarts(radar);
    await radar.scrollIntoViewIfNeeded();
    await expect(radar).toHaveAttribute("data-radar-motion", "done");
    await expectCompleteRadar(radar);
    const afterReveal = await radarStarts(radar);
    expect(afterReveal).toHaveLength(2);
    afterReveal.forEach((starts, index) => expect(starts).toBeGreaterThan(beforeReveal[index]));

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(radar).not.toBeInViewport();
    await radar.scrollIntoViewIfNeeded();
    await expect(radar).toBeInViewport();
    await expectCompleteRadar(radar);
    expect(await radarStarts(radar)).toEqual(afterReveal);
  });

  test("returning to report chapter one keeps the completed radar without replaying it", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await recordRadarMotion(page);
    await page.goto("/report/sample");
    const radar = page.locator("[data-radar-motion]");
    await radar.scrollIntoViewIfNeeded();
    await expect(radar).toHaveAttribute("data-radar-motion", "done");
    await expectCompleteRadar(radar);
    const firstReveal = await radarStarts(radar);
    expect(firstReveal).toHaveLength(2);
    firstReveal.forEach((starts) => expect(starts).toBeGreaterThan(0));

    await chapterNavigation(page).nth(1).click();
    await expect(page.locator("#chapter-panel-2")).toBeVisible();
    await expect(radar).toBeHidden();
    await chapterNavigation(page).nth(0).click();
    await expect(page.locator("#chapter-panel-1")).toBeVisible();
    await radar.scrollIntoViewIfNeeded();
    await expectCompleteRadar(radar);
    expect(await radarStarts(radar)).toEqual(firstReveal);
  });

  test("rapid chapter changes keep the original panels, selection and URL in sync", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    // A hydrated deep link gives us an observable ready state before rapid clicks.
    await page.goto("/report/sample?chapter=4");
    await expect(page.locator("#chapter-panel-4")).toBeVisible();
    const states = await page.evaluate(async () => {
      const panels = Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
      const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tablist"][aria-label="报告章节"] [role="tab"]'));
      const sidebar = Array.from(document.querySelectorAll<HTMLButtonElement>('nav[aria-label="报告章节"] button'));
      const controls = window.matchMedia("(min-width: 721px)").matches ? sidebar : tabs;
      const observations = [];
      // Click every frame while the previous chapter's entrance is still running.
      for (const index of [1, 0, 3, 1, 2, 0, 3]) {
        controls[index].click();
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        observations.push({
          index,
          chapter: new URLSearchParams(location.search).get("chapter"),
          visiblePanels: panels.filter((panel) => !panel.hidden).map((panel) => panel.id),
          selectedTabs: tabs.flatMap((tab, i) => tab.getAttribute("aria-selected") === "true" ? [i] : []),
          selectedSidebar: sidebar.flatMap((button, i) => button.getAttribute("aria-current") === "true" ? [i] : []),
          originalPanels: panels.length === 4 && panels.every((panel) => panel.isConnected && document.getElementById(panel.id) === panel),
          motionRunning: panels[index].getAnimations().some((animation) => animation.playState === "running"),
        });
      }
      return observations;
    });
    for (const state of states) {
      expect(state.originalPanels).toBe(true);
      expect(state.chapter).toBe(state.index === 0 ? null : String(state.index + 1));
      expect(state.visiblePanels).toEqual([`chapter-panel-${state.index + 1}`]);
      expect(state.selectedTabs).toEqual([state.index]);
      expect(state.selectedSidebar).toEqual([state.index]);
    }
    expect(states.some((state) => state.motionRunning)).toBe(true);
    await expect(page.locator('[role="tabpanel"]')).toHaveCount(4);
    await expect(page.locator("#chapter-panel-4")).toBeVisible();
    await expect(page).toHaveURL(/chapter=4$/);
  });
});
