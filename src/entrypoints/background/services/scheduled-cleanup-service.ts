import type { Settings } from "@/types";
import { ScheduleInterval } from "@/types";
import { storage, SETTINGS_KEY, SCHEDULE_INTERVAL_MAP } from "@/lib/store";
import { CleanupHandler } from "../handlers/cleanup";

export class ScheduledCleanupService {
  private cleanupHandler: CleanupHandler;

  constructor() {
    this.cleanupHandler = new CleanupHandler();
  }

  private shouldPerformCleanup(settings: Settings, now: number): boolean {
    if (settings.scheduleInterval === ScheduleInterval.DISABLED) return false;
    const lastCleanup = settings.lastScheduledCleanup || 0;
    const interval = SCHEDULE_INTERVAL_MAP[settings.scheduleInterval];
    return now - lastCleanup >= interval;
  }

  private async updateLastScheduledCleanup(timestamp: number): Promise<void> {
    const latestSettings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (latestSettings) {
      await storage.setItem(SETTINGS_KEY, {
        ...latestSettings,
        lastScheduledCleanup: timestamp,
      });
    }
  }

  private getCleanupOptions(settings: Settings) {
    return {
      clearType: settings.clearType,
      clearCache: settings.clearCache,
      clearLocalStorage: settings.clearLocalStorage,
      clearIndexedDB: settings.clearIndexedDB,
    };
  }

  async runScheduledCleanup(): Promise<{ lastScheduledCleanup: number | undefined }> {
    try {
      const settings = await storage.getItem<Settings>(SETTINGS_KEY);
      if (!settings?.enableAutoCleanup) return { lastScheduledCleanup: undefined };

      const now = Date.now();
      let lastScheduledCleanup: number | undefined;

      if (this.shouldPerformCleanup(settings, now)) {
        const trigger = "scheduled" as const;
        await this.cleanupHandler.cleanupWithFilter(
          "all",
          undefined,
          undefined,
          trigger,
          this.getCleanupOptions(settings)
        );
        lastScheduledCleanup = now;
      }

      return { lastScheduledCleanup };
    } catch (e) {
      console.error("Failed to perform scheduled cleanup:", e);
      return { lastScheduledCleanup: undefined };
    }
  }
}
