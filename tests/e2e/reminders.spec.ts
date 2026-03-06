import { test, expect } from "@playwright/test";
import { createE2ERunId } from "../helpers/e2e";

test("reminders can be created, toggled, and deleted", async ({ page }) => {
  const title = `Reminder ${createE2ERunId("feed")}`;

  await page.goto("/reminders");
  await expect(page.getByRole("heading", { name: "Reminders" })).toBeVisible();

  await page.getByRole("button", { name: "Add Reminder" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create Reminder" }).click();

  const reminderRuleTitle = page.getByText(title, { exact: true }).last();
  await expect(reminderRuleTitle).toBeVisible();

  const card = reminderRuleTitle.locator("xpath=ancestor::div[3]");
  await expect(card).toBeVisible();

  const toggle = card.locator("button").first();
  await expect(toggle).toHaveClass(/bg-sage/);
  await toggle.click();
  await expect(toggle).not.toHaveClass(/bg-sage/);

  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "delete" }).click();
  await expect(card).not.toBeVisible();
});
