import { storage, SETTINGS_KEY, DEFAULT_SETTINGS } from "@/lib/store";
import type { Settings } from "@/types";
import { classifyError } from "./error-reporting";

const CURRENT_SETTINGS_VERSION = 1;

type MigrationFunction = (settings: Partial<Settings>) => Partial<Settings>;

interface Migration {
  version: number;
  up: MigrationFunction;
}

const migrations: Migration[] = [
  {
    version: 1,
    up: (settings) => {
      return {
        ...settings,
        settingsVersion: 1,
      };
    },
  },
];

export class SettingsMigrator {
  async migrateSettings(): Promise<Settings> {
    try {
      const currentSettings = await storage.getItem<Partial<Settings>>(SETTINGS_KEY);

      if (!currentSettings) {
        await storage.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }

      const currentVersion = currentSettings.settingsVersion || 0;

      if (currentVersion >= CURRENT_SETTINGS_VERSION) {
        return { ...DEFAULT_SETTINGS, ...currentSettings } as Settings;
      }

      let migratedSettings = { ...currentSettings };

      for (const migration of migrations) {
        if (migration.version > currentVersion) {
          migratedSettings = migration.up(migratedSettings);
        }
      }

      const finalSettings: Settings = {
        ...DEFAULT_SETTINGS,
        ...migratedSettings,
      };

      await storage.setItem(SETTINGS_KEY, finalSettings);
      console.log(
        `Settings migrated from version ${currentVersion} to ${CURRENT_SETTINGS_VERSION}`
      );

      return finalSettings;
    } catch (e) {
      classifyError(e, "settings migration");
      await storage.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.migrateSettings();
    return settings;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const newSettings: Settings = {
      ...currentSettings,
      ...updates,
      settingsVersion: CURRENT_SETTINGS_VERSION,
    };
    await storage.setItem(SETTINGS_KEY, newSettings);
    return newSettings;
  }
}
