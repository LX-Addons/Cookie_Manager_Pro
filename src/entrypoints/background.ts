import { defineBackground } from "wxt/utils/define-background";
import {
  storage,
  WHITELIST_KEY,
  BLACKLIST_KEY,
  SETTINGS_KEY,
  DEFAULT_SETTINGS,
  SCHEDULE_INTERVAL_MAP,
} from "@/lib/store";
import type { Settings } from "@/types";
import { performCleanup, performCleanupWithFilter } from "@/utils/cleanup";
import { CookieClearType, ScheduleInterval } from "@/types";
import { ALARM_INTERVAL_MINUTES } from "@/lib/constants";

// Track tab URLs for navigation detection
const tabUrlMap = new Map<number, string>();

const checkScheduledCleanup = async () => {
  try {
    const settings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (!settings || settings.scheduleInterval === ScheduleInterval.DISABLED) {
      return;
    }

    const now = Date.now();
    const lastCleanup = settings.lastScheduledCleanup || 0;
    const interval = SCHEDULE_INTERVAL_MAP[settings.scheduleInterval];

    if (now - lastCleanup >= interval) {
      await performCleanupWithFilter(() => true, {
        clearType: CookieClearType.ALL,
        clearCache: settings.clearCache,
        clearLocalStorage: settings.clearLocalStorage,
        clearIndexedDB: settings.clearIndexedDB,
      });

      await storage.setItem(SETTINGS_KEY, {
        ...settings,
        lastScheduledCleanup: now,
      });
    }
  } catch (e) {
    console.error("Failed to perform scheduled cleanup:", e);
  }
};

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    const whitelist = await storage.getItem(WHITELIST_KEY);
    const blacklist = await storage.getItem(BLACKLIST_KEY);
    const settings = await storage.getItem(SETTINGS_KEY);

    if (whitelist === undefined) {
      await storage.setItem(WHITELIST_KEY, []);
    }

    if (blacklist === undefined) {
      await storage.setItem(BLACKLIST_KEY, []);
    }

    if (settings === undefined) {
      await storage.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
    }

    await chrome.alarms.create("scheduled-cleanup", {
      periodInMinutes: ALARM_INTERVAL_MINUTES,
    });
    await checkScheduledCleanup();
  });

  // Track tab URLs for navigation detection
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const settings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (!settings?.enableAutoCleanup) return;

    // Handle tab discard cleanup
    if (settings.cleanupOnTabDiscard && changeInfo.discarded && tab.url) {
      try {
        const url = new URL(tab.url);
        await performCleanup({
          domain: url.hostname,
          clearCache: settings.clearCache,
          clearLocalStorage: settings.clearLocalStorage,
          clearIndexedDB: settings.clearIndexedDB,
        });
      } catch (e) {
        console.error("Failed to cleanup on tab discard:", e);
      }
    }

    // Handle navigation cleanup (when URL changes within same tab)
    if (settings.cleanupOnNavigate && changeInfo.url && tab.url) {
      const previousUrl = tabUrlMap.get(tabId);
      if (previousUrl && previousUrl !== changeInfo.url) {
        try {
          const url = new URL(previousUrl);
          await performCleanup({
            domain: url.hostname,
            clearCache: settings.clearCache,
            clearLocalStorage: settings.clearLocalStorage,
            clearIndexedDB: settings.clearIndexedDB,
          });
        } catch (e) {
          console.error("Failed to cleanup on navigation:", e);
        }
      }
      tabUrlMap.set(tabId, changeInfo.url);
    }

    // Store URL for future navigation detection
    if (tab.url && !tabUrlMap.has(tabId)) {
      tabUrlMap.set(tabId, tab.url);
    }
  });

  // Handle tab close cleanup
  chrome.tabs.onRemoved.addListener(async (tabId) => {
    const settings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (!settings?.enableAutoCleanup || !settings?.cleanupOnTabClose) return;

    const closedUrl = tabUrlMap.get(tabId);
    if (closedUrl) {
      try {
        const url = new URL(closedUrl);
        await performCleanup({
          domain: url.hostname,
          clearCache: settings.clearCache,
          clearLocalStorage: settings.clearLocalStorage,
          clearIndexedDB: settings.clearIndexedDB,
        });
      } catch (e) {
        console.error("Failed to cleanup on tab close:", e);
      }
      tabUrlMap.delete(tabId);
    }
  });

  // Handle browser close cleanup - store domains to clean on next startup
  chrome.windows.onRemoved.addListener(async () => {
    const settings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (!settings?.enableAutoCleanup || !settings?.cleanupOnBrowserClose) return;

    try {
      const tabs = await chrome.tabs.query({});
      const domainsToClean = new Set<string>();

      for (const tab of tabs) {
        if (tab.url) {
          try {
            const url = new URL(tab.url);
            domainsToClean.add(url.hostname);
          } catch {
            // Invalid URL, skip
          }
        }
      }

      // Store domains to clean on next startup
      await storage.setItem("local:cleanupOnStartup", Array.from(domainsToClean));
    } catch (e) {
      console.error("Failed to prepare cleanup on browser close:", e);
    }
  });

  chrome.runtime.onStartup.addListener(async () => {
    await chrome.alarms.create("scheduled-cleanup", {
      periodInMinutes: ALARM_INTERVAL_MINUTES,
    });

    const settings = await storage.getItem<Settings>(SETTINGS_KEY);
    if (!settings?.enableAutoCleanup) return;

    // Handle browser close cleanup (cleanup domains from previous session)
    if (settings.cleanupOnBrowserClose) {
      try {
        const domainsToClean = await storage.getItem<string[]>("local:cleanupOnStartup");
        if (domainsToClean && domainsToClean.length > 0) {
          for (const domain of domainsToClean) {
            try {
              await performCleanup({
                domain,
                clearCache: settings.clearCache,
                clearLocalStorage: settings.clearLocalStorage,
                clearIndexedDB: settings.clearIndexedDB,
              });
            } catch (e) {
              console.error(`Failed to cleanup domain ${domain} on startup:`, e);
            }
          }
          // Clear the stored domains
          await storage.setItem("local:cleanupOnStartup", []);
        }
      } catch (e) {
        console.error("Failed to cleanup on browser close startup:", e);
      }
    }

    // Handle startup cleanup for open tabs
    if (settings.cleanupOnStartup) {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (activeTab?.url) {
          try {
            const url = new URL(activeTab.url);
            await performCleanup({
              domain: url.hostname,
              clearCache: settings.clearCache,
              clearLocalStorage: settings.clearLocalStorage,
              clearIndexedDB: settings.clearIndexedDB,
            });
          } catch (e) {
            console.error("Failed to cleanup active tab on startup:", e);
          }
        } else {
          const allTabs = await chrome.tabs.query({});
          for (const tab of allTabs) {
            if (tab?.url) {
              try {
                const url = new URL(tab.url);
                await performCleanup({
                  domain: url.hostname,
                  clearCache: settings.clearCache,
                  clearLocalStorage: settings.clearLocalStorage,
                  clearIndexedDB: settings.clearIndexedDB,
                });
              } catch (e) {
                console.error(`Failed to cleanup tab ${tab.id} on startup:`, e);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to cleanup on startup:", e);
      }
    }
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "scheduled-cleanup") {
      await checkScheduledCleanup();
    }
  });
});
