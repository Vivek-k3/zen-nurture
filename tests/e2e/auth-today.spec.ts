import { test, expect } from "@playwright/test";
import { ensureHomeReady } from "../helpers/e2e";

test("existing account skips onboarding and loads Today", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/$/);

  await ensureHomeReady(page);
  await expect(page.getByRole("heading", { name: "Today's Summary" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("heading", { name: "Activity" })).toBeVisible();
});
