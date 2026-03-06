import { test, expect } from "@playwright/test";
import { createE2ERunId, ensureHomeReady } from "../helpers/e2e";

test("Mora can log a weight and it becomes visible in the UI", async ({ page }) => {
  const weight = String(Number(`6.${String(Date.now()).slice(-2)}`));

  await ensureHomeReady(page);
  await page.getByRole("button", { name: "Mora" }).click();
  await expect(page.getByLabel("Mora AI Assistant")).toBeVisible();

  const composer = page.locator('[data-tour-step-id="mora-composer"]');
  const input = composer.getByPlaceholder("Ask Mora or tap mic...");
  const prompt = `Add a weight entry of ${weight} kg right now for the current baby.`;

  await input.click();
  await input.pressSequentially(prompt);

  const sendButton = composer.getByRole("button", { name: /send/i });
  await expect(sendButton).toBeEnabled();
  await sendButton.click();
  await expect(page.getByText(prompt)).toBeVisible({ timeout: 15_000 });

  const approvalButton = page.getByRole("button", { name: /Approve & Apply/i });
  if (await approvalButton.isVisible({ timeout: 20_000 }).catch(() => false)) {
    await approvalButton.click();
    await expect(approvalButton).not.toBeVisible({ timeout: 20_000 });
  }

  await expect(
    page.getByRole("main").getByText(new RegExp(`You logged a Growth .*${weight}kg`)).first()
  ).toBeVisible({ timeout: 60_000 });

  await page.getByLabel("Close Mora sidebar").click();
  await page.goto("/records");
  await page.getByRole("button", { name: "Growth" }).click();
  await expect(page.getByRole("main").getByText(`${weight}kg`)).toBeVisible({ timeout: 60_000 });
});
