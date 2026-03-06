import path from "node:path";
import { test as setup, expect } from "@playwright/test";
import { signIn } from "../helpers/e2e";

const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

setup("authenticate existing user", async ({ page }) => {
  await signIn(page);
  await expect(page).not.toHaveURL(/\/onboarding$/);
  await page.context().storageState({ path: authFile });
});

