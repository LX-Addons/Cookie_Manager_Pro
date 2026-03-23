import type { Cookie, CookieStats, ApiResponse } from "@/types";
import { ErrorCode } from "@/types";
import { isTrackingCookie, isThirdPartyCookie } from "@/utils/cookie-risk";
import { isDomainMatch } from "@/utils/domain";
import {
  clearSingleCookie,
  createCookie as createCookieInStore,
  editCookie,
} from "@/entrypoints/background/services/cookie-mutations";
import { getAllCookies } from "@/utils/cleanup/cookie-ops";
import { logService } from "@/entrypoints/background/services/log-service";
import {
  reportBackgroundError,
  classifyError,
} from "@/entrypoints/background/services/error-reporting";

export class CookiesHandler {
  async getCurrentTabCookies(): Promise<ApiResponse<{ cookies: Cookie[]; domain: string }>> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    let domain = "";
    if (tab?.url) {
      try {
        const url = new URL(tab.url);
        domain = url.hostname;
      } catch {
        domain = "";
      }
    }

    const allCookies = await getAllCookies();
    const currentCookiesList = domain
      ? allCookies.filter((c) => isDomainMatch(c.domain, domain))
      : [];

    return {
      success: true,
      data: {
        cookies: currentCookiesList.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
          expirationDate: c.expirationDate,
          storeId: c.storeId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          partitionKey: (c as any).partitionKey as string | undefined,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          firstPartyDomain: (c as any).firstPartyDomain as string | undefined,
        })),
        domain,
      },
    };
  }

  async getStats(domain?: string): Promise<ApiResponse<CookieStats>> {
    const allCookies = await getAllCookies();
    const currentCookiesList = domain
      ? allCookies.filter((c) => isDomainMatch(c.domain, domain))
      : [];

    const sessionCookies = currentCookiesList.filter((c) => !c.expirationDate);
    const persistentCookies = currentCookiesList.filter((c) => c.expirationDate);
    const thirdPartyCookies = domain
      ? currentCookiesList.filter((c) => isThirdPartyCookie(c.domain, domain))
      : [];
    const trackingCookies = currentCookiesList.filter((c) => isTrackingCookie(c));

    return {
      success: true,
      data: {
        total: allCookies.length,
        current: currentCookiesList.length,
        session: sessionCookies.length,
        persistent: persistentCookies.length,
        thirdParty: thirdPartyCookies.length,
        tracking: trackingCookies.length,
      },
    };
  }

  async createCookie(cookie: Partial<Cookie>): Promise<ApiResponse<{ cookie: Cookie }>> {
    try {
      const success = await createCookieInStore(cookie as Partial<chrome.cookies.Cookie>);
      if (success) {
        return { success: true, data: { cookie: cookie as Cookie } };
      }
      reportBackgroundError(
        ErrorCode.COOKIE_CREATE_FAILED,
        "createCookie",
        "Failed to create cookie",
        {
          domain: cookie.domain,
        }
      );
      return {
        success: false,
        error: { code: ErrorCode.COOKIE_CREATE_FAILED, message: "Failed to create cookie" },
      };
    } catch (e) {
      classifyError(e, "createCookie", { domain: cookie.domain });
      return {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: (e as Error).message },
      };
    }
  }

  async updateCookie(
    original: Cookie,
    updates: Partial<Cookie>
  ): Promise<ApiResponse<{ cookie: Cookie }>> {
    try {
      const success = await editCookie(
        original as unknown as chrome.cookies.Cookie,
        updates as Partial<chrome.cookies.Cookie>
      );
      if (success) {
        const updatedCookie = { ...original, ...updates };
        const domain = original.domain.replace(/^\./, "");
        await logService.logEdit(domain, 1, "Cookie updated");
        return { success: true, data: { cookie: updatedCookie } };
      }
      reportBackgroundError(
        ErrorCode.COOKIE_UPDATE_FAILED,
        "updateCookie",
        "Failed to update cookie",
        {
          domain: original.domain,
        }
      );
      return {
        success: false,
        error: { code: ErrorCode.COOKIE_UPDATE_FAILED, message: "Failed to update cookie" },
      };
    } catch (e) {
      classifyError(e, "updateCookie", { domain: original.domain });
      return {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: (e as Error).message },
      };
    }
  }

  async deleteCookie(cookie: Cookie): Promise<ApiResponse> {
    try {
      const cleanedDomain = cookie.domain.replace(/^\./, "");
      const success = await clearSingleCookie(
        cookie as unknown as chrome.cookies.Cookie,
        cleanedDomain
      );
      if (success) {
        await logService.logDelete(cleanedDomain, 1, "Cookie deleted");
        return { success: true };
      }
      reportBackgroundError(
        ErrorCode.COOKIE_REMOVE_FAILED,
        "deleteCookie",
        "Failed to delete cookie",
        {
          domain: cookie.domain,
        }
      );
      return {
        success: false,
        error: { code: ErrorCode.COOKIE_REMOVE_FAILED, message: "Failed to delete cookie" },
      };
    } catch (e) {
      classifyError(e, "deleteCookie", { domain: cookie.domain });
      return {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: (e as Error).message },
      };
    }
  }
}
