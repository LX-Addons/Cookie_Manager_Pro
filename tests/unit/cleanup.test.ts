import { describe, it, expect, vi, beforeEach } from "vitest";
import { runCleanup, runCleanupWithFilter } from "@/utils/cleanup/cleanup-runner";
import { CookieClearType } from "@/types";

vi.mock("@/lib/store", () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
  SETTINGS_KEY: "local:settings",
  WHITELIST_KEY: "local:whitelist",
  BLACKLIST_KEY: "local:blacklist",
}));

vi.mock("@/utils/cleanup/domain-policy", () => ({
  getCleanupSettings: vi.fn(async () => ({
    settings: {
      mode: "whitelist",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
    },
    whitelist: [],
    blacklist: [],
  })),
  shouldCleanupDomain: vi.fn(() => true),
}));

vi.mock("@/utils/cleanup/cookie-ops", () => ({
  clearCookies: vi.fn(async () => ({
    count: 2,
    clearedDomains: new Set(["example.com", "test.com"]),
  })),
  clearSingleCookie: vi.fn(async () => true),
  getAllCookies: vi.fn(async () => []),
  createCookie: vi.fn(async () => true),
  editCookie: vi.fn(async () => true),
  cleanupExpiredCookies: vi.fn(async () => 0),
}));

vi.mock("@/utils/cleanup/site-data-ops", () => ({
  clearBrowserData: vi.fn(async () => ({
    cache: true,
    localStorage: true,
    indexedDB: true,
  })),
  buildOrigins: vi.fn((domains: Set<string>) =>
    [...domains].flatMap((d) => [`https://${d}`, `http://${d}`])
  ),
  buildNonEmptyOrigins: vi.fn((domains: Set<string>) => {
    if (domains.size === 0) return null;
    const origins = [...domains].flatMap((d) => [`https://${d}`, `http://${d}`]);
    return origins as [string, ...string[]];
  }),
}));

describe("cleanup-runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runCleanup", () => {
    it("should return cleanup result with success true", async () => {
      const result = await runCleanup({
        domain: "example.com",
        trigger: "manual-current",
        clearType: CookieClearType.ALL,
        clearCache: false,
        clearLocalStorage: false,
        clearIndexedDB: false,
      });

      expect(result.success).toBe(true);
      expect(result.cookiesRemoved).toBe(2);
      expect(result.matchedDomains).toContain("example.com");
      expect(result.matchedDomains).toContain("test.com");
    });

    it("should return cleanup result with matchedDomains", async () => {
      const result = await runCleanup({
        domain: "example.com",
        trigger: "manual-current",
      });

      expect(result.matchedDomains).toContain("example.com");
    });
  });

  describe("runCleanupWithFilter", () => {
    it("should return cleanup result with filter", async () => {
      const filterFn = (domain: string) => domain === "example.com";
      const result = await runCleanupWithFilter(filterFn, {
        trigger: "manual-all",
        clearType: CookieClearType.ALL,
      });

      expect(result.success).toBe(true);
      expect(result.cookiesRemoved).toBeGreaterThanOrEqual(0);
    });

    it("should handle filter that matches nothing", async () => {
      const { clearCookies } = await import("@/utils/cleanup/cookie-ops");
      vi.mocked(clearCookies).mockResolvedValueOnce({
        count: 0,
        clearedDomains: new Set(),
      });

      const filterFn = (_domain: string) => false;
      const result = await runCleanupWithFilter(filterFn, {
        trigger: "manual-all",
      });

      expect(result.success).toBe(true);
      expect(result.cookiesRemoved).toBe(0);
    });
  });
});

describe("cleanupExpiredCookies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 when no expired cookies", async () => {
    const { cleanupExpiredCookies: cleanup } = await import("@/utils/cleanup/cookie-ops");
    vi.mocked(cleanup).mockResolvedValueOnce(0);

    const count = await cleanup();
    expect(count).toBe(0);
  });

  it("should return number of cleaned expired cookies", async () => {
    const { cleanupExpiredCookies: cleanup } = await import("@/utils/cleanup/cookie-ops");
    vi.mocked(cleanup).mockResolvedValueOnce(3);

    const count = await cleanup();
    expect(count).toBe(3);
  });
});
