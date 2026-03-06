import { test, expect } from "@playwright/test";
import { createE2ERunId, ensureHomeReady, openQuickLogger, saveQuickLoggerEntry } from "../helpers/e2e";

test("quick logger entries appear in Today and Records, and records can be edited", async ({ page }) => {
  const runId = createE2ERunId("records");
  const bottleFormula = `QA Formula ${runId}`;
  const bottleVolume = 177;
  const updatedBottleVolume = bottleVolume + 1;

  await ensureHomeReady(page);

  await openQuickLogger(page);
  const drawer = page.locator("div.fixed.inset-y-0.right-0").last();
  await drawer.getByRole("button", { name: "Feed" }).click();
  await drawer.getByLabel("Amount").fill(String(bottleVolume));
  await drawer.getByRole("button", { name: /select formula/i }).click();
  await drawer.getByRole("button", { name: "Add custom formula" }).click();
  await drawer.getByPlaceholder("Type formula name...").fill(bottleFormula);
  await drawer
    .locator("div.absolute.z-50")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await saveQuickLoggerEntry(page);
  await expect(page.getByText(bottleFormula)).toBeVisible();

  await openQuickLogger(page);
  await drawer.getByRole("button", { name: "Diaper" }).click();
  await drawer.getByRole("button", { name: "mixed" }).click();
  await drawer.getByRole("button", { name: "mushy" }).click();
  await drawer.getByRole("button", { name: "red" }).click();
  await saveQuickLoggerEntry(page);

  await page.goto("/records");
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();
  const recordsMain = page.getByRole("main");

  await recordsMain.getByRole("button", { name: "Bottle Feed", exact: true }).click();
  await expect(page.getByText(bottleFormula)).toBeVisible();
  await page.getByText(bottleFormula).click();
  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Amount (ml)").fill(String(updatedBottleVolume));
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText(`${updatedBottleVolume}ml · ${bottleFormula}`)).toBeVisible();

  await recordsMain.getByRole("button", { name: "Diaper", exact: true }).click();
  await expect(
    page
      .getByRole("main")
      .getByRole("button", { name: /Diaper .* mixed · mushy · red/ })
      .first()
  ).toBeVisible();
});
