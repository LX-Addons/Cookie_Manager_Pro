import {
  clearSingleCookie as clearSingleCookieUtil,
  type CookieRemoveResult,
} from "@/utils/cleanup/cookie-ops";
import { classifyError } from "./error-reporting";
import { metricsService } from "./metrics";

export type CookieRemoveDetails = Parameters<typeof chrome.cookies.remove>[0];

export const clearSingleCookie = async (
  cookie: chrome.cookies.Cookie,
  cleanedDomain: string
): Promise<boolean> => {
  const startTime = Date.now();
  let success = false;
  let errorCode: string | undefined;

  try {
    const result: CookieRemoveResult = await clearSingleCookieUtil(cookie, cleanedDomain);
    success = result.success;

    if (!result.success && result.error) {
      const report = classifyError(new Error(result.error), "cookie remove", {
        domain: cleanedDomain,
      });
      errorCode = report.code;
    }

    return success;
  } catch (e) {
    const report = classifyError(e instanceof Error ? e : new Error(String(e)), "cookie remove", {
      domain: cleanedDomain,
    });
    errorCode = report.code;
    return false;
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
