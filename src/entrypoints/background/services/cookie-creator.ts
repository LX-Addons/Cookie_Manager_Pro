import { createCookie as createCookieUtil } from "@/utils/cleanup/cookie-ops";
import { classifyError } from "./error-reporting";
import { metricsService } from "./metrics";

export const createCookie = async (
  cookie: Partial<chrome.cookies.Cookie>
): Promise<chrome.cookies.Cookie | null> => {
  const startTime = Date.now();
  let created: chrome.cookies.Cookie | null = null;
  let errorCode: string | undefined;

  const result = await createCookieUtil(cookie);

  if (result.success) {
    created = result.cookie ?? null;
  } else if (result.error) {
    const report = classifyError(new Error(result.error), "cookie create", {
      domain: cookie.domain,
    });
    errorCode = report.code;
  }

  const durationMs = Date.now() - startTime;
  metricsService.recordCookieMutation("createCookie", result.success, durationMs, {
    domain: cookie.domain,
    errorCode,
    metadata: { cookieName: cookie.name },
  });

  return created;
};
