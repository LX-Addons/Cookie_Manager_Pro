import type { CleanupExecutionResult, CleanupTrigger } from "@/types";
import { CookieClearType, ModeType } from "@/types";
import { getCleanupSettings, shouldCleanupDomain } from "./domain-policy";
import { clearCookies, ClearCookiesOptions, ClearCookiesResult } from "./cookie-ops";
import { clearBrowserData, ClearBrowserDataOptions } from "./site-data-ops";
import { isDomainMatch } from "@/utils/domain";

export interface CleanupOptions {
  domain?: string;
  clearType?: CookieClearType;
  clearCache?: boolean;
  clearLocalStorage?: boolean;
  clearIndexedDB?: boolean;
  trigger: CleanupTrigger;
}

export const runCleanup = async (options: CleanupOptions): Promise<CleanupExecutionResult> => {
  const startTime = Date.now();
  const result: CleanupExecutionResult = {
    success: false,
    trigger: options.trigger,
    requestedDomain: options.domain,
    matchedDomains: [],
    cookiesRemoved: 0,
    browserDataCleared: {
      cache: false,
      localStorage: false,
      indexedDB: false,
    },
    partialFailures: [],
    durationMs: 0,
    timestamp: startTime,
  };

  try {
    const { settings, whitelist, blacklist } = await getCleanupSettings();

    const clearType = options.clearType ?? settings.clearType;
    const clearOptions: ClearBrowserDataOptions = {
      clearCache: options.clearCache ?? settings.clearCache,
      clearLocalStorage: options.clearLocalStorage ?? settings.clearLocalStorage,
      clearIndexedDB: options.clearIndexedDB ?? settings.clearIndexedDB,
    };

    let cookieResult: ClearCookiesResult;
    if (options.domain) {
      if (!shouldCleanupDomain(options.domain, settings.mode, whitelist, blacklist)) {
        result.durationMs = Date.now() - startTime;
        result.success = true;
        return result;
      }

      const domain = options.domain;
      const cookieOptions: ClearCookiesOptions = {
        clearType,
        filterFn: (cookieDomain) => isDomainMatch(cookieDomain, domain),
      };
      cookieResult = await clearCookies(cookieOptions);
    } else {
      const isInWhitelistMode = settings.mode === ModeType.WHITELIST;
      const shouldIncludeDomain = isInWhitelistMode
        ? (domain: string) => shouldCleanupDomain(domain, settings.mode, whitelist, blacklist)
        : (domain: string) => shouldCleanupDomain(domain, settings.mode, whitelist, blacklist);

      const cookieOptions: ClearCookiesOptions = {
        clearType,
        filterFn: shouldIncludeDomain,
      };
      cookieResult = await clearCookies(cookieOptions);
    }

    result.cookiesRemoved = cookieResult.count;
    result.matchedDomains = Array.from(cookieResult.clearedDomains);

    if (cookieResult.clearedDomains.size > 0) {
      try {
        const browserDataResult = await clearBrowserData(cookieResult.clearedDomains, clearOptions);
        result.browserDataCleared = browserDataResult;
      } catch (e) {
        result.partialFailures.push({
          stage: "storage",
          domain: options.domain,
          reason: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    result.success = true;
  } catch (e) {
    result.partialFailures.push({
      stage: "cookies",
      domain: options.domain,
      reason: e instanceof Error ? e.message : "Unknown error",
    });
  }

  result.durationMs = Date.now() - startTime;

  return result;
};

export const runCleanupWithFilter = async (
  filterFn: (domain: string) => boolean,
  options: Omit<CleanupOptions, "domain"> & Partial<Pick<CleanupOptions, "domain">>
): Promise<CleanupExecutionResult> => {
  const startTime = Date.now();
  const result: CleanupExecutionResult = {
    success: false,
    trigger: options.trigger,
    requestedDomain: options.domain,
    matchedDomains: [],
    cookiesRemoved: 0,
    browserDataCleared: {
      cache: false,
      localStorage: false,
      indexedDB: false,
    },
    partialFailures: [],
    durationMs: 0,
    timestamp: startTime,
  };

  try {
    const { settings, whitelist, blacklist } = await getCleanupSettings();

    const clearType = options.clearType ?? settings.clearType;
    const clearOptions: ClearBrowserDataOptions = {
      clearCache: options.clearCache ?? settings.clearCache,
      clearLocalStorage: options.clearLocalStorage ?? settings.clearLocalStorage,
      clearIndexedDB: options.clearIndexedDB ?? settings.clearIndexedDB,
    };

    const isInWhitelistMode = settings.mode === ModeType.WHITELIST;
    const shouldIncludeDomain = isInWhitelistMode
      ? (domain: string) => shouldCleanupDomain(domain, settings.mode, whitelist, blacklist)
      : (domain: string) => shouldCleanupDomain(domain, settings.mode, whitelist, blacklist);

    const cookieOptions: ClearCookiesOptions = {
      clearType,
      filterFn: (domain) => filterFn(domain) && shouldIncludeDomain(domain),
    };
    const cookieResult = await clearCookies(cookieOptions);

    result.cookiesRemoved = cookieResult.count;
    result.matchedDomains = Array.from(cookieResult.clearedDomains);

    if (cookieResult.clearedDomains.size > 0) {
      try {
        const browserDataResult = await clearBrowserData(cookieResult.clearedDomains, clearOptions);
        result.browserDataCleared = browserDataResult;
      } catch (e) {
        result.partialFailures.push({
          stage: "storage",
          domain: options.domain,
          reason: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    result.success = true;
  } catch (e) {
    result.partialFailures.push({
      stage: "cookies",
      domain: options.domain,
      reason: e instanceof Error ? e.message : "Unknown error",
    });
  }

  result.durationMs = Date.now() - startTime;

  return result;
};
