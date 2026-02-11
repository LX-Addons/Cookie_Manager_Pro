import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildOrigins, clearCookies, clearBrowserData } from "../../utils";
import type { CookieClearType } from "../../types";

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

  it("should clear cookies by type", async () => {
    const mockCookies = createMockCookies();
    setupCookieMocks(mockCookies);

    const result = await clearCookies({
      clearType: "session" as CookieClearType,
    });
    expect(result.count).toBe(1);
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
});
