import type { DataClearResult } from "@/types";

export interface ClearBrowserDataOptions {
  clearCache?: boolean;
  clearLocalStorage?: boolean;
  clearIndexedDB?: boolean;
}

export interface ClearBrowserDataResult {
  cache: DataClearResult;
  localStorage: DataClearResult;
  indexedDB: DataClearResult;
}

export const buildOrigins = (domains: Set<string>): string[] => {
  return [...domains].flatMap((d) => [`https://${d}`, `http://${d}`]);
};

export const buildNonEmptyOrigins = (domains: Set<string>): [string, ...string[]] | null => {
  if (domains.size === 0) {
    return null;
  }
  const origins = buildOrigins(domains);
  if (origins.length === 0) {
    return null;
  }
  return origins as [string, ...string[]];
};

export const clearBrowserData = async (
  domains: Set<string>,
  options: ClearBrowserDataOptions
): Promise<ClearBrowserDataResult> => {
  const { clearCache, clearLocalStorage, clearIndexedDB } = options;
  const origins = buildNonEmptyOrigins(domains);
  const result: ClearBrowserDataResult = {
    cache: { success: false },
    localStorage: { success: false },
    indexedDB: { success: false },
  };

  if (clearCache) {
    try {
      if (origins) {
        await chrome.browsingData.remove(
          { origins },
          {
            cacheStorage: true,
            fileSystems: true,
            serviceWorkers: true,
          }
        );
        result.cache = { success: true };
      }
    } catch (e) {
      result.cache = { success: false, error: e instanceof Error ? e.message : "Unknown error" };
    }
  }

  if (clearLocalStorage) {
    try {
      if (origins) {
        await chrome.browsingData.remove(
          { origins },
          {
            localStorage: true,
          }
        );
        result.localStorage = { success: true };
      }
    } catch (e) {
      result.localStorage = {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }

  if (clearIndexedDB) {
    try {
      if (origins) {
        await chrome.browsingData.remove(
          { origins },
          {
            indexedDB: true,
          }
        );
        result.indexedDB = { success: true };
      }
    } catch (e) {
      result.indexedDB = {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }

  return result;
};
