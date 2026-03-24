import { editCookie as editCookieUtil } from "@/utils/cleanup/cookie-ops";
import { classifyError } from "./error-reporting";
import { metricsService } from "./metrics";

export const editCookie = async (
  originalCookie: chrome.cookies.Cookie,
  updates: Partial<chrome.cookies.Cookie>
): Promise<chrome.cookies.Cookie | null> => {
  const startTime = Date.now();
  let success = false;
  let errorCode: string | undefined;
  let result: chrome.cookies.Cookie | null = null;

  const editResult = await editCookieUtil(originalCookie, updates);

  if (editResult.success) {
    success = true;
    result = editResult.cookie ?? null;
  } else if (editResult.error) {
    const report = classifyError(new Error(editResult.error), "cookie update", {
      domain: originalCookie.domain,
    });
    errorCode = report.code;
  }

  const durationMs = Date.now() - startTime;
  metricsService.recordCookieMutation("editCookie", success, durationMs, {
    domain: originalCookie.domain,
    errorCode,
    metadata: { cookieName: originalCookie.name },
  });

  return result;
};
