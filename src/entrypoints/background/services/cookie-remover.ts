import {
  clearSingleCookie as clearSingleCookieUtil,
  type CookieRemoveResult,
} from "@/utils/cleanup/cookie-ops";
import { metricsService } from "./metrics";
import { CookieRemoveError } from "@/types";

export type CookieRemoveDetails = Parameters<typeof chrome.cookies.remove>[0];

const isPermissionDeniedMessage = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes("permission") ||
    lowerMessage.includes("access denied") ||
    lowerMessage.includes("not allowed")
  );
};

const classifyRemoveError = (
  error: string,
  cookieName: string,
  domain: string,
  originalError?: unknown
): CookieRemoveError => {
  if (error.toLowerCase().includes("not found")) {
    return CookieRemoveError.notFound(cookieName, domain);
  }
  if (isPermissionDeniedMessage(error)) {
    return CookieRemoveError.permissionDenied(error, originalError);
  }
  return CookieRemoveError.apiError(error, originalError);
};

export const clearSingleCookie = async (
  cookie: chrome.cookies.Cookie,
  cleanedDomain: string
): Promise<void> => {
  const startTime = Date.now();
  let success = false;
  let errorCode: string | undefined;
  let removeError: CookieRemoveError | undefined;

  try {
    const result: CookieRemoveResult = await clearSingleCookieUtil(cookie, cleanedDomain);
    success = result.success;

    if (!result.success && result.error) {
      removeError = classifyRemoveError(result.error, cookie.name, cleanedDomain);
      errorCode = removeError.errorType;
      throw removeError;
    }
  } catch (e) {
    if (e instanceof CookieRemoveError) {
      throw e;
    }
    const errorMessage = e instanceof Error ? e.message : String(e);
    removeError = classifyRemoveError(errorMessage, cookie.name, cleanedDomain, e);
    errorCode = removeError.errorType;
    throw removeError;
  } finally {
    const durationMs = Date.now() - startTime;
    try {
      metricsService.recordCookieMutation("clearSingleCookie", success, durationMs, {
        domain: cleanedDomain,
        errorCode,
        metadata: { cookieName: cookie.name },
      });
    } catch (metricError) {
      console.error("Failed to record cookie removal metric:", metricError);
    }
  }
};
