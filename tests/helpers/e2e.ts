import { expect, type Locator, type Page } from "@playwright/test";
import { createRunId } from "./run-id";

export const TEST_EMAIL = process.env.TEST_EMAIL ?? "";
export const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "";

export function createE2ERunId(prefix: string) {
  return createRunId(prefix);
}

export async function signIn(page: Page) {
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  expect(response.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
}

export async function ensureHomeReady(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today's Summary" })).toBeVisible();
}

export async function openQuickLogger(page: Page) {
  await page.getByRole("button", { name: "Log Event" }).click();
  await expect(page.getByRole("heading", { name: "Log Event" })).toBeVisible();
}

export async function saveQuickLoggerEntry(page: Page) {
  await page.getByRole("button", { name: "Save Entry" }).click();
  await expect(page.getByRole("heading", { name: "Log Event" })).not.toBeVisible();
}

export async function getReminderCard(page: Page, title: string): Promise<Locator> {
  return page
    .locator("div.bg-card")
    .filter({
      has: page.getByText(title, { exact: true }),
    })
    .filter({
      has: page.getByRole("button", { name: "delete" }),
    })
    .first();
}
