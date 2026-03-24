import type {
  Cookie,
  CookieStats,
  CleanupExecutionResult,
  CleanupTrigger,
  CookieClearType,
  BackgroundRequest,
  ApiResponse,
  GetCurrentTabCookiesData,
} from "@/types";
import { ErrorCode } from "@/types";

export class BackgroundService {
  private static createErrorResponse<T>(code: ErrorCode, message: string): ApiResponse<T> {
    return {
      success: false,
      error: { code, message },
    };
  }

  private static async sendMessage<T>(request: BackgroundRequest): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(request, (response) => {
        if (chrome.runtime.lastError) {
          resolve(
            this.createErrorResponse<T>(
              ErrorCode.INTERNAL_ERROR,
              chrome.runtime.lastError.message || "Unknown error"
            )
          );
        } else if (response) {
          resolve(response as ApiResponse<T>);
        } else {
          resolve(
            this.createErrorResponse<T>(ErrorCode.INTERNAL_ERROR, "No response from background")
          );
        }
      });
    });
  }

  static async getCurrentTabCookies(): Promise<ApiResponse<GetCurrentTabCookiesData>> {
    return await this.sendMessage<GetCurrentTabCookiesData>({
      type: "getCurrentTabCookies",
    });
  }

  static async getStats(domain?: string): Promise<ApiResponse<CookieStats>> {
    return await this.sendMessage<CookieStats>({
      type: "getStats",
      domain,
    });
  }

  static async createCookie(cookie: Partial<Cookie>): Promise<ApiResponse<{ cookie: Cookie }>> {
    return await this.sendMessage<{ cookie: Cookie }>({
      type: "createCookie",
      payload: cookie,
    });
  }

  static async updateCookie(
    original: Cookie,
    updates: Partial<Cookie>
  ): Promise<ApiResponse<{ cookie: Cookie }>> {
    return await this.sendMessage<{ cookie: Cookie }>({
      type: "updateCookie",
      payload: { original, updates },
    });
  }

  static async deleteCookie(cookie: Cookie): Promise<ApiResponse<void>> {
    return await this.sendMessage<void>({
      type: "deleteCookie",
      payload: cookie,
    });
  }

  static async cleanupByDomain(
    domain: string,
    trigger: CleanupTrigger,
    options?: {
      clearType?: CookieClearType;
      clearCache?: boolean;
      clearLocalStorage?: boolean;
      clearIndexedDB?: boolean;
    }
  ): Promise<ApiResponse<CleanupExecutionResult>> {
    return await this.sendMessage<CleanupExecutionResult>({
      type: "cleanupByDomain",
      payload: { domain, trigger, ...options },
    });
  }

  static async cleanupWithFilter(
    filterType: "all" | "domain" | "domain-list",
    filterValue: string | undefined,
    trigger: CleanupTrigger,
    options?: {
      clearType?: CookieClearType;
      clearCache?: boolean;
      clearLocalStorage?: boolean;
      clearIndexedDB?: boolean;
      domainList?: string[];
    }
  ): Promise<ApiResponse<CleanupExecutionResult>> {
    return await this.sendMessage<CleanupExecutionResult>({
      type: "cleanupWithFilter",
      payload: { filterType, filterValue, trigger, ...options },
    });
  }

  static async exportLogs(options?: {
    sanitize?: boolean;
    includeMetadata?: boolean;
  }): Promise<ApiResponse<string>> {
    return await this.sendMessage<string>({
      type: "exportLogs",
      payload: { options },
    });
  }
}
