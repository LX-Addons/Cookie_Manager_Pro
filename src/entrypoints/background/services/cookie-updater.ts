import { editCookie as editCookieUtil } from "@/utils/cleanup/cookie-ops";
import { classifyError } from "./error-reporting";
import { metricsService } from "./metrics";

export const editCookie = async (
  originalCookie: chrome.cookies.Cookie,
  updates: Partial<chrome.cookies.Cookie>
): Promise<boolean> => {
  const startTime = Date.now();
  let success = false;
  let errorCode: string | undefined;

  try {
    success = await editCookieUtil(originalCookie, updates);
    return success;
  } catch (e) {
    const report = classifyError(e, "cookie update", {
      domain: originalCookie.domain,
    });
    errorCode = report.code;
    return false;
  } finally {
    const durationMs = Date.now() - startTime;
    metricsService.recordCookieMutation("editCookie", success, durationMs, {
      domain: originalCookie.domain,
      errorCode,
      metadata: { cookieName: originalCookie.name },
    });
  }
};
