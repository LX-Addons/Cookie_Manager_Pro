import type { Settings } from "@/types";
import { cleanupExecutor, type CleanupOptions } from "./cleanup-executor";

const isValidHttpUrl = (url: URL): boolean => {
  return (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname;
};

export class TabEventCleanupService {
  private getCleanupOptions(settings: Settings): CleanupOptions {
    return {
      clearType: settings.clearType,
      clearCache: settings.clearCache,
      clearLocalStorage: settings.clearLocalStorage,
      clearIndexedDB: settings.clearIndexedDB,
    };
  }

  async handleTabDiscard(tab: chrome.tabs.Tab, settings: Settings): Promise<void> {
    if (!settings.cleanupOnTabDiscard || !tab.url) return;

    try {
      const url = new URL(tab.url);
      if (!isValidHttpUrl(url)) return;
      const trigger = "tab-discard" as const;
      await cleanupExecutor.executeByDomain(
        url.hostname,
        trigger,
        settings,
        this.getCleanupOptions(settings)
      );
    } catch (e) {
      console.error(`Failed to cleanup on tab discard for ${tab.url}:`, e);
    }
  }

  async handleTabNavigate(
    _tabId: number,
    changeInfo: { url?: string },
    previousUrl: string | undefined,
    settings: Settings
  ): Promise<void> {
    if (!changeInfo.url) return;

    if (!settings.cleanupOnNavigate || !previousUrl || previousUrl === changeInfo.url) {
      return;
    }

    try {
      const previous = new URL(previousUrl);
      const current = new URL(changeInfo.url);

      if (!isValidHttpUrl(previous) || !isValidHttpUrl(current)) return;

      if (previous.hostname !== current.hostname) {
        const trigger = "navigate" as const;
        await cleanupExecutor.executeByDomain(
          previous.hostname,
          trigger,
          settings,
          this.getCleanupOptions(settings)
        );
      }
    } catch (e) {
      console.error("Failed to cleanup on navigation:", e);
    }
  }

  async cleanupClosedTab(hostname: string, settings: Settings): Promise<void> {
    if (!hostname) return;
    try {
      const trigger = "tab-close" as const;
      await cleanupExecutor.executeByDomain(
        hostname,
        trigger,
        settings,
        this.getCleanupOptions(settings)
      );
    } catch (e) {
      console.error(`Failed to cleanup on tab close for ${hostname}:`, e);
    }
  }
}
