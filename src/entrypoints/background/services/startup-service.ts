import type { Settings } from "@/types";
import { ALARM_INTERVAL_MINUTES } from "@/lib/constants";
import { TabUrlManager } from "./tab-url-manager";
import { ScheduledCleanupService } from "./scheduled-cleanup-service";
import { StartupCleanupService } from "./startup-cleanup-service";
import { ExpiredCookieService } from "./expired-cookie-service";
import { StorageInitializer } from "./storage-initializer";
import { storage, SETTINGS_KEY } from "@/lib/store";

export class StartupService {
  private tabUrlManager: TabUrlManager;
  private scheduledCleanupService: ScheduledCleanupService;
  private startupCleanupService: StartupCleanupService;
  private expiredCookieService: ExpiredCookieService;
  private storageInitializer: StorageInitializer;

  constructor(
    tabUrlManager: TabUrlManager,
    scheduledCleanupService: ScheduledCleanupService,
    startupCleanupService: StartupCleanupService,
    expiredCookieService: ExpiredCookieService,
    storageInitializer: StorageInitializer
  ) {
    this.tabUrlManager = tabUrlManager;
    this.scheduledCleanupService = scheduledCleanupService;
    this.startupCleanupService = startupCleanupService;
    this.expiredCookieService = expiredCookieService;
    this.storageInitializer = storageInitializer;
  }

  async handleInstalled(): Promise<void> {
    await this.storageInitializer.initialize();
    await this.tabUrlManager.initializeFromTabs();
    await chrome.alarms.create("scheduled-cleanup", {
      periodInMinutes: ALARM_INTERVAL_MINUTES,
    });
    const { lastScheduledCleanup } = await this.scheduledCleanupService.runScheduledCleanup();
    if (lastScheduledCleanup !== undefined) {
      await this.updateLastScheduledCleanup(lastScheduledCleanup);
    }
  }

  async handleStartup(): Promise<void> {
    await chrome.alarms.create("scheduled-cleanup", {
      periodInMinutes: ALARM_INTERVAL_MINUTES,
    });

    const settings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (!settings) return;

    await this.tabUrlManager.initializeFromTabs();
    await this.startupCleanupService.runStartupTasks(settings, this.tabUrlManager.getUrls());
    await this.expiredCookieService.runExpiredCookiesCleanup(settings, false);
  }

  async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === "scheduled-cleanup") {
      const settings = await storage.getItem<Settings>(SETTINGS_KEY);
      if (!settings) return;

      const { lastScheduledCleanup } = await this.scheduledCleanupService.runScheduledCleanup();
      await this.expiredCookieService.runExpiredCookiesCleanup(settings, true, Date.now());
      if (lastScheduledCleanup !== undefined) {
        await this.updateLastScheduledCleanup(lastScheduledCleanup);
      }
    }
  }

  async handleSettingsChange(
    newSettings: Settings | null,
    oldSettings: Settings | null
  ): Promise<void> {
    if (newSettings?.enableAutoCleanup && !oldSettings?.enableAutoCleanup) {
      await this.tabUrlManager.initializeFromTabs();
    }
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
}
