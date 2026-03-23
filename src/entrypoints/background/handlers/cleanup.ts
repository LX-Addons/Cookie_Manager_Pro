import type { CleanupExecutionResult, CleanupTrigger, ApiResponse } from "@/types";
import { CookieClearType, ErrorCode } from "@/types";
import { runCleanup, runCleanupWithFilter } from "@/utils/cleanup/cleanup-runner";
import { isDomainMatch } from "@/utils/domain";
import { metricsService } from "@/entrypoints/background/services/metrics";
import { logService } from "@/entrypoints/background/services/log-service";
import { classifyError } from "@/entrypoints/background/services/error-reporting";

export class CleanupHandler {
  async cleanupByDomain(
    domain: string,
    trigger: CleanupTrigger,
    options?: {
      clearType?: CookieClearType;
      clearCache?: boolean;
      clearLocalStorage?: boolean;
      clearIndexedDB?: boolean;
    }
  ): Promise<ApiResponse<CleanupExecutionResult>> {
    const startTime = Date.now();
    try {
      const result = await runCleanup({
        domain,
        trigger,
        ...options,
      });

      metricsService.recordCleanup("cleanupByDomain", result.success, result.durationMs, {
        domain,
        trigger,
        metadata: {
          cookiesRemoved: result.cookiesRemoved,
          matchedDomains: result.matchedDomains.length,
        },
      });

      if (result.success && result.cookiesRemoved > 0) {
        await logService.logCleanup(
          domain,
          options?.clearType || CookieClearType.ALL,
          result.cookiesRemoved,
          trigger
        );
      }

      return { success: true, data: result };
    } catch (e) {
      const durationMs = Date.now() - startTime;
      const errorReport = classifyError(e, "cleanupByDomain", { domain, trigger });
      metricsService.recordCleanup("cleanupByDomain", false, durationMs, {
        domain,
        trigger,
        metadata: {
          error: e instanceof Error ? e.message : "Unknown error",
        },
      });
      return {
        success: false,
        error: { code: errorReport.code as ErrorCode, message: errorReport.message },
      };
    }
  }

  async cleanupWithFilter(
    filterType: "all" | "domain" | "domain-list",
    filterValue: string | undefined,
    domainList: string[] | undefined,
    trigger: CleanupTrigger,
    options?: {
      clearType?: CookieClearType;
      clearCache?: boolean;
      clearLocalStorage?: boolean;
      clearIndexedDB?: boolean;
    }
  ): Promise<ApiResponse<CleanupExecutionResult>> {
    const startTime = Date.now();

    let filterFn: (domain: string) => boolean;

    switch (filterType) {
      case "all":
        filterFn = () => true;
        break;
      case "domain":
        filterFn = (domain) => (filterValue ? isDomainMatch(domain, filterValue) : false);
        break;
      case "domain-list":
        filterFn = (domain) =>
          domainList ? domainList.some((listDomain) => isDomainMatch(domain, listDomain)) : false;
        break;
      default:
        filterFn = () => true;
    }

    try {
      const result = await runCleanupWithFilter(filterFn, {
        trigger,
        ...options,
      });

      metricsService.recordCleanup("cleanupWithFilter", result.success, result.durationMs, {
        trigger,
        metadata: {
          filterType,
          cookiesRemoved: result.cookiesRemoved,
          matchedDomains: result.matchedDomains.length,
        },
      });

      if (result.success && result.cookiesRemoved > 0) {
        await logService.logCleanup(
          result.matchedDomains,
          options?.clearType || CookieClearType.ALL,
          result.cookiesRemoved,
          trigger
        );
      }

      return { success: true, data: result };
    } catch (e) {
      const durationMs = Date.now() - startTime;
      const errorReport = classifyError(e, "cleanupWithFilter", { trigger });
      metricsService.recordCleanup("cleanupWithFilter", false, durationMs, {
        trigger,
        metadata: {
          filterType,
          error: e instanceof Error ? e.message : "Unknown error",
        },
      });
      return {
        success: false,
        error: { code: errorReport.code as ErrorCode, message: errorReport.message },
      };
    }
  }
}
