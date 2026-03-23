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

  const result: CookieRemoveResult = await clearSingleCookieUtil(cookie, cleanedDomain);
  if (result.success) {
    success = true;
  } else {
    if (result.error) {
      const report = classifyError(new Error(result.error), "cookie remove", {
        domain: cleanedDomain,
      });
      errorCode = report.code;
    }
  }

  const durationMs = Date.now() - startTime;
  metricsService.recordCookieMutation("clearSingleCookie", success, durationMs, {
    domain: cleanedDomain,
    errorCode,
    metadata: { cookieName: cookie.name },
  });

  return success;
};
