import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LogRetention, CookieClearType, ThemeMode, ModeType, ScheduleInterval } from "@/types";

const mockStorageData = new Map<string, unknown>();
const DEFAULT_SETTINGS_OVERRIDES: Partial<Record<string, unknown>> = {};

const createSettings = (
  overrides: Partial<Record<string, unknown>> = DEFAULT_SETTINGS_OVERRIDES
) => ({
  clearType: CookieClearType.ALL,
  logRetention: LogRetention.SEVEN_DAYS,
  themeMode: ThemeMode.AUTO,
  mode: ModeType.WHITELIST,
  enableAutoCleanup: false,
  scheduleInterval: ScheduleInterval.DISABLED,
  lastScheduledCleanup: 0,
  clearCache: false,
  clearLocalStorage: false,
  clearIndexedDB: false,
  cleanupOnTabDiscard: false,
  cleanupOnStartup: false,
  cleanupExpiredCookies: false,
  cleanupOnTabClose: false,
  cleanupOnBrowserClose: false,
  cleanupOnNavigate: false,
  showCookieRisk: false,
  locale: "zh-CN",
  ...overrides,
});

// 注意：wxt/utils/storage 的 mock 已在 tests/setup.ts 中定义
// 这里不再重复定义，以避免 mock 冲突

vi.mock("@/utils/cleanup/cleanup-runner", () => ({
  runCleanup: vi.fn(() =>
    Promise.resolve({
      count: 5,
      clearedDomains: ["example.com"],
      success: true,
      durationMs: 100,
      cookiesRemoved: 5,
      matchedDomains: ["example.com"],
    })
  ),
  runCleanupWithFilter: vi.fn(() =>
    Promise.resolve({
      count: 10,
      clearedDomains: ["test.com", "example.com"],
      success: true,
      durationMs: 100,
      cookiesRemoved: 10,
      matchedDomains: ["test.com", "example.com"],
    })
  ),
}));

vi.mock("@/entrypoints/background/services/metrics", () => ({
  metricsService: {
    recordCleanup: vi.fn(),
    recordExpiredCookiesCleanup: vi.fn(),
    recordAction: vi.fn(),
    recordEvent: vi.fn(),
    recordError: vi.fn(),
    recordMetrics: vi.fn(),
    getMetrics: vi.fn(),
    reset: vi.fn(),
  },
}));

vi.mock("@/entrypoints/background/services/log-service", () => ({
  logService: {
    logCleanup: vi.fn(() => Promise.resolve()),
    logError: vi.fn(() => Promise.resolve()),
    clearLogs: vi.fn(() => Promise.resolve()),
    getLogs: vi.fn(() => Promise.resolve([])),
    exportLogs: vi.fn(() => Promise.resolve("")),
  },
}));

vi.mock("@/entrypoints/background/services/error-reporting", () => ({
  classifyError: vi.fn(() => ({
    code: "INTERNAL_ERROR",
    message: "Test error",
  })),
  reportError: vi.fn(),
}));

vi.mock("@/utils/cleanup/cookie-ops", () => ({
  cleanupExpiredCookies: vi.fn(() => Promise.resolve(0)),
}));

vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return {
    ...actual,
    storage: {
      getItem: vi.fn((key: string) => Promise.resolve(mockStorageData.get(key))),
      setItem: vi.fn((key: string, value: unknown) => {
        mockStorageData.set(key, value);
        return Promise.resolve();
      }),
      watch: vi.fn(() => vi.fn()),
    },
  };
});

const listeners = {
  onInstalled: [] as Array<() => Promise<void> | void>,
  onStartup: [] as Array<() => Promise<void> | void>,
  onUpdated: [] as Array<
    (tabId: number, changeInfo: unknown, tab: unknown) => Promise<void> | void
  >,
  onAlarm: [] as Array<(alarm: { name: string }) => Promise<void> | void>,
  onRemoved: [] as Array<
    (
      tabId: number,
      removeInfo: { isWindowClosing: boolean; windowId?: number }
    ) => Promise<void> | void
  >,
};

