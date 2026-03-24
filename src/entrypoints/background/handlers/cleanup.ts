import type { CleanupExecutionResult, CleanupTrigger, ApiResponse } from "@/types";
import { CookieClearType, ErrorCode } from "@/types";
import { cleanupExecutor, type CleanupOptions } from "../services/cleanup-executor";

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
    const result = await cleanupExecutor.executeByDomain(
      domain,
      trigger,
      options as CleanupOptions
    );

    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      error: {
        code: result.error?.code as ErrorCode,
        message: result.error?.message || "Unknown error",
      },
    };
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
    const result = await cleanupExecutor.executeWithFilter(
      filterType,
      filterValue,
      domainList,
      trigger,
      options as CleanupOptions
    );

    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      error: {
        code: result.error?.code as ErrorCode,
        message: result.error?.message || "Unknown error",
      },
    };
  }
}
