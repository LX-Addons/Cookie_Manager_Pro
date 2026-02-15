import { test, expect, Page, BrowserContext } from "@playwright/test";

async function getExtensionId(context: BrowserContext): Promise<string> {
  const existingWorker = context.serviceWorkers()[0];
  if (existingWorker) {
    const url = existingWorker.url();
    const id = url.split("/")[2];
    if (id && id.length > 0) {
      return id;
    }
  }

  const background = await context.waitForEvent("serviceworker", { timeout: 5000 });
  const url = background.url();
  const id = url.split("/")[2];

  if (!id || id.length === 0) {
    throw new Error("Failed to get extension ID: invalid service worker URL");
  }

  return id;
}

async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  return popup;
}

test.describe("Extension Loading", () => {
  test("should load extension with valid service worker", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBeGreaterThan(0);
  });
});

test.describe("Popup Basic Functionality", () => {
  test("should open popup and display title with tabs", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    await expect(popup.locator("h1")).toContainText("Cookie Manager Pro");

    await expect(popup.getByRole("tab", { name: /管理/ })).toBeVisible();
    await expect(popup.getByRole("tab", { name: /白名单|黑名单/ })).toBeVisible();
    await expect(popup.getByRole("tab", { name: /设置/ })).toBeVisible();
    await expect(popup.getByRole("tab", { name: /日志/ })).toBeVisible();

    await popup.close();
  });

  test("should switch tabs correctly", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const manageTab = popup.getByRole("tab", { name: /管理/ });
    const settingsTab = popup.getByRole("tab", { name: /设置/ });

    await expect(manageTab).toHaveAttribute("aria-selected", "true");

    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute("aria-selected", "true");
    await expect(manageTab).toHaveAttribute("aria-selected", "false");
    await expect(popup.getByRole("tabpanel")).toContainText("工作模式");

    await popup.close();
  });
});

test.describe("Cookie Operations", () => {
  test("should display cookie statistics", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    await expect(popup.locator(".section").filter({ hasText: "Cookie统计" })).toBeVisible();

    const statLabels = popup.locator(".stat-label");
    await expect(statLabels.nth(0)).toContainText("总数");
    await expect(statLabels.nth(1)).toContainText("当前网站");
    await expect(statLabels.nth(2)).toContainText("会话");
    await expect(statLabels.nth(3)).toContainText("持久");
    await expect(statLabels.nth(4)).toContainText("第三方");
    await expect(statLabels.nth(5)).toContainText("追踪");

    await popup.close();
  });

  test("should display quick action buttons", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    await expect(popup.getByRole("button", { name: /添加到白名单/ })).toBeVisible();
    await expect(popup.getByRole("button", { name: /添加到黑名单/ })).toBeVisible();
    await expect(popup.getByRole("button", { name: /清除当前网站/ })).toBeVisible();
    await expect(popup.getByRole("button", { name: /清除所有Cookie/ })).toBeVisible();

    await popup.close();
  });

  test("should show and close confirm dialog", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const clearCurrentBtn = popup.getByRole("button", { name: /清除当前网站/ });
    await clearCurrentBtn.click();

    await expect(popup.locator(".confirm-dialog")).toBeVisible();
    await expect(popup.getByText("清除确认")).toBeVisible();

    const cancelBtn = popup.getByRole("button", { name: "取消" });
    await cancelBtn.click();

    await expect(popup.locator(".confirm-dialog")).not.toBeVisible();

    await popup.close();
  });

  test("should expand and collapse cookie list", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const header = popup.locator(".cookie-list-header");

    await header.click();
    await expect(popup.locator(".cookie-list")).toBeVisible();

    await header.click();
    await expect(popup.locator(".cookie-list")).not.toBeVisible();

    await popup.close();
  });
});

