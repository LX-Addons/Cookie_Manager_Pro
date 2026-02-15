import { defineConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.join(__dirname, "build", "chrome-mv3-prod");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  globalTimeout: 600000,
  expect: {
    timeout: 10000,
  },
  reporter: [["list"], ["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: false,
    launchOptions: {
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    },
  },
  projects: [
    {
      name: "chromium",
    },
  ],
  outputDir: "test-results",
});
