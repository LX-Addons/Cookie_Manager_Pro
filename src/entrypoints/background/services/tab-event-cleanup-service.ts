import type { Settings } from "@/types";
import { CleanupHandler } from "../handlers/cleanup";

export class TabEventCleanupService {
  private cleanupHandler: CleanupHandler;

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

  async handleTabDiscard(tab: chrome.tabs.Tab, settings: Settings): Promise<void> {
    if (!settings.cleanupOnTabDiscard || !tab.url) return;

    try {
      const url = new URL(tab.url);
      const trigger = "tab-discard" as const;
      await this.cleanupHandler.cleanupByDomain(
        url.hostname,
        trigger,
        this.getCleanupOptions(settings)
      );
    } catch (e) {
      console.error(`Failed to cleanup on tab discard for ${tab.url}:`, e);
    }
  }

  async handleTabNavigate(
    tabId: number,
    changeInfo: { url?: string },
    previousUrl: string | undefined,
    settings: Settings
  ): Promise<void> {
    if (!changeInfo.url) return;

    if (!settings.cleanupOnNavigate || !previousUrl || previousUrl === changeInfo.url) {
      return;
    }

    try {
      const previousHostname = new URL(previousUrl).hostname;
      const currentHostname = new URL(changeInfo.url).hostname;

      if (previousHostname !== currentHostname) {
        const trigger = "navigate" as const;
        await this.cleanupHandler.cleanupByDomain(
          previousHostname,
          trigger,
          this.getCleanupOptions(settings)
        );
      }
    } catch (e) {
      console.error("Failed to cleanup on navigation:", e);
    }
  }

  async cleanupClosedTab(hostname: string, settings: Settings): Promise<void> {
    const trigger = "tab-close" as const;
    await this.cleanupHandler.cleanupByDomain(hostname, trigger, this.getCleanupOptions(settings));
  }
}
