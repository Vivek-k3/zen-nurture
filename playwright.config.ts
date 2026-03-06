import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const defaultBaseURL = "http://127.0.0.1:3005";
const baseURL = process.env.TEST_BASE_URL ?? defaultBaseURL;
const authFile = path.join(__dirname, "playwright/.auth/user.json");
const shouldStartLocalServer = baseURL === defaultBaseURL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: "list",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
    },
  ],
  webServer: shouldStartLocalServer
    ? {
        command: "pnpm exec next dev --hostname 127.0.0.1 --port 3005",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 180_000,
      }
    : undefined,
});

