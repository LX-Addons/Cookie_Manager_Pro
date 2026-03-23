import type { BackgroundRequest, ApiResponse } from "@/types";
import { ErrorCode } from "@/types";
import { CookiesHandler } from "../handlers/cookies";
import { CleanupHandler } from "../handlers/cleanup";
import { logExportService } from "./log-export-service";

let cookiesHandler: CookiesHandler | null = null;
let cleanupHandler: CleanupHandler | null = null;

const getCookiesHandler = (): CookiesHandler => {
  if (!cookiesHandler) {
    cookiesHandler = new CookiesHandler();
  }
  return cookiesHandler;
};

const getCleanupHandler = (): CleanupHandler => {
  if (!cleanupHandler) {
    cleanupHandler = new CleanupHandler();
  }
  return cleanupHandler;
};

export const createSuccessResponse = <T>(data?: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const createErrorResponse = (code: ErrorCode, message: string): ApiResponse => ({
  success: false,
  error: { code, message },
});

function hasValidRequestType(request: unknown): request is BackgroundRequest & { type: string } {
  return (
    typeof request === "object" &&
    request !== null &&
    "type" in request &&
    typeof (request as Record<string, unknown>).type === "string"
  );
}

export const handleMessage = async (request: unknown): Promise<ApiResponse> => {
  if (!hasValidRequestType(request)) {
    return createErrorResponse(ErrorCode.INVALID_PARAMETERS, "Invalid request format");
  }

  const { type } = request;

  switch (type) {
    case "getCurrentTabCookies": {
      return await getCookiesHandler().getCurrentTabCookies();
    }
    case "getStats": {
      return await getCookiesHandler().getStats(request.domain);
    }
    case "createCookie": {
      return await getCookiesHandler().createCookie(request.payload);
    }
    case "updateCookie": {
      return await getCookiesHandler().updateCookie(
        request.payload.original,
        request.payload.updates
      );
    }
    case "deleteCookie": {
      return await getCookiesHandler().deleteCookie(request.payload);
    }
    case "cleanupByDomain": {
      return await getCleanupHandler().cleanupByDomain(
        request.payload.domain,
        request.payload.trigger,
        {
          clearType: request.payload.clearType,
          clearCache: request.payload.clearCache,
          clearLocalStorage: request.payload.clearLocalStorage,
          clearIndexedDB: request.payload.clearIndexedDB,
        }
      );
    }
    case "cleanupWithFilter": {
      return await getCleanupHandler().cleanupWithFilter(
        request.payload.filterType,
        request.payload.filterValue,
        request.payload.domainList,
        request.payload.trigger,
        {
          clearType: request.payload.clearType,
          clearCache: request.payload.clearCache,
          clearLocalStorage: request.payload.clearLocalStorage,
          clearIndexedDB: request.payload.clearIndexedDB,
        }
      );
    }
    case "exportLogs": {
      const result = await logExportService.exportLogs(request.payload?.options);
      if (result.success && result.data) {
        return createSuccessResponse({ data: result.data });
      }
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, result.error || "Export failed");
    }
    default:
      return createErrorResponse(ErrorCode.INVALID_PARAMETERS, `Unknown message type: ${type}`);
  }
};
