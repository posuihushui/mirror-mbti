import { expect, type Page } from "@playwright/test";

const resultButton = /^(查看我的结果|查看结果|See my result|See result)$/;

/**
 * Answers the question on screen. Every answer but the last moves on by itself after a short
 * confirmation, so this waits for the next question to replace it; the last answer is submitted
 * with the result button, which never happens by itself.
 */
export async function answerQuestion(page: Page, option: number, last = false) {
  const title = page.locator("#question-title");
  const before = await title.innerText();
  await page.getByRole("group").getByRole("button").nth(option).click();
  if (last) {
    await page.getByRole("button", { name: resultButton }).filter({ visible: true }).first().click();
    return;
  }
  await expect(title).not.toHaveText(before);
}
