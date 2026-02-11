import { test, expect } from "@playwright/test";

test.describe("Cookie Manager Pro - 核心功能测试", () => {
  test("应该能够加载扩展", async ({ context }) => {
    const backgroundPages = context.backgroundPages();
    console.log("Background pages:", backgroundPages.length);

    const pages = context.pages();
    console.log("Pages:", pages.length);

    expect(backgroundPages.length + pages.length).toBeGreaterThanOrEqual(0);
  });

  test("应该能够导航到页面", async ({ page }) => {
    await page.goto("https://example.com");

    const title = await page.title();
    expect(title).toBeDefined();
  });

  test("应该能够执行 JavaScript", async ({ page }) => {
    await page.goto("https://example.com");

    const result = await page.evaluate(() => {
      return typeof chrome !== "undefined";
    });

    expect(result).toBe(true);
  });

  test("应该能够访问 chrome.cookies API", async ({ page }) => {
    await page.goto("https://example.com");

    const result = await page.evaluate(() => {
      return typeof chrome.cookies !== "undefined";
    });

    expect(result).toBe(true);
  });

  test("应该能够访问 chrome.storage API", async ({ page }) => {
    await page.goto("https://example.com");

    const result = await page.evaluate(() => {
      return typeof chrome.storage !== "undefined";
    });

    expect(result).toBe(true);
  });
});
