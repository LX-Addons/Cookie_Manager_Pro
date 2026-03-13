import { test as base, chromium, type BrowserContext, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { randomUUID } from "node:crypto";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionPath = path.join(__dirname, "..", "..", ".output", "chrome-mv3");

async function checkExtensionExists(): Promise<boolean> {
  try {
    await fs.promises.access(extensionPath);
    return true;
  } catch {
    return false;
  }
}

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: [
    async ({}, use) => {
      const extensionExists = await checkExtensionExists();
      if (!extensionExists) {
        throw new Error(`Extension not found at ${extensionPath}. Please run 'pnpm build' first.`);
      }

      const userDataDir = path.join(
        os.tmpdir(),
        `playwright-extension-${Date.now()}-${randomUUID()}`
      );
      const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
      });
      await use(context);
      await context.close();
    },
    { scope: "test" },
  ],
  extensionId: [
    async ({ context }, use) => {
      let [serviceWorker] = context.serviceWorkers();
      if (!serviceWorker) {
        serviceWorker = await context.waitForEvent("serviceworker");
      }
      const extensionId = serviceWorker.url().split("/")[2];
      await use(extensionId);
    },
    { scope: "test" },
  ],
});

export const expect = test.expect;
export type { Page };
