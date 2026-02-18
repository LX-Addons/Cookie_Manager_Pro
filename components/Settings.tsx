import { useStorage } from "@plasmohq/storage/hook";
import { SETTINGS_KEY, DEFAULT_SETTINGS, DEFAULT_CUSTOM_THEME } from "~store";
import type { Settings as SettingsType, CustomTheme, Locale } from "~types";
import { CookieClearType, LogRetention, ThemeMode, ModeType, ScheduleInterval } from "~types";
import { RadioGroup } from "~components/RadioGroup";
import { CheckboxGroup } from "~components/CheckboxGroup";
import { useState } from "react";
import { useTranslation } from "~hooks/useTranslation";

interface Props {
  onMessage: (msg: string) => void;
}

export const Settings = ({ onMessage }: Props) => {
  const [settings, setSettings] = useStorage<SettingsType>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const [showCustomTheme, setShowCustomTheme] = useState(false);
  const { t, setLocale } = useTranslation();

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings({ ...settings, [key]: value });
    onMessage(t("settings.settingsSaved"));
  };

  const updateCustomTheme = (key: keyof CustomTheme, value: string) => {
    const newCustomTheme = {
      ...(settings.customTheme || DEFAULT_CUSTOM_THEME),
      [key]: value,
    };
    updateSetting("customTheme", newCustomTheme);
  };

  return (
    <div className="settings-container">
      <div className="section">
        <h3>{t("settings.workMode")}</h3>
        <p className="setting-description">
          {t("settings.workModeDesc")}
        </p>
        <RadioGroup
          name="mode"
          value={settings.mode}
          onChange={(value) => updateSetting("mode", value)}
          options={[
            { value: ModeType.WHITELIST, label: t("settings.whitelistMode") },
            { value: ModeType.BLACKLIST, label: t("settings.blacklistMode") },
          ]}
        />
      </div>

      <div className="section">
        <h3>{t("settings.cookieClearType")}</h3>
        <p className="setting-description">
          {t("settings.cookieClearTypeDesc")}
        </p>
        <RadioGroup
          name="clearType"
          value={settings.clearType}
          onChange={(value) => updateSetting("clearType", value)}
          options={[
            { value: CookieClearType.SESSION, label: t("settings.clearSessionOnly") },
            { value: CookieClearType.PERSISTENT, label: t("settings.clearPersistentOnly") },
            { value: CookieClearType.ALL, label: t("settings.clearAll") },
          ]}
        />
      </div>

      <div className="section">
        <h3>{t("settings.scheduledCleanup")}</h3>
        <p className="setting-description">{t("settings.scheduledCleanupDesc")}</p>
        <RadioGroup
          name="scheduleInterval"
          value={settings.scheduleInterval}
          onChange={(value) => updateSetting("scheduleInterval", value)}
          options={[
            { value: ScheduleInterval.DISABLED, label: t("settings.disabled") },
            { value: ScheduleInterval.HOURLY, label: t("settings.hourly") },
            { value: ScheduleInterval.DAILY, label: t("settings.daily") },
            { value: ScheduleInterval.WEEKLY, label: t("settings.weekly") },
          ]}
        />
      </div>

      <div className="section">
        <h3>{t("settings.logRetention")}</h3>
        <p className="setting-description">{t("settings.logRetentionDesc")}</p>
        <select
          data-testid="log-retention-select"
          className="select-input"
          value={settings.logRetention}
          onChange={(e) => updateSetting("logRetention", e.target.value as LogRetention)}
        >
          <option value={LogRetention.ONE_HOUR}>{t("settings.oneHour")}</option>
          <option value={LogRetention.SIX_HOURS}>{t("settings.sixHours")}</option>
          <option value={LogRetention.TWELVE_HOURS}>{t("settings.twelveHours")}</option>
          <option value={LogRetention.ONE_DAY}>{t("settings.oneDay")}</option>
          <option value={LogRetention.THREE_DAYS}>{t("settings.threeDays")}</option>
          <option value={LogRetention.SEVEN_DAYS}>{t("settings.sevenDays")}</option>
          <option value={LogRetention.TEN_DAYS}>{t("settings.tenDays")}</option>
          <option value={LogRetention.THIRTY_DAYS}>{t("settings.thirtyDays")}</option>
          <option value={LogRetention.FOREVER}>{t("settings.forever")}</option>
        </select>
      </div>

      <div className="section">
        <h3>语言设置</h3>
        <p className="setting-description">选择您喜欢的界面语言</p>
        <select
          data-testid="locale-select"
          className="select-input"
          value={settings.locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          <option value="zh-CN">中文 (简体)</option>
          <option value="en-US">English</option>
        </select>
      </div>

      <div className="section">
        <h3>{t("settings.themeMode")}</h3>
        <p className="setting-description">
          {t("settings.themeModeDesc")}
        </p>
        <RadioGroup
          name="themeMode"
          value={settings.themeMode}
          onChange={(value) => {
            updateSetting("themeMode", value);
            setShowCustomTheme(value === ThemeMode.CUSTOM);
          }}
          options={[
            { value: ThemeMode.AUTO, label: t("settings.followBrowser") },
            { value: ThemeMode.LIGHT, label: t("settings.light") },
            { value: ThemeMode.DARK, label: t("settings.dark") },
            { value: ThemeMode.CUSTOM, label: t("settings.custom") },
          ]}
        />

        {showCustomTheme && (
          <div className="custom-theme-settings">
            <div className="color-input-group">
              <label className="color-label">{t("settings.primaryColor")}</label>
              <input
                type="color"
                value={settings.customTheme?.primary || DEFAULT_CUSTOM_THEME.primary}
                onChange={(e) => updateCustomTheme("primary", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.successColor")}</label>
              <input
                type="color"
                value={settings.customTheme?.success || DEFAULT_CUSTOM_THEME.success}
                onChange={(e) => updateCustomTheme("success", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.warningColor")}</label>
              <input
                type="color"
                value={settings.customTheme?.warning || DEFAULT_CUSTOM_THEME.warning}
                onChange={(e) => updateCustomTheme("warning", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.dangerColor")}</label>
              <input
                type="color"
                value={settings.customTheme?.danger || DEFAULT_CUSTOM_THEME.danger}
                onChange={(e) => updateCustomTheme("danger", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.bgPrimary")}</label>
              <input
                type="color"
                value={settings.customTheme?.bgPrimary || DEFAULT_CUSTOM_THEME.bgPrimary}
                onChange={(e) => updateCustomTheme("bgPrimary", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.bgSecondary")}</label>
              <input
                type="color"
                value={settings.customTheme?.bgSecondary || DEFAULT_CUSTOM_THEME.bgSecondary}
                onChange={(e) => updateCustomTheme("bgSecondary", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.textPrimary")}</label>
              <input
                type="color"
                value={settings.customTheme?.textPrimary || DEFAULT_CUSTOM_THEME.textPrimary}
                onChange={(e) => updateCustomTheme("textPrimary", e.target.value)}
              />
            </div>
            <div className="color-input-group">
              <label className="color-label">{t("settings.textSecondary")}</label>
              <input
                type="color"
                value={settings.customTheme?.textSecondary || DEFAULT_CUSTOM_THEME.textSecondary}
                onChange={(e) => updateCustomTheme("textSecondary", e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <h3>{t("settings.autoCleanup")}</h3>
        <p className="setting-description">{t("settings.autoCleanupDesc")}</p>
        <CheckboxGroup
          options={[
            {
              checked: settings.enableAutoCleanup,
              label: t("settings.enableAutoCleanup"),
              onChange: (checked) => updateSetting("enableAutoCleanup", checked),
            },
            {
              checked: settings.cleanupOnTabDiscard,
              label: t("settings.cleanupOnTabDiscard"),
              onChange: (checked) => updateSetting("cleanupOnTabDiscard", checked),
            },
            {
              checked: settings.cleanupOnStartup,
              label: t("settings.cleanupOnStartup"),
              onChange: (checked) => updateSetting("cleanupOnStartup", checked),
            },
            {
              checked: settings.cleanupExpiredCookies,
              label: t("settings.cleanupExpiredCookies"),
              onChange: (checked) => updateSetting("cleanupExpiredCookies", checked),
            },
          ]}
        />
      </div>

      <div className="section">
        <h3>{t("settings.privacyProtection")}</h3>
        <p className="setting-description">{t("settings.privacyProtectionDesc")}</p>
        <CheckboxGroup
          options={[
            {
              checked: settings.showCookieRisk,
              label: t("settings.showCookieRisk"),
              onChange: (checked) => updateSetting("showCookieRisk", checked),
            },
          ]}
        />
      </div>

      <div className="section">
        <h3>{t("settings.advancedCleanup")}</h3>
        <p className="setting-description">
          {t("settings.advancedCleanupDesc")}
        </p>
        <CheckboxGroup
          options={[
            {
              checked: settings.clearLocalStorage,
              label: t("settings.clearLocalStorage"),
              onChange: (checked) => updateSetting("clearLocalStorage", checked),
            },
            {
              checked: settings.clearIndexedDB,
              label: t("settings.clearIndexedDB"),
              onChange: (checked) => updateSetting("clearIndexedDB", checked),
            },
            {
              checked: settings.clearCache,
              label: t("settings.clearCache"),
              onChange: (checked) => updateSetting("clearCache", checked),
            },
          ]}
        />
      </div>
    </div>
  );
};