test.describe("Domain Management", () => {
  test("should display domain management interface", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const domainTab = popup.getByRole("tab", { name: /白名单|黑名单/ });
    await domainTab.click();

    await expect(popup.locator('input[placeholder="例如: google.com"]')).toBeVisible();
    await expect(popup.getByRole("button", { name: "添加" })).toBeVisible();
    await expect(popup.getByRole("button", { name: "添加当前网站" })).toBeVisible();

    await popup.close();
  });

  test("should show error for empty domain", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const domainTab = popup.getByRole("tab", { name: /白名单|黑名单/ });
    await domainTab.click();

    const addButton = popup.getByRole("button", { name: "添加" });
    await addButton.click();

    await expect(popup.locator(".message")).toBeVisible();

    await popup.close();
  });

  test("should show error for invalid domain", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const domainTab = popup.getByRole("tab", { name: /白名单|黑名单/ });
    await domainTab.click();

    const input = popup.locator('input[placeholder="例如: google.com"]');
    await input.fill("invalid domain with spaces");

    const addButton = popup.getByRole("button", { name: "添加" });
    await addButton.click();

    await expect(popup.locator(".message")).toBeVisible();

    await popup.close();
  });
});

test.describe("Settings", () => {
  test("should display settings panel with all options", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const settingsTab = popup.getByRole("tab", { name: /设置/ });
    await settingsTab.click();

    await expect(popup.getByText("工作模式")).toBeVisible();
    await expect(popup.getByText("Cookie清除类型")).toBeVisible();
    await expect(popup.getByText("定时清理")).toBeVisible();
    await expect(popup.getByText("日志保留时长")).toBeVisible();
    await expect(popup.getByText("主题模式")).toBeVisible();
    await expect(popup.getByText("自动清理")).toBeVisible();
    await expect(popup.getByText("隐私保护")).toBeVisible();
    await expect(popup.getByText("高级清理")).toBeVisible();

    await popup.close();
  });

  test("should display theme options", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const settingsTab = popup.getByRole("tab", { name: /设置/ });
    await settingsTab.click();

    await expect(popup.getByLabel("跟随浏览器")).toBeVisible();
    await expect(popup.getByLabel("亮色")).toBeVisible();
    await expect(popup.getByLabel("暗色")).toBeVisible();
    await expect(popup.getByLabel("自定义")).toBeVisible();

    await popup.close();
  });

  test("should show custom theme settings when selected", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const settingsTab = popup.getByRole("tab", { name: /设置/ });
    await settingsTab.click();

    const customRadio = popup.getByLabel("自定义");
    await customRadio.click();

    await expect(popup.locator(".custom-theme-settings")).toBeVisible();
    await expect(popup.getByLabel("主色调")).toBeVisible();
    await expect(popup.getByLabel("成功色")).toBeVisible();
    await expect(popup.getByLabel("警告色")).toBeVisible();
    await expect(popup.getByLabel("危险色")).toBeVisible();

    await popup.close();
  });
});

test.describe("Clear Log", () => {
  test("should display log panel with buttons", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const logTab = popup.getByRole("tab", { name: /日志/ });
    await logTab.click();

    await expect(popup.getByText("清除日志")).toBeVisible();
    await expect(popup.getByRole("button", { name: /清除全部/ })).toBeVisible();

    await popup.close();
  });
});

test.describe("Accessibility", () => {
  test("should have proper tab ARIA attributes", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const tabs = popup.locator('[role="tab"]');
    expect(await tabs.count()).toBe(4);

    const manageTab = popup.getByRole("tab", { name: /管理/ });
    await expect(manageTab).toHaveAttribute("aria-selected", "true");
    await expect(manageTab).toHaveAttribute("aria-controls", "manage-panel");

    await popup.close();
  });

  test("should have proper tabpanel structure", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const managePanel = popup.locator("#manage-panel");
    await expect(managePanel).toBeVisible();
    await expect(managePanel).toHaveAttribute("role", "tabpanel");

    await popup.close();
  });

  test("should have aria-expanded on cookie list header", async ({ context }) => {
    const extensionId = await getExtensionId(context);
    const popup = await openPopup(context, extensionId);

    const cookieListHeader = popup.locator(".cookie-list-header");
    await expect(cookieListHeader).toHaveAttribute("aria-expanded");

    await popup.close();
  });
});
