import type { Settings } from "@/types";
import { storage, SETTINGS_KEY, LAST_SCHEDULED_CLEANUP_KEY } from "@/lib/store";
import { CleanupHandler } from "../handlers/cleanup";
import { shouldPerformCleanup } from "@/utils/cleanup";

export class ScheduledCleanupService {
  private readonly cleanupHandler: CleanupHandler;

  constructor() {
    this.cleanupHandler = new CleanupHandler();
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

      const lastCleanup = (await storage.getItem<number>(LAST_SCHEDULED_CLEANUP_KEY)) || 0;
      const now = Date.now();
      let lastScheduledCleanup: number | undefined;

      if (shouldPerformCleanup(settings, lastCleanup, now)) {
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
