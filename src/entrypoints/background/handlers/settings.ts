import { SettingsMigrator } from "../services/settings-migrator";
import type { Settings } from "@/types";

const migrator = new SettingsMigrator();

export class SettingsHandler {
  async getSettings(): Promise<Settings> {
    return await migrator.getSettings();
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    return await migrator.updateSettings(updates);
  }
}
