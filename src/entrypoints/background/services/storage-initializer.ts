import { storage, WHITELIST_KEY, BLACKLIST_KEY, SETTINGS_KEY, DEFAULT_SETTINGS } from "@/lib/store";

export class StorageInitializer {
  async initialize(): Promise<void> {
    const whitelist = await storage.getItem(WHITELIST_KEY);
    const blacklist = await storage.getItem(BLACKLIST_KEY);
    const settings = await storage.getItem(SETTINGS_KEY);

    if (whitelist == null) {
      await storage.setItem(WHITELIST_KEY, []);
    }

    if (blacklist == null) {
      await storage.setItem(BLACKLIST_KEY, []);
    }

    if (settings == null) {
      await storage.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
    }
  }
}
