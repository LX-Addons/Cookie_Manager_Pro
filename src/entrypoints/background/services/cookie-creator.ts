import { createCookie as createCookieUtil } from "@/utils/cleanup/cookie-ops";
import { classifyError } from "./error-reporting";
import { metricsService } from "./metrics";

export const createCookie = async (
  cookie: Partial<chrome.cookies.Cookie>
): Promise<chrome.cookies.Cookie | null> => {
  const startTime = Date.now();
  let created: chrome.cookies.Cookie | null = null;
  let errorCode: string | undefined;

  try {
    created = await createCookieUtil(cookie);
    return created;
  } catch (e) {
    const report = classifyError(e, "cookie create", {
      domain: cookie.domain,
    });
    errorCode = report.code;
    return null;
  } finally {
    const durationMs = Date.now() - startTime;
    metricsService.recordCookieMutation("createCookie", created !== null, durationMs, {
      domain: cookie.domain,
      errorCode,
      metadata: { cookieName: cookie.name },
    });
  }
};
