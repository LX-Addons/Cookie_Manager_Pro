import { describe, it, expect, vi, beforeEach } from "vitest";
import { performCleanup, performCleanupWithFilter, cleanupExpiredCookies } from "@/utils/cleanup";
import { CookieClearType, ModeType } from "@/types";
import { storage } from "@/lib/store";

vi.mock("@/lib/store", () => ({
  storage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
  WHITELIST_KEY: "local:whitelist",
  BLACKLIST_KEY: "local:blacklist",
  SETTINGS_KEY: "local:settings",
  DEFAULT_SETTINGS: {
    mode: "whitelist",
    clearType: "all",
    clearCache: false,
    clearLocalStorage: false,
    clearIndexedDB: false,
  },
}));

const normalizeDomain = (domain: string): string => {
  return domain.replace(/^\./, "").toLowerCase();
};

vi.mock("@/utils", () => ({
  isInList: vi.fn((domain: string, list: string[]) => {
    const normalizedDomain = normalizeDomain(domain);
    return list.some((item: string) => {
      const normalizedItem = normalizeDomain(item);
      return (
        normalizedDomain === normalizedItem ||
        normalizedDomain.endsWith("." + normalizedItem) ||
        normalizedItem.endsWith("." + normalizedDomain)
      );
    });
  }),
  isDomainMatch: vi.fn((cookieDomain: string, targetDomain: string) => {
    const normalizedCookie = normalizeDomain(cookieDomain);
    const normalizedTarget = normalizeDomain(targetDomain);
    return (
      normalizedCookie === normalizedTarget ||
      normalizedTarget.endsWith("." + normalizedCookie) ||
      normalizedCookie.endsWith("." + normalizedTarget)
    );
  }),
  clearCookies: vi.fn(async (options) => {
    const mockCookies = [
      {
        name: "test1",
        domain: ".example.com",
        path: "/",
        secure: true,
        expirationDate: Date.now() / 1000 + 3600,
      },
      { name: "test2", domain: ".test.com", path: "/", secure: false },
      {
        name: "test3",
        domain: ".demo.com",
        path: "/",
        secure: true,
        expirationDate: Date.now() / 1000 + 7200,
      },
    ];
    let count = 0;
    const clearedDomains = new Set<string>();

    for (const cookie of mockCookies) {
      const cleanedDomain = cookie.domain.replace(/^\./, "");
      if (options?.filterFn && !options.filterFn(cleanedDomain)) continue;
      if (options?.clearType === CookieClearType.SESSION && cookie.expirationDate) continue;
      if (options?.clearType === CookieClearType.PERSISTENT && !cookie.expirationDate) continue;
      count++;
      clearedDomains.add(cleanedDomain);
    }

    return { count, clearedDomains };
  }),
  clearBrowserData: vi.fn(async () => {}),
}));

