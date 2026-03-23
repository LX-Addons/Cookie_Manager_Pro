import type { Settings } from "@/types";
import { storage, CLEANUP_ON_STARTUP_KEY } from "@/lib/store";
import { CleanupHandler } from "../handlers/cleanup";

export class StartupCleanupService {
  private cleanupHandler: CleanupHandler;
  private saveQueue = Promise.resolve();

  constructor() {
    this.cleanupHandler = new CleanupHandler();
  }

  async saveDomainForCleanup(hostname: string): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        const domainsToClean = (await storage.getItem<string[]>(CLEANUP_ON_STARTUP_KEY)) || [];
        domainsToClean.push(hostname);
        await storage.setItem(CLEANUP_ON_STARTUP_KEY, Array.from(new Set(domainsToClean)));
      } catch (e) {
        console.error(`Failed to save domain ${hostname} for cleanup:`, e);
      }
    });

    return this.saveQueue;
  }

  private getCleanupOptions(settings: Settings) {
    return {
      clearType: settings.clearType,
      clearCache: settings.clearCache,
      clearLocalStorage: settings.clearLocalStorage,
      clearIndexedDB: settings.clearIndexedDB,
    };
  }

  async cleanupDomainsOnStartup(settings: Settings): Promise<void> {
    const domainsToClean = await storage.getItem<string[]>(CLEANUP_ON_STARTUP_KEY);
    if (!domainsToClean || domainsToClean.length === 0) return;

    const failedDomains: string[] = [];

    for (const domain of domainsToClean) {
      const trigger = "browser-close-recovery" as const;
      const result = await this.cleanupHandler.cleanupByDomain(
        domain,
        trigger,
        this.getCleanupOptions(settings)
      );
      if (!result.success) {
        failedDomains.push(domain);
      }
    }

    await storage.setItem(CLEANUP_ON_STARTUP_KEY, failedDomains);
  }

  async cleanupOpenTabsOnStartup(settings: Settings, tabUrls: string[]): Promise<void> {
    if (tabUrls.length === 0) return;

    for (const url of tabUrls) {
      try {
        const parsedUrl = new URL(url);
        const trigger = "startup" as const;
        await this.cleanupHandler.cleanupByDomain(
          parsedUrl.hostname,
          trigger,
          this.getCleanupOptions(settings)
        );
      } catch (e) {
        console.error(`Failed to cleanup tab ${url}:`, e);
      }
    }
  }

  async runStartupTasks(settings: Settings, tabUrls: string[]): Promise<void> {
    if (!settings.enableAutoCleanup) return;

    if (settings.cleanupOnBrowserClose) {
      try {
        await this.cleanupDomainsOnStartup(settings);
      } catch (e) {
        console.error("Failed to cleanup on browser close startup:", e);
      }
    }

    if (settings.cleanupOnStartup) {
      try {
        await this.cleanupOpenTabsOnStartup(settings, tabUrls);
      } catch (e) {
        console.error("Failed to cleanup on startup:", e);
      }
    }
  }
}
