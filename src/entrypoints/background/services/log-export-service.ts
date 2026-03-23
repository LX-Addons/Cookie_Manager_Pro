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

  private addMetadata(data: string): string {
    const exportInfo = {
      exportTime: new Date().toISOString(),
      version: "1.0.0",
    };
    const logs = JSON.parse(data);
    return JSON.stringify(
      {
        ...exportInfo,
        logs,
      },
      null,
      2
    );
  }

  async exportLogs(options: LogExportOptions = {}): Promise<LogExportResult> {
    try {
      const logs = (await storage.getItem<ClearLogEntry[]>(CLEAR_LOG_KEY)) || [];

      let processedLogs = logs;
      if (options.sanitize) {
        processedLogs = logs.map((log) => this.sanitizeLogEntry(log));
      }

      let dataStr = JSON.stringify(processedLogs, null, 2);
      if (options.includeMetadata) {
        dataStr = this.addMetadata(dataStr);
      }

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
