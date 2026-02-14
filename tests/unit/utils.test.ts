import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeDomain,
  isDomainMatch,
  isInList,
  getCookieTypeName,
  buildOrigins,
  clearCookies,
  clearBrowserData,
} from "../../utils";
import { CookieClearType } from "../../types";

const createMockCookies = () =>
  [
    {
      name: "test1",
      value: "value1",
      domain: ".example.com",
      path: "/",
      secure: true,
      httpOnly: false,
      sameSite: "no_restriction" as const,
      expirationDate: Date.now() / 1000 + 3600,
      storeId: "0",
    },
    {
      name: "test2",
      value: "value2",
      domain: "sub.example.com",
      path: "/",
      secure: false,
      httpOnly: true,
      sameSite: "lax" as const,
      storeId: "0",
    },
  ] as chrome.cookies.Cookie[];

const setupCookieMocks = (cookies: chrome.cookies.Cookie[]) => {
  vi.spyOn(chrome.cookies, "getAll").mockResolvedValue(cookies);
  vi.spyOn(chrome.cookies, "remove").mockImplementation(
    async (details: chrome.cookies.Details) => details
  );
};

describe("normalizeDomain", () => {
  it("should remove leading dot and convert to lowercase", () => {
    expect(normalizeDomain(".Example.COM")).toBe("example.com");
    expect(normalizeDomain("EXAMPLE.COM")).toBe("example.com");
    expect(normalizeDomain("example.com")).toBe("example.com");
  });

  it("should handle empty string", () => {
    expect(normalizeDomain("")).toBe("");
  });

  it("should handle subdomains", () => {
    expect(normalizeDomain(".Sub.Example.Com")).toBe("sub.example.com");
  });
});

describe("isDomainMatch", () => {
  it("should return true for exact matches", () => {
    expect(isDomainMatch("example.com", "example.com")).toBe(true);
  });

  it("should return true for parent domain matches", () => {
    expect(isDomainMatch("example.com", "sub.example.com")).toBe(true);
  });

  it("should return true for child domain matches", () => {
    expect(isDomainMatch("sub.example.com", "example.com")).toBe(true);
  });

  it("should return false for unrelated domains", () => {
    expect(isDomainMatch("example.com", "test.com")).toBe(false);
  });

  it("should handle leading dots and case differences", () => {
    expect(isDomainMatch(".Example.COM", "sub.EXAMPLE.com")).toBe(true);
  });
});

describe("isInList", () => {
  it("should return true for exact match in list", () => {
    const list = ["example.com", "test.com"];
    expect(isInList("example.com", list)).toBe(true);
  });

  it("should return true for parent domain in list", () => {
    const list = ["example.com"];
    expect(isInList("sub.example.com", list)).toBe(true);
  });

  it("should return true for child domain in list", () => {
    const list = ["sub.example.com"];
    expect(isInList("example.com", list)).toBe(true);
  });

  it("should return false for no match", () => {
    const list = ["example.com"];
    expect(isInList("test.com", list)).toBe(false);
  });

  it("should handle empty list", () => {
    expect(isInList("example.com", [])).toBe(false);
  });

  it("should handle leading dots and case differences", () => {
    const list = [".EXAMPLE.COM"];
    expect(isInList("sub.example.com", list)).toBe(true);
  });
});

describe("getCookieTypeName", () => {
  it("should return correct name for session type", () => {
    expect(getCookieTypeName("session")).toBe("会话Cookie");
  });

  it("should return correct name for persistent type", () => {
    expect(getCookieTypeName("persistent")).toBe("持久Cookie");
  });

  it("should return default name for unknown type", () => {
    expect(getCookieTypeName("unknown")).toBe("所有Cookie");
    expect(getCookieTypeName("")).toBe("所有Cookie");
  });
});

describe("buildOrigins", () => {
  it("should build origins from domains", () => {
    const domains = new Set(["example.com", "test.com"]);
    const origins = buildOrigins(domains);
    expect(origins).toEqual(["https://example.com", "https://test.com"]);
  });

  it("should handle empty set", () => {
    const domains = new Set<string>();
    const origins = buildOrigins(domains);
    expect(origins).toEqual([]);
  });
});