describe("background", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockStorageData.clear();
    listeners.onInstalled = [];
    listeners.onStartup = [];
    listeners.onUpdated = [];
    listeners.onAlarm = [];
    listeners.onRemoved = [];

    global.chrome = {
      runtime: {
        onInstalled: {
          addListener: function (cb: () => void) {
            listeners.onInstalled.push(cb);
          },
          removeListener: vi.fn(),
        },
        onStartup: {
          addListener: function (cb: () => void) {
            listeners.onStartup.push(cb);
          },
          removeListener: vi.fn(),
        },
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      alarms: {
        create: vi.fn(),
        onAlarm: {
          addListener: function (cb: (alarm: { name: string }) => void) {
            listeners.onAlarm.push(cb);
          },
          removeListener: vi.fn(),
        },
      },
      tabs: {
        onUpdated: {
          addListener: function (cb: (tabId: number, changeInfo: unknown, tab: unknown) => void) {
            listeners.onUpdated.push(cb);
          },
          removeListener: vi.fn(),
        },
        onRemoved: {
          addListener: function (
            cb: (tabId: number, removeInfo: { isWindowClosing: boolean; windowId?: number }) => void
          ) {
            listeners.onRemoved.push(cb);
          },
          removeListener: vi.fn(),
        },
        query: vi.fn(() =>
          Promise.resolve([
            {
              id: 1,
              url: "https://example.com/test",
              active: true,
            },
          ])
        ),
      },
      windows: {
        onRemoved: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
      permissions: {
        contains: vi.fn(() => Promise.resolve(true)),
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should register onInstalled listener", async () => {
    await import("@/entrypoints/background");

    expect(listeners.onInstalled.length).toBeGreaterThan(0);
  });

  it("should register onStartup listener", async () => {
    await import("@/entrypoints/background");

    expect(listeners.onStartup.length).toBeGreaterThan(0);
  });

  it("should register tabs onUpdated listener", async () => {
    await import("@/entrypoints/background");

    expect(listeners.onUpdated.length).toBeGreaterThan(0);
  });

  it("should register alarms onAlarm listener", async () => {
    await import("@/entrypoints/background");

    expect(listeners.onAlarm.length).toBeGreaterThan(0);
  });

  it("should initialize whitelist on install when undefined", async () => {
    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(mockStorageData.get("local:whitelist")).toEqual([]);
  });

  it("should initialize blacklist on install when undefined", async () => {
    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(mockStorageData.get("local:blacklist")).toEqual([]);
  });

  it("should initialize settings on install when undefined", async () => {
    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(mockStorageData.get("local:settings")).toBeDefined();
  });

  it("should not overwrite existing whitelist on install", async () => {
    mockStorageData.set("local:whitelist", ["existing.com"]);

    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(mockStorageData.get("local:whitelist")).toEqual(["existing.com"]);
  });

  it("should not overwrite existing blacklist on install", async () => {
    mockStorageData.set("local:blacklist", ["bad.com"]);

    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(mockStorageData.get("local:blacklist")).toEqual(["bad.com"]);
  });

  it("should create scheduled cleanup alarm on installed", async () => {
    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(chrome.alarms.create).toHaveBeenCalledWith("scheduled-cleanup", {
      periodInMinutes: 60,
    });
  });

  it("should create scheduled cleanup alarm on startup", async () => {
    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(chrome.alarms.create).toHaveBeenCalledWith("scheduled-cleanup", {
      periodInMinutes: 60,
    });
  });

  it("should handle scheduled cleanup alarm", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: Date.now() - 2 * 60 * 60 * 1000,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(runCleanupWithFilter).toHaveBeenCalled();
  });

  it("should not run scheduled cleanup when disabled", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", {
      scheduleInterval: "disabled",
      lastScheduledCleanup: 0,
    });

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(runCleanupWithFilter).not.toHaveBeenCalled();
  });

  it("should handle tab discard event with cleanup enabled", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabDiscard: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "https://example.com/test" });
    }

    expect(runCleanup).toHaveBeenCalled();
  });

  it("should not cleanup on tab discard when disabled", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", {
      enableAutoCleanup: false,
      cleanupOnTabDiscard: false,
    });

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "https://example.com/test" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle startup cleanup when enabled", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(runCleanup).toHaveBeenCalled();
  });

  it("should not cleanup on startup when disabled", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", {
      enableAutoCleanup: false,
      cleanupOnStartup: false,
    });

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle scheduled cleanup with interval elapsed", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "daily",
        lastScheduledCleanup: Date.now() - 25 * 60 * 60 * 1000,
        clearCache: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(runCleanupWithFilter).toHaveBeenCalled();
  });

  it("should not run scheduled cleanup when interval not elapsed", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        scheduleInterval: "daily",
        lastScheduledCleanup: Date.now() - 1 * 60 * 60 * 1000,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(runCleanupWithFilter).not.toHaveBeenCalled();
  });

  it("should handle scheduled cleanup with no settings", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(runCleanupWithFilter).not.toHaveBeenCalled();
  });

  it("should handle tab discard with invalid URL", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabDiscard: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "invalid-url" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab discard without URL", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabDiscard: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: undefined });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab update without discarded flag", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabDiscard: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { loading: true }, { url: "https://example.com" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle startup cleanup with no active tab", async () => {
    await import("@/utils/cleanup/cleanup-runner");
    await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([])
    );
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([
        { id: 1, url: "https://example.com" },
        { id: 2, url: "https://test.com" },
      ])
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }
  });

  it("should handle startup cleanup with active tab having no URL", async () => {
    await import("@/utils/cleanup/cleanup-runner");
    await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([{ id: 1, active: true, url: undefined }])
    );
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([{ id: 2, url: "https://example.com" }])
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }
  });

  it("should handle startup cleanup with invalid URL in active tab", async () => {
    await import("@/utils/cleanup/cleanup-runner");
    await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([{ id: 1, active: true, url: "chrome://extensions" }])
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }
  });

  it("should handle startup cleanup with invalid URL in all tabs", async () => {
    await import("@/utils/cleanup/cleanup-runner");
    await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([{ id: 1, active: true, url: undefined }])
    );
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve([
        { id: 2, url: "chrome://extensions" },
        { id: 3, url: "about:blank" },
      ])
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }
  });

  it("should handle alarm with different name", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "other-alarm" });
    }

    expect(runCleanupWithFilter).not.toHaveBeenCalled();
  });

  it("should handle onInstalled with existing whitelist and blacklist", async () => {
    mockStorageData.set("local:whitelist", ["a.com"]);
    mockStorageData.set("local:blacklist", ["b.com"]);
    mockStorageData.set("local:settings", { mode: "whitelist" });

    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(mockStorageData.get("local:whitelist")).toEqual(["a.com"]);
    expect(mockStorageData.get("local:blacklist")).toEqual(["b.com"]);
  });

  it("should handle cleanup error in scheduled cleanup", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");
    (runCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.reject(new Error("Cleanup failed"))
    );

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }
  });

  it("should handle cleanup error in tab discard", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");
    (runCleanup as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.reject(new Error("Cleanup failed"))
    );

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabDiscard: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "https://example.com" });
    }
  });

  it("should handle cleanup error in startup cleanup", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");
    (runCleanup as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.reject(new Error("Cleanup failed"))
    );

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }
  });

  it("should handle tabs query error in startup cleanup", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
      })
    );

    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.reject(new Error("Query failed"))
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle settings without enableAutoCleanup", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", {
      cleanupOnTabDiscard: true,
    });

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "https://example.com" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle settings without cleanupOnTabDiscard", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", {
      enableAutoCleanup: true,
    });

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "https://example.com" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle settings without cleanupOnStartup", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", {
      enableAutoCleanup: true,
    });

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle settings with null value", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set("local:settings", null);

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { discarded: true }, { url: "https://example.com" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should update lastScheduledCleanup after scheduled cleanup", async () => {
    await import("@/utils/cleanup/cleanup-runner");
    await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    const settings = mockStorageData.get("local:settings") as { lastScheduledCleanup: number };
    expect(settings.lastScheduledCleanup).toBeGreaterThan(0);
  });

  it("should call checkScheduledCleanup on installed", async () => {
    const { runCleanupWithFilter } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onInstalled) {
      await cb();
    }

    expect(runCleanupWithFilter).toHaveBeenCalled();
  });

  it("should register tabs onRemoved listener", async () => {
    await import("@/entrypoints/background");

    expect(listeners.onRemoved.length).toBeGreaterThan(0);
  });

  it("should save domain for cleanup when window is closing", async () => {
    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnBrowserClose: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com/test" }, { id: 1, url: "https://example.com/test" });
    }

    for (const cb of listeners.onRemoved) {
      await cb(1, { isWindowClosing: true, windowId: 1 });
    }

    const domains = mockStorageData.get("local:cleanupOnStartup");
    expect(domains).toContain("example.com");
  });

  it("should cleanup closed tab when not window closing", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabClose: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com/test" }, { id: 1, url: "https://example.com/test" });
    }

    for (const cb of listeners.onRemoved) {
      await cb(1, { isWindowClosing: false, windowId: 1 });
    }

    expect(runCleanup).toHaveBeenCalled();
  });

  it("should not cleanup when enableAutoCleanup is false", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: false,
        cleanupOnTabClose: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com/test" }, { id: 1, url: "https://example.com/test" });
    }

    for (const cb of listeners.onRemoved) {
      await cb(1, { isWindowClosing: false, windowId: 1 });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle cleanup error in tab removed", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");
    (runCleanup as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.reject(new Error("Cleanup failed"))
    );

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabClose: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com/test" }, { id: 1, url: "https://example.com/test" });
    }

    for (const cb of listeners.onRemoved) {
      await cb(1, { isWindowClosing: false, windowId: 1 });
    }
  });

  it("should handle tab removed without URL in tabUrlMap", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabClose: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onRemoved) {
      await cb(999, { isWindowClosing: false, windowId: 1 });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab removed with invalid URL", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnTabClose: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "invalid-url" }, { id: 1, url: "invalid-url" });
    }

    for (const cb of listeners.onRemoved) {
      await cb(1, { isWindowClosing: false, windowId: 1 });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab navigate without previous URL", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnNavigate: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com/new" }, { id: 1, url: "https://example.com/new" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab navigate within same hostname", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnNavigate: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(
        1,
        { url: "https://example.com/page1" },
        { id: 1, url: "https://example.com/page1" }
      );
    }

    for (const cb of listeners.onUpdated) {
      await cb(
        1,
        { url: "https://example.com/page2" },
        { id: 1, url: "https://example.com/page2" }
      );
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab navigate with invalid previous URL", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnNavigate: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "invalid-url" }, { id: 1, url: "invalid-url" });
    }

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com" }, { id: 1, url: "https://example.com" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should handle tab navigate with invalid current URL", async () => {
    const { runCleanup } = await import("@/utils/cleanup/cleanup-runner");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnNavigate: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "https://example.com" }, { id: 1, url: "https://example.com" });
    }

    for (const cb of listeners.onUpdated) {
      await cb(1, { url: "invalid-url" }, { id: 1, url: "invalid-url" });
    }

    expect(runCleanup).not.toHaveBeenCalled();
  });

  it("should call cleanupExpiredCookies on scheduled cleanup when enabled", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
        cleanupExpiredCookies: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(cleanupExpiredCookies).toHaveBeenCalled();
  });

  it("should not call cleanupExpiredCookies on scheduled cleanup when disabled", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
        cleanupExpiredCookies: false,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(cleanupExpiredCookies).not.toHaveBeenCalled();
  });

  it("should call cleanupExpiredCookies on startup when enabled", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
        cleanupExpiredCookies: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(cleanupExpiredCookies).toHaveBeenCalled();
  });

  it("should not call cleanupExpiredCookies on startup when disabled", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        cleanupOnStartup: true,
        cleanupExpiredCookies: false,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onStartup) {
      await cb();
    }

    expect(cleanupExpiredCookies).not.toHaveBeenCalled();
  });

  it("should not call cleanupExpiredCookies when permission denied", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(cleanupExpiredCookies).not.toHaveBeenCalled();
  });

  it("should handle cleanupExpiredCookies returning count > 0", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");
    (cleanupExpiredCookies as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.resolve(5)
    );

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
        cleanupExpiredCookies: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(cleanupExpiredCookies).toHaveBeenCalled();
  });

  it("should handle cleanupExpiredCookies error gracefully", async () => {
    const { cleanupExpiredCookies } = await import("@/utils/cleanup/cookie-ops");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    (cleanupExpiredCookies as ReturnType<typeof vi.fn>).mockImplementationOnce(() =>
      Promise.reject(new Error("Cleanup expired cookies failed"))
    );

    mockStorageData.set(
      "local:settings",
      createSettings({
        enableAutoCleanup: true,
        scheduleInterval: "hourly",
        lastScheduledCleanup: 0,
        cleanupExpiredCookies: true,
      })
    );

    await import("@/entrypoints/background");

    for (const cb of listeners.onAlarm) {
      await cb({ name: "scheduled-cleanup" });
    }

    expect(cleanupExpiredCookies).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
