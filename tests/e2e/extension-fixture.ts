/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.join(__dirname, "..", "..", "build", "chrome-mv3-prod");

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const userDataDir = path.join(os.tmpdir(), `playwright-extension-${Date.now()}`);
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }
    const extensionId = serviceWorker.url().split("/")[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
export type { Page };
