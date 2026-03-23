import type { ClearLogEntry } from "@/types";
import { CLEAR_LOG_KEY, storage } from "@/lib/store";

export interface LogExportOptions {
  sanitize?: boolean;
  includeMetadata?: boolean;
}

export interface LogExportResult {
  success: boolean;
  data?: string;
  error?: string;
}

export class LogExportService {
  private sanitizeLogEntry(entry: ClearLogEntry): ClearLogEntry {
    return {
      ...entry,
      details: entry.details ? "[sanitized]" : undefined,
    };
  }

  private addMetadata(logs: ClearLogEntry[]): object {
    return {
      exportTime: new Date().toISOString(),
      version: "1.0.0",
      logs,
    };
  }

  async exportLogs(options: LogExportOptions = {}): Promise<LogExportResult> {
    try {
      const logs = (await storage.getItem<ClearLogEntry[]>(CLEAR_LOG_KEY)) || [];

      let processedLogs = logs;
      if (options.sanitize) {
        processedLogs = logs.map((log) => this.sanitizeLogEntry(log));
      }

      const outputData = options.includeMetadata ? this.addMetadata(processedLogs) : processedLogs;
      const dataStr = JSON.stringify(outputData, null, 2);

      return {
        success: true,
        data: dataStr,
      };
    } catch (e) {
      console.error("Failed to export logs:", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }
  }
}

export const logExportService = new LogExportService();
