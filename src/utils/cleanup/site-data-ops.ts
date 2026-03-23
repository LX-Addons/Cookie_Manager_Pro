export interface ClearBrowserDataOptions {
  clearCache?: boolean;
  clearLocalStorage?: boolean;
  clearIndexedDB?: boolean;
}

export interface ClearBrowserDataResult {
  cache: boolean;
  localStorage: boolean;
  indexedDB: boolean;
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
    cache: false,
    localStorage: false,
    indexedDB: false,
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
        result.cache = true;
      }
    } catch {}
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
        result.localStorage = true;
      }
    } catch {}
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
        result.indexedDB = true;
      }
    } catch {}
  }

  return result;
};
