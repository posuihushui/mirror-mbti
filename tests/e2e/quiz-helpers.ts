import { expect, type Page } from "@playwright/test";

const resultButton = /^(查看我的结果|查看结果|See my result|See result)$/;
const partButton = /^(继续第 \d+ 部分|Continue to part \d+)$/;

/**
 * Answers the question on screen. Every answer but the last moves on by itself after a short
 * confirmation, so this waits for the next question to replace it; the last answer is submitted
 * with the result button, which never happens by itself. The 64-item version pauses after each
 * part of 16; the pause is continued straight away, so callers always land on the next question.
 */
export async function answerQuestion(page: Page, option: number, last = false) {
  const title = page.locator("#question-title");
  const before = await title.innerText();
  await page.getByRole("group").getByRole("button").nth(option).click();
  if (last) {
    await page.getByRole("button", { name: resultButton }).filter({ visible: true }).first().click();
    return;
  }
  const resume = page.getByRole("button", { name: partButton }).filter({ visible: true });
  await expect(title.filter({ hasNotText: before }).or(resume)).toBeVisible();
  if (await resume.isVisible()) await resume.click();
  await expect(title).not.toHaveText(before);
}
