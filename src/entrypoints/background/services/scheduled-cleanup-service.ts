import type { Settings } from "@/types";
import { storage, LAST_SCHEDULED_CLEANUP_KEY } from "@/lib/store";
import { cleanupExecutor, type CleanupOptions } from "./cleanup-executor";
import { shouldPerformCleanup } from "@/utils/cleanup";
import { createCleanupLock } from "@/lib/distributed-lock";

export class ScheduledCleanupService {
  private getCleanupOptions(settings: Settings): CleanupOptions {
    return {
      clearType: settings.clearType,
      clearCache: settings.clearCache,
      clearLocalStorage: settings.clearLocalStorage,
      clearIndexedDB: settings.clearIndexedDB,
    };
  }

  async runScheduledCleanup(settings: Settings): Promise<void> {
    if (!settings.enableAutoCleanup) return;

    const lock = createCleanupLock();
    const { acquired } = await lock.withLock(async () => {
      await this.runScheduledCleanupInternal(settings);
    });

    if (!acquired) {
      console.log("[ScheduledCleanup] Another cleanup is in progress, skipping");
    }
  }

  private async runScheduledCleanupInternal(settings: Settings): Promise<void> {
    try {
      const lastCleanup = (await storage.getItem<number>(LAST_SCHEDULED_CLEANUP_KEY)) || 0;
      const now = Date.now();

      if (shouldPerformCleanup(settings, lastCleanup, now)) {
        const trigger = "scheduled" as const;
        const result = await cleanupExecutor.executeWithFilter(
          "all",
          undefined,
          undefined,
          trigger,
          settings,
          this.getCleanupOptions(settings)
        );

        if (result.success) {
          await storage.setItem(LAST_SCHEDULED_CLEANUP_KEY, now);
        }
      }
    } catch (e) {
      console.error("Failed to perform scheduled cleanup:", e);
    }
  }
}
