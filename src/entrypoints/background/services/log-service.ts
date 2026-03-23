import type { ClearLogEntry, CookieClearType } from "@/types";
import { LogRetention } from "@/types";
import { storage, CLEAR_LOG_KEY, SETTINGS_KEY, LOG_RETENTION_MAP } from "@/lib/store";

let logIdCounter = 0;

export class LogService {
  private static getNextLogId(): string {
    logIdCounter += 1;
    return `${Date.now()}-${logIdCounter}`;
  }

  private static async applyRetentionPolicy(
    currentLogs: ClearLogEntry[]
  ): Promise<ClearLogEntry[]> {
    try {
      const settings = await storage.getItem<{ logRetention?: LogRetention }>(SETTINGS_KEY);
      if (!settings?.logRetention) {
        return currentLogs;
      }

      const maxAge = LOG_RETENTION_MAP[settings.logRetention];
      if (!maxAge) {
        return currentLogs;
      }

      const cutoffTime = Date.now() - maxAge;
      return currentLogs.filter((log) => log.timestamp >= cutoffTime);
    } catch {
      return currentLogs;
    }
  }

  private static async addLogEntry(params: {
    domain?: string;
    domains?: string[];
    cookieType?: CookieClearType;
    count: number;
    action: ClearLogEntry["action"];
    details?: string;
  }): Promise<void> {
    const now = Date.now();
    const newLog: ClearLogEntry = {
      id: this.getNextLogId(),
      domain: params.domain,
      domains: params.domains,
      cookieType: params.cookieType,
      count: params.count,
      timestamp: now,
      action: params.action,
      details: params.details,
    };

    let currentLogs = (await storage.getItem<ClearLogEntry[]>(CLEAR_LOG_KEY)) || [];
    currentLogs = await this.applyRetentionPolicy(currentLogs);
    const updatedLogs = [newLog, ...currentLogs];
    await storage.setItem(CLEAR_LOG_KEY, updatedLogs);
  }

  static async logCleanup(
    domainOrDomains: string | string[],
    cookieType: CookieClearType,
    count: number,
    details?: string
  ): Promise<void> {
    if (count > 0) {
      const isMultiple = Array.isArray(domainOrDomains);
      await this.addLogEntry({
        domain: isMultiple ? undefined : domainOrDomains,
        domains: isMultiple ? domainOrDomains : undefined,
        cookieType,
        count,
        action: "clear",
        details,
      });
    }
  }

  static async logEdit(domain: string, count: number, details?: string): Promise<void> {
    await this.addLogEntry({
      domain,
      count,
      action: "edit",
      details,
    });
  }

  static async logDelete(domain: string, count: number, details?: string): Promise<void> {
    await this.addLogEntry({
      domain,
      count,
      action: "delete",
      details,
    });
  }
}

export const logService = LogService;