describe("clearCookies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear all cookies", async () => {
    const mockCookies = createMockCookies();
    setupCookieMocks(mockCookies);

    const result = await clearCookies();
    expect(result.count).toBe(mockCookies.length);
    expect(result.clearedDomains.size).toBeGreaterThan(0);
  });

  it("should clear cookies by type session", async () => {
    const mockCookies = createMockCookies();
    setupCookieMocks(mockCookies);

    const result = await clearCookies({
      clearType: CookieClearType.SESSION,
    });
    expect(result.count).toBe(1);
  });

  it("should clear cookies by type persistent", async () => {
    const mockCookies = [
      {
        name: "test1",
        value: "value1",
        domain: ".example.com",
        path: "/",
        secure: true,
        httpOnly: false,
        sameSite: "no_restriction" as const,
        expirationDate: Date.now() / 1000 + 3600,
        storeId: "0",
      },
      {
        name: "test2",
        value: "value2",
        domain: ".example.com",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "lax" as const,
        expirationDate: Date.now() / 1000 + 7200,
        storeId: "0",
      },
    ] as chrome.cookies.Cookie[];
    setupCookieMocks(mockCookies);

    const result = await clearCookies({
      clearType: CookieClearType.PERSISTENT,
    });
    expect(result.count).toBe(2);
  });

  it("should skip session cookies when clearing persistent type", async () => {
    const mockCookies = [
      {
        name: "persistent",
        value: "value1",
        domain: ".example.com",
        path: "/",
        secure: true,
        httpOnly: false,
        sameSite: "no_restriction" as const,
        expirationDate: Date.now() / 1000 + 3600,
        storeId: "0",
      },
      {
        name: "session",
        value: "value2",
        domain: "sub.example.com",
        path: "/",
        secure: false,
        httpOnly: true,
        sameSite: "lax" as const,
        storeId: "0",
      },
    ] as chrome.cookies.Cookie[];
    setupCookieMocks(mockCookies);

    const result = await clearCookies({
      clearType: CookieClearType.PERSISTENT,
    });
    expect(result.count).toBe(1);
  });

  it("should clear cookies by type all", async () => {
    const mockCookies = createMockCookies();
    setupCookieMocks(mockCookies);

    const result = await clearCookies({
      clearType: CookieClearType.ALL,
    });
    expect(result.count).toBe(mockCookies.length);
  });

  it("should filter cookies by domain", async () => {
    const mockCookies = createMockCookies();
    setupCookieMocks(mockCookies);

    const result = await clearCookies({
      filterFn: (domain) => domain === "example.com",
    });
    expect(result.count).toBeGreaterThan(0);
  });

  it("should handle empty cookies", async () => {
    setupCookieMocks([]);

    const result = await clearCookies();
    expect(result.count).toBe(0);
    expect(result.clearedDomains.size).toBe(0);
  });

  it("should handle errors when clearing cookies", async () => {
    const mockCookies = createMockCookies();
    vi.spyOn(chrome.cookies, "getAll").mockResolvedValue(mockCookies);
    vi.spyOn(chrome.cookies, "remove").mockRejectedValue(new Error("Failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await clearCookies();
    expect(result.count).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("clearBrowserData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should clear cache", async () => {
    const mockBrowsingDataRemove = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;

    const domains = new Set(["example.com"]);
    await clearBrowserData(domains, { clearCache: true });

    expect(mockBrowsingDataRemove).toHaveBeenCalled();
  });

  it("should clear localStorage", async () => {
    const mockBrowsingDataRemove = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;

    const domains = new Set(["example.com"]);
    await clearBrowserData(domains, { clearLocalStorage: true });

    expect(mockBrowsingDataRemove).toHaveBeenCalled();
  });

  it("should clear IndexedDB", async () => {
    const mockBrowsingDataRemove = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;

    const domains = new Set(["example.com"]);
    await clearBrowserData(domains, { clearIndexedDB: true });

    expect(mockBrowsingDataRemove).toHaveBeenCalled();
  });

  it("should handle empty domains", async () => {
    const mockBrowsingDataRemove = vi.fn().mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;

    const domains = new Set<string>();
    await clearBrowserData(domains, { clearCache: true });

    expect(mockBrowsingDataRemove).not.toHaveBeenCalled();
  });

  it("should handle errors when clearing cache", async () => {
    const mockBrowsingDataRemove = vi.fn().mockRejectedValue(new Error("Failed"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const domains = new Set(["example.com"]);
    await clearBrowserData(domains, { clearCache: true });

    expect(mockBrowsingDataRemove).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should handle errors when clearing localStorage", async () => {
    const mockBrowsingDataRemove = vi.fn().mockRejectedValue(new Error("Failed"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const domains = new Set(["example.com"]);
    await clearBrowserData(domains, { clearLocalStorage: true });

    expect(mockBrowsingDataRemove).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should handle errors when clearing IndexedDB", async () => {
    const mockBrowsingDataRemove = vi.fn().mockRejectedValue(new Error("Failed"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chrome.browsingData as any).remove = mockBrowsingDataRemove;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const domains = new Set(["example.com"]);
    await clearBrowserData(domains, { clearIndexedDB: true });

    expect(mockBrowsingDataRemove).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
