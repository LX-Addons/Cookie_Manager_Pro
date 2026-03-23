import { clearSingleCookie as clearSingleCookieUtil } from "@/utils/cleanup/cookie-ops";
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
    success = await clearSingleCookieUtil(cookie, cleanedDomain);
    return success;
  } catch (e) {
    const report = classifyError(e, "cookie remove", {
      domain: cleanedDomain,
    });
    errorCode = report.code;
    return false;
  } finally {
    const durationMs = Date.now() - startTime;
    metricsService.recordCookieMutation("clearSingleCookie", success, durationMs, {
      domain: cleanedDomain,
      errorCode,
      metadata: { cookieName: cookie.name },
    });
  }
};