describe("cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("performCleanup", () => {
    it("should return null when domain is in whitelist (whitelist mode)", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return ["example.com"];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      const result = await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
      });

      expect(result).toBeNull();
    });

    it("should cleanup when domain is not in whitelist (whitelist mode)", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return ["other.com"];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      const result = await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
      });

      expect(result).not.toBeNull();
      expect(result?.count).toBeGreaterThan(0);
    });

    it("should return null when domain is not in blacklist (blacklist mode)", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.BLACKLIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return ["other.com"];
        }
        return null;
      });

      const result = await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
      });

      expect(result).toBeNull();
    });

    it("should cleanup when domain is in blacklist (blacklist mode)", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.BLACKLIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return ["example.com"];
        }
        return null;
      });

      const result = await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
      });

      expect(result).not.toBeNull();
      expect(result?.count).toBeGreaterThan(0);
    });

    it("should use default settings when settings is null", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return null;
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      const result = await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
      });

      expect(result).not.toBeNull();
    });

    it("should pass clearCache option to cleanup", async () => {
      const { clearBrowserData } = await import("@/utils");

      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.ALL, clearCache: true };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
        clearCache: true,
      });

      expect(clearBrowserData).toHaveBeenCalledWith(
        expect.any(Set),
        expect.objectContaining({ clearCache: true })
      );
    });

    it("should pass clearLocalStorage option to cleanup", async () => {
      const { clearBrowserData } = await import("@/utils");

      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return {
            mode: ModeType.WHITELIST,
            clearType: CookieClearType.ALL,
            clearLocalStorage: true,
          };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
        clearLocalStorage: true,
      });

      expect(clearBrowserData).toHaveBeenCalledWith(
        expect.any(Set),
        expect.objectContaining({ clearLocalStorage: true })
      );
    });

    it("should pass clearIndexedDB option to cleanup", async () => {
      const { clearBrowserData } = await import("@/utils");

      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return {
            mode: ModeType.WHITELIST,
            clearType: CookieClearType.ALL,
            clearIndexedDB: true,
          };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      await performCleanup({
        domain: "example.com",
        clearType: CookieClearType.ALL,
        clearIndexedDB: true,
      });

      expect(clearBrowserData).toHaveBeenCalledWith(
        expect.any(Set),
        expect.objectContaining({ clearIndexedDB: true })
      );
    });
  });

  describe("performCleanupWithFilter", () => {
    it("should cleanup all domains not in whitelist (whitelist mode)", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return ["example.com"];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      const result = await performCleanupWithFilter(() => true, {
        clearType: CookieClearType.ALL,
      });

      expect(result.count).toBeGreaterThan(0);
    });

    it("should cleanup only domains in blacklist (blacklist mode)", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.BLACKLIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return ["example.com", "test.com"];
        }
        return null;
      });

      const result = await performCleanupWithFilter(() => true, {
        clearType: CookieClearType.ALL,
      });

      expect(result.count).toBeGreaterThan(0);
    });

    it("should combine custom filter with mode filter", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return ["example.com"];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      const customFilter = (domain: string) => domain === "test.com";

      const result = await performCleanupWithFilter(customFilter, {
        clearType: CookieClearType.ALL,
      });

      // 白名单模式：example.com 在白名单中，test.com 和 demo.com 不在
      // 自定义 filter：只允许 test.com
      // 结果应该只清理 test.com
      expect(result.count).toBe(1);
      expect(result.clearedDomains).toContain("test.com");
      expect(result.clearedDomains).not.toContain("example.com");
      expect(result.clearedDomains).not.toContain("demo.com");
    });

    it("should use options over settings for clearType", async () => {
      const { clearCookies } = await import("@/utils");

      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.SESSION };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      await performCleanupWithFilter(() => true, {
        clearType: CookieClearType.PERSISTENT,
      });

      // 验证 clearCookies 被调用时使用了 options 中的 PERSISTENT，而不是 settings 中的 SESSION
      expect(clearCookies).toHaveBeenCalledWith(
        expect.objectContaining({
          clearType: CookieClearType.PERSISTENT,
        })
      );
    });

    it("should handle empty whitelist and blacklist", async () => {
      vi.mocked(storage.getItem).mockImplementation(async (key: string) => {
        if (key === "local:settings") {
          return { mode: ModeType.WHITELIST, clearType: CookieClearType.ALL };
        }
        if (key === "local:whitelist") {
          return [];
        }
        if (key === "local:blacklist") {
          return [];
        }
        return null;
      });

      const result = await performCleanupWithFilter(() => true, {
        clearType: CookieClearType.ALL,
      });

      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe("cleanupExpiredCookies", () => {
    it("should remove expired cookies", async () => {
      const pastTime = Date.now() / 1000 - 3600;
      const mockCookies = [
        {
          name: "expired",
          domain: ".example.com",
          path: "/",
          secure: true,
          expirationDate: pastTime,
        },
        {
          name: "valid",
          domain: ".example.com",
          path: "/",
          secure: true,
          expirationDate: Date.now() / 1000 + 3600,
        },
      ];

      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue(mockCookies),
          remove: vi.fn().mockResolvedValue({}),
        },
      } as unknown as typeof chrome;

      const count = await cleanupExpiredCookies();

      expect(count).toBe(1);
      expect(chrome.cookies.remove).toHaveBeenCalledTimes(1);
    });

    it("should return 0 when no expired cookies", async () => {
      const futureTime = Date.now() / 1000 + 3600;
      const mockCookies = [
        {
          name: "valid1",
          domain: ".example.com",
          path: "/",
          secure: true,
          expirationDate: futureTime,
        },
        {
          name: "valid2",
          domain: ".test.com",
          path: "/",
          secure: true,
          expirationDate: futureTime,
        },
      ];

      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue(mockCookies),
          remove: vi.fn().mockResolvedValue({}),
        },
      } as unknown as typeof chrome;

      const count = await cleanupExpiredCookies();

      expect(count).toBe(0);
      expect(chrome.cookies.remove).not.toHaveBeenCalled();
    });

    it("should skip session cookies (no expirationDate)", async () => {
      const mockCookies = [
        { name: "session", domain: ".example.com", path: "/", secure: true },
        {
          name: "valid",
          domain: ".example.com",
          path: "/",
          secure: true,
          expirationDate: Date.now() / 1000 + 3600,
        },
      ];

      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue(mockCookies),
          remove: vi.fn().mockResolvedValue({}),
        },
      } as unknown as typeof chrome;

      const count = await cleanupExpiredCookies();

      expect(count).toBe(0);
    });

    it("should handle remove errors gracefully", async () => {
      const pastTime = Date.now() / 1000 - 3600;
      const mockCookies = [
        {
          name: "expired",
          domain: ".example.com",
          path: "/",
          secure: true,
          expirationDate: pastTime,
        },
      ];

      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue(mockCookies),
          remove: vi.fn().mockRejectedValue(new Error("Remove failed")),
        },
      } as unknown as typeof chrome;

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const count = await cleanupExpiredCookies();

      expect(count).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should handle empty cookies list", async () => {
      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue([]),
          remove: vi.fn().mockResolvedValue({}),
        },
      } as unknown as typeof chrome;

      const count = await cleanupExpiredCookies();

      expect(count).toBe(0);
      expect(chrome.cookies.remove).not.toHaveBeenCalled();
    });

    it("should build correct URL for secure cookie", async () => {
      const pastTime = Date.now() / 1000 - 3600;
      const mockCookies = [
        {
          name: "expired",
          domain: ".example.com",
          path: "/path",
          secure: true,
          expirationDate: pastTime,
        },
      ];

      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue(mockCookies),
          remove: vi.fn().mockResolvedValue({}),
        },
      } as unknown as typeof chrome;

      await cleanupExpiredCookies();

      expect(chrome.cookies.remove).toHaveBeenCalledWith({
        url: "https://example.com/path",
        name: "expired",
      });
    });

    it("should build correct URL for non-secure cookie", async () => {
      const pastTime = Date.now() / 1000 - 3600;
      const mockCookies = [
        {
          name: "expired",
          domain: ".example.com",
          path: "/path",
          secure: false,
          expirationDate: pastTime,
        },
      ];

      globalThis.chrome = {
        cookies: {
          getAll: vi.fn().mockResolvedValue(mockCookies),
          remove: vi.fn().mockResolvedValue({}),
        },
      } as unknown as typeof chrome;

      await cleanupExpiredCookies();

      expect(chrome.cookies.remove).toHaveBeenCalledWith({
        url: "http://example.com/path",
        name: "expired",
      });
    });
  });
});
