import { test, expect } from "@playwright/test";
import { createE2ERunId, openQuickLogger, saveQuickLoggerEntry } from "../helpers/e2e";

test("trends show growth data and custom milestones can be added", async ({ page }) => {
  const title = `Milestone ${createE2ERunId("custom")}`;
  const weight = "6.58";

  await page.goto("/");
  await openQuickLogger(page);
  await page.getByRole("button", { name: "Growth" }).click();
  await page.getByLabel("Weight (kg)").fill(weight);
  await saveQuickLoggerEntry(page);

  await page.goto("/trends");
  await expect(page.getByRole("heading", { name: "Trends" })).toBeVisible();
  await page.getByRole("button", { name: "Growth" }).click();
  await expect(page.getByText("Weight for Age")).toBeVisible();
  await expect(page.getByText("No growth data yet")).not.toBeVisible();

  await page.goto("/milestones");
  await expect(page.getByRole("heading", { name: "Milestones" })).toBeVisible();
  await page.getByRole("button", { name: "Add milestone" }).click();
  await page.getByLabel("Milestone name").fill(title);
  await page.getByLabel("Note (optional)").fill("Playwright custom milestone");
  await page.getByRole("button", { name: "Add milestone" }).last().click();

  await expect(page.getByText(title)).toBeVisible();
});

