import type { CleanupExecutionResult, CleanupTrigger } from "@/types";
import { CookieClearType, ModeType, CleanupError, CleanupStage, ErrorCode } from "@/types";
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

const getClearOptions = (
  options: CleanupOptions,
  settings: {
    clearType: CookieClearType;
    clearCache: boolean;
    clearLocalStorage: boolean;
    clearIndexedDB: boolean;
  }
): ClearBrowserDataOptions => ({
  clearCache: options.clearCache ?? settings.clearCache,
  clearLocalStorage: options.clearLocalStorage ?? settings.clearLocalStorage,
  clearIndexedDB: options.clearIndexedDB ?? settings.clearIndexedDB,
});

const createCookieResult = async (
  options: CleanupOptions,
  clearType: CookieClearType,
  settings: { mode: ModeType },
  whitelist: string[],
  blacklist: string[]
): Promise<ClearCookiesResult> => {
  if (options.domain) {
    const domain = options.domain;
    const cookieOptions: ClearCookiesOptions = {
      clearType,
      filterFn: (cookieDomain) => isDomainMatch(cookieDomain, domain),
    };
    return clearCookies(cookieOptions);
  }

  const shouldIncludeDomain = (domain: string) =>
    shouldCleanupDomain({ domain, mode: settings.mode, whitelist, blacklist });
  const cookieOptions: ClearCookiesOptions = {
    clearType,
    filterFn: shouldIncludeDomain,
  };
  return clearCookies(cookieOptions);
};

const createInitialResult = (
  options: CleanupOptions,
  startTime: number
): CleanupExecutionResult => ({
  success: false,
  trigger: options.trigger,
  requestedDomain: options.domain,
  matchedDomains: [],
  cookiesRemoved: 0,
  browserDataCleared: {
    cache: { success: false },
    localStorage: { success: false },
    indexedDB: { success: false },
  },
  partialFailures: [],
  durationMs: 0,
  timestamp: startTime,
});

const handleBrowserDataClear = async (
  result: CleanupExecutionResult,
  clearedDomains: Set<string>,
  clearOptions: ClearBrowserDataOptions,
  domain?: string
): Promise<void> => {
  try {
    const browserDataResult = await clearBrowserData(clearedDomains, clearOptions);
    result.browserDataCleared = browserDataResult;

    if (!browserDataResult.cache.success && browserDataResult.cache.error) {
      result.partialFailures.push({
        stage: "cache",
        domain,
        reason: browserDataResult.cache.error,
      });
    }
    if (!browserDataResult.localStorage.success && browserDataResult.localStorage.error) {
      result.partialFailures.push({
        stage: "localStorage",
        domain,
        reason: browserDataResult.localStorage.error,
      });
    }
    if (!browserDataResult.indexedDB.success && browserDataResult.indexedDB.error) {
      result.partialFailures.push({
        stage: "indexedDB",
        domain,
        reason: browserDataResult.indexedDB.error,
      });
    }
  } catch (e) {
    result.partialFailures.push({
      stage: "storage",
      domain,
      reason: e instanceof Error ? e.message : "Unknown error",
    });
  }
};

const handleCookieClearError = (domain?: string, error?: unknown): never => {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (error instanceof CleanupError) {
    throw error;
  }

  if (
    error instanceof Error &&
    (error.message.includes("permission") ||
      error.message.includes("Permission") ||
      error.message.includes("access denied"))
  ) {
    throw new CleanupError(ErrorCode.PERMISSION_DENIED, CleanupStage.COOKIES, message);
  }

  throw new CleanupError(ErrorCode.COOKIE_REMOVE_FAILED, CleanupStage.COOKIES, message);
};

export const runCleanup = async (options: CleanupOptions): Promise<CleanupExecutionResult> => {
  const startTime = Date.now();
  const result = createInitialResult(options, startTime);

  try {
    const { settings, whitelist, blacklist } = await getCleanupSettings();
    const clearType = options.clearType ?? settings.clearType;
    const clearOptions = getClearOptions(options, settings);

    if (
      options.domain &&
      !shouldCleanupDomain({ domain: options.domain, mode: settings.mode, whitelist, blacklist })
    ) {
      result.durationMs = Date.now() - startTime;
      result.success = true;
      return result;
    }

    const cookieResult = await createCookieResult(
      options,
      clearType,
      settings,
      whitelist,
      blacklist
    );

    result.cookiesRemoved = cookieResult.count;
    result.matchedDomains = Array.from(cookieResult.clearedDomains);

    if (cookieResult.clearedDomains.size > 0) {
      await handleBrowserDataClear(
        result,
        cookieResult.clearedDomains,
        clearOptions,
        options.domain
      );
    }

    result.success = true;
  } catch (e) {
    handleCookieClearError(options.domain, e);
  }

  result.durationMs = Date.now() - startTime;
  return result;
};

export const runCleanupWithFilter = async (
  filterFn: (domain: string) => boolean,
  options: Omit<CleanupOptions, "domain"> & Partial<Pick<CleanupOptions, "domain">>
): Promise<CleanupExecutionResult> => {
  const startTime = Date.now();
  const result = createInitialResult(options, startTime);

  try {
    const { settings, whitelist, blacklist } = await getCleanupSettings();
    const clearType = options.clearType ?? settings.clearType;
    const clearOptions = getClearOptions(options, settings);

    const shouldIncludeDomain = (domain: string) =>
      shouldCleanupDomain({ domain, mode: settings.mode, whitelist, blacklist });
    const cookieOptions: ClearCookiesOptions = {
      clearType,
      filterFn: (domain) => filterFn(domain) && shouldIncludeDomain(domain),
    };
    const cookieResult = await clearCookies(cookieOptions);

    result.cookiesRemoved = cookieResult.count;
    result.matchedDomains = Array.from(cookieResult.clearedDomains);

    if (cookieResult.clearedDomains.size > 0) {
      await handleBrowserDataClear(
        result,
        cookieResult.clearedDomains,
        clearOptions,
        options.domain
      );
    }

    result.success = true;
  } catch (e) {
    handleCookieClearError(options.domain, e);
  }

  result.durationMs = Date.now() - startTime;
  return result;
};
