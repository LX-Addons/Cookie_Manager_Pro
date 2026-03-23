import { ErrorCode, ExtensionErrorReport } from "@/types";
import { metricsService } from "./metrics";

const errorHistory: ExtensionErrorReport[] = [];
const MAX_ERROR_HISTORY = 100;

export const reportBackgroundError = (
  code: ErrorCode | string,
  operation: string,
  message: string,
  options?: {
    trigger?: string;
    domain?: string;
    recoverable?: boolean;
    originalError?: unknown;
  }
): ExtensionErrorReport => {
  const report: ExtensionErrorReport = {
    code,
    operation,
    message,
    trigger: options?.trigger,
    domain: options?.domain,
    recoverable: options?.recoverable ?? true,
    timestamp: Date.now(),
    originalError: options?.originalError,
  };

  console.error(`[${report.code}] ${report.operation}: ${report.message}`, {
    trigger: report.trigger,
    domain: report.domain,
    recoverable: report.recoverable,
    originalError: report.originalError,
  });

  errorHistory.push(report);
  if (errorHistory.length > MAX_ERROR_HISTORY) {
    errorHistory.shift();
  }

  metricsService.recordError(operation, String(code), 0, {
    domain: options?.domain,
    trigger: options?.trigger,
    metadata: { message },
  });

  return report;
};

export const getErrorHistory = (): ExtensionErrorReport[] => {
  return [...errorHistory];
};

export const clearErrorHistory = (): void => {
  errorHistory.length = 0;
};

export const isPermissionDeniedError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("permission") ||
      error.message.includes("Permission") ||
      error.message.includes("access denied")
    );
  }
  return false;
};

export const classifyError = (
  error: unknown,
  operation: string,
  options?: { trigger?: string; domain?: string }
): ExtensionErrorReport => {
  let code: ErrorCode;
  let message: string;
  let recoverable = true;

  if (error instanceof Error) {
    message = error.message;
    if (isPermissionDeniedError(error)) {
      code = ErrorCode.PERMISSION_DENIED;
      recoverable = false;
    } else if (operation.includes("cookie") && operation.includes("remove")) {
      code = ErrorCode.COOKIE_REMOVE_FAILED;
    } else if (operation.includes("cookie") && operation.includes("create")) {
      code = ErrorCode.COOKIE_CREATE_FAILED;
    } else if (operation.includes("cookie") && operation.includes("update")) {
      code = ErrorCode.COOKIE_UPDATE_FAILED;
    } else if (operation.includes("browsingData")) {
      code = ErrorCode.BROWSING_DATA_FAILED;
    } else if (operation.includes("storage") && operation.includes("read")) {
      code = ErrorCode.STORAGE_READ_FAILED;
    } else if (operation.includes("storage") && operation.includes("write")) {
      code = ErrorCode.STORAGE_WRITE_FAILED;
    } else if (operation.includes("tab")) {
      code = ErrorCode.TAB_QUERY_FAILED;
    } else {
      code = ErrorCode.INTERNAL_ERROR;
    }
  } else {
    message = String(error);
    code = ErrorCode.INTERNAL_ERROR;
  }

  return reportBackgroundError(code, operation, message, {
    ...options,
    recoverable,
    originalError: error,
  });
};
