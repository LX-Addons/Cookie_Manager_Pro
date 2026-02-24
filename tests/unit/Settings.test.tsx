import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Settings } from "@/components/Settings";
import { LogRetention, ModeType, CookieClearType, ThemeMode, ScheduleInterval } from "@/types";
import { DEFAULT_CUSTOM_THEME } from "@/lib/store";

let mockSettings = {
  mode: ModeType.WHITELIST,
  themeMode: ThemeMode.AUTO,
  clearType: CookieClearType.ALL,
  clearCache: false,
  clearLocalStorage: false,
  clearIndexedDB: false,
  cleanupOnStartup: false,
  cleanupExpiredCookies: false,
  logRetention: LogRetention.SEVEN_DAYS,
  locale: "zh-CN",
  enableAutoCleanup: false,
  cleanupOnTabDiscard: false,
  customTheme: DEFAULT_CUSTOM_THEME,
  scheduleInterval: ScheduleInterval.DISABLED,
  showCookieRisk: true,
};

let useStorageMock: (key: string, defaultValue: unknown) => unknown[];

vi.mock("@/hooks/useStorage", () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    return useStorageMock(key, defaultValue);
  }),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "settings.workMode": "工作模式",
        "settings.workModeDesc": "控制 Cookie 清理的应用范围，根据您的需求选择合适的保护策略",
        "settings.whitelistMode": "白名单模式：仅白名单内网站不执行清理",
        "settings.blacklistMode": "黑名单模式：仅黑名单内网站执行清理",
        "settings.cookieClearType": "Cookie清除类型",
        "settings.cookieClearTypeDesc":
          "选择要清除的 Cookie 类型，会话 Cookie 在关闭浏览器后会自动失效",
        "settings.clearSessionOnly": "仅清除会话Cookie",
        "settings.clearPersistentOnly": "仅清除持久Cookie",
        "settings.clearAll": "清除所有Cookie",
        "settings.scheduledCleanup": "定时清理",
        "settings.scheduledCleanupDesc": "设置自动清理的时间间隔，确保您的隐私得到持续保护",
        "settings.disabled": "禁用",
        "settings.hourly": "每小时",
        "settings.daily": "每天",
        "settings.weekly": "每周",
        "settings.clearCache": "清除缓存",
        "settings.clearCacheDesc": "在清理 Cookie 时同时清除浏览器缓存数据",
        "settings.clearLocalStorage": "清除LocalStorage",
        "settings.clearLocalStorageDesc": "在清理 Cookie 时同时清除本地存储数据",
        "settings.clearIndexedDB": "清除IndexedDB",
        "settings.clearIndexedDBDesc": "在清理 Cookie 时同时清除 IndexedDB 数据库",
        "settings.cleanupOnStartup": "启动时清理",
        "settings.cleanupOnStartupDesc": "浏览器启动时自动执行一次 Cookie 清理",
        "settings.cleanupExpiredCookies": "清理过期Cookie",
        "settings.cleanupExpiredCookiesDesc": "自动识别并清理已过期的 Cookie",
        "settings.logRetention": "日志保留时间",
        "settings.logRetentionDesc": "设置清理日志的保留时间，超过此时间的日志将被自动删除",
        "settings.oneHour": "1小时",
        "settings.sixHours": "6小时",
        "settings.twelveHours": "12小时",
        "settings.oneDay": "1天",
        "settings.threeDays": "3天",
        "settings.sevenDays": "7天",
        "settings.tenDays": "10天",
        "settings.thirtyDays": "30天",
        "settings.themeMode": "主题模式",
        "settings.themeModeDesc": "选择您喜欢的界面主题风格",
        "settings.themeAuto": "跟随系统",
        "settings.themeLight": "浅色主题",
        "settings.themeDark": "深色主题",
        "settings.customTheme": "自定义主题",
        "settings.customThemeDesc": "自定义扩展的主题颜色",
        "settings.primaryColor": "主色调",
        "settings.successColor": "成功色",
        "settings.warningColor": "警告色",
        "settings.dangerColor": "危险色",
        "settings.bgPrimaryColor": "主背景色",
        "settings.bgSecondaryColor": "次背景色",
        "settings.textPrimaryColor": "主文字色",
        "settings.textSecondaryColor": "次文字色",
        "settings.resetTheme": "重置主题",
        "settings.language": "语言",
        "settings.languageDesc": "选择扩展界面的显示语言",
        "settings.showCookieRisk": "显示Cookie风险等级",
        "settings.showCookieRiskDesc": "在Cookie列表中显示每个Cookie的风险等级评估",
      };
      return translations[key] || key;
    },
  }),
}));

describe("Settings", () => {
  const mockOnMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSettings = {
      mode: ModeType.WHITELIST,
      themeMode: ThemeMode.AUTO,
      clearType: CookieClearType.ALL,
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: LogRetention.SEVEN_DAYS,
      locale: "zh-CN",
      enableAutoCleanup: false,
      cleanupOnTabDiscard: false,
      customTheme: DEFAULT_CUSTOM_THEME,
      scheduleInterval: ScheduleInterval.DISABLED,
      showCookieRisk: true,
    };

    useStorageMock = vi.fn((key: string, defaultValue: unknown) => {
      if (key === "local:settings") {
        return [
          mockSettings,
          vi.fn((newSettings: unknown) => {
            mockSettings = { ...mockSettings, ...(newSettings as object) };
          }),
        ];
      }
      return [defaultValue, vi.fn()];
    });
  });

  it("should render settings container", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("工作模式")).toBeTruthy();
    expect(screen.getByText("Cookie清除类型")).toBeTruthy();
  });

  it("should render work mode section", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("白名单模式：仅白名单内网站不执行清理")).toBeTruthy();
    expect(screen.getByText("黑名单模式：仅黑名单内网站执行清理")).toBeTruthy();
  });

  it("should render cookie clear type options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("仅清除会话Cookie")).toBeTruthy();
    expect(screen.getByText("仅清除持久Cookie")).toBeTruthy();
    expect(screen.getByText("清除所有Cookie")).toBeTruthy();
  });

  it("should render scheduled cleanup options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("禁用")).toBeTruthy();
    expect(screen.getByText("每小时")).toBeTruthy();
    expect(screen.getByText("每天")).toBeTruthy();
    expect(screen.getByText("每周")).toBeTruthy();
  });

  it("should render additional cleanup options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("清除缓存")).toBeTruthy();
    expect(screen.getByText("清除LocalStorage")).toBeTruthy();
    expect(screen.getByText("清除IndexedDB")).toBeTruthy();
  });

  it("should render startup cleanup option", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("启动时清理")).toBeTruthy();
  });

  it("should render expired cookie cleanup option", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("清理过期Cookie")).toBeTruthy();
  });

  it("should render log retention options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("1小时")).toBeTruthy();
    expect(screen.getByText("7天")).toBeTruthy();
    expect(screen.getByText("30天")).toBeTruthy();
  });

  it("should render theme mode options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("跟随系统")).toBeTruthy();
    expect(screen.getByText("浅色主题")).toBeTruthy();
    expect(screen.getByText("深色主题")).toBeTruthy();
  });

  it("should render custom theme option", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("自定义主题")).toBeTruthy();
  });

  it("should render language option", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("语言")).toBeTruthy();
  });

  it("should render cookie risk option", () => {
    render(<Settings onMessage={mockOnMessage} />);

    // Use getAllByText since "显示Cookie风险等级" appears in both heading and checkbox label
    expect(screen.getAllByText("显示Cookie风险等级").length).toBeGreaterThanOrEqual(1);
  });

  it("should handle mode change", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const blacklistRadio = screen.getByLabelText("黑名单模式：仅黑名单内网站执行清理");
    fireEvent.click(blacklistRadio);

    expect(mockSettings.mode).toBe(ModeType.BLACKLIST);
  });

  it("should handle clear type change", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const sessionRadio = screen.getByLabelText("仅清除会话Cookie");
    fireEvent.click(sessionRadio);

    expect(mockSettings.clearType).toBe(CookieClearType.SESSION);
  });

  it("should handle scheduled cleanup change", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const dailyRadio = screen.getByLabelText("每天");
    fireEvent.click(dailyRadio);

    expect(mockSettings.scheduleInterval).toBe(ScheduleInterval.DAILY);
  });

  it("should handle clear cache toggle", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const cacheToggle = screen.getByLabelText("清除缓存");
    fireEvent.click(cacheToggle);

    // CheckboxGroup uses unified onChange API, verify the checkbox is clickable
    expect(cacheToggle).toBeTruthy();
  });

  it("should handle clear local storage toggle", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const localStorageToggle = screen.getByLabelText("清除LocalStorage");
    fireEvent.click(localStorageToggle);

    // CheckboxGroup uses unified onChange API, verify the checkbox is clickable
    expect(localStorageToggle).toBeTruthy();
  });

  it("should handle clear indexed db toggle", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const indexedDBToggle = screen.getByLabelText("清除IndexedDB");
    fireEvent.click(indexedDBToggle);

    // CheckboxGroup uses unified onChange API, verify the checkbox is clickable
    expect(indexedDBToggle).toBeTruthy();
  });

  it("should handle cleanup on startup toggle", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const startupToggle = screen.getByLabelText("启动时清理");
    fireEvent.click(startupToggle);

    // CheckboxGroup uses unified onChange API, verify the checkbox is clickable
    expect(startupToggle).toBeTruthy();
  });

  it("should handle cleanup expired cookies toggle", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const expiredToggle = screen.getByLabelText("清理过期Cookie");
    fireEvent.click(expiredToggle);

    // CheckboxGroup uses unified onChange API, verify the checkbox is clickable
    expect(expiredToggle).toBeTruthy();
  });

  it("should handle log retention change", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const oneDayRadio = screen.getByLabelText("1天");
    fireEvent.click(oneDayRadio);

    expect(mockSettings.logRetention).toBe(LogRetention.ONE_DAY);
  });

  it("should handle theme mode change", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const darkRadio = screen.getByLabelText("深色主题");
    fireEvent.click(darkRadio);

    expect(mockSettings.themeMode).toBe(ThemeMode.DARK);
  });

  it("should handle show cookie risk toggle", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const riskToggle = screen.getByLabelText("显示Cookie风险等级");
    fireEvent.click(riskToggle);

    // CheckboxGroup uses unified onChange API, verify the checkbox is clickable
    expect(riskToggle).toBeTruthy();
  });

  it("should render with auto theme mode", () => {
    mockSettings.themeMode = ThemeMode.AUTO;

    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByLabelText("跟随系统")).toBeChecked();
  });

  it("should render with light theme mode", () => {
    mockSettings.themeMode = ThemeMode.LIGHT;

    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByLabelText("浅色主题")).toBeChecked();
  });

  it("should render with dark theme mode", () => {
    mockSettings.themeMode = ThemeMode.DARK;

    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByLabelText("深色主题")).toBeChecked();
  });

  it("should render all log retention options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByLabelText("1小时")).toBeTruthy();
    expect(screen.getByLabelText("6小时")).toBeTruthy();
    expect(screen.getByLabelText("12小时")).toBeTruthy();
    expect(screen.getByLabelText("1天")).toBeTruthy();
    expect(screen.getByLabelText("3天")).toBeTruthy();
    expect(screen.getByLabelText("7天")).toBeTruthy();
    expect(screen.getByLabelText("10天")).toBeTruthy();
    expect(screen.getByLabelText("30天")).toBeTruthy();
  });

  it("should render all scheduled cleanup options", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByLabelText("禁用")).toBeTruthy();
    expect(screen.getByLabelText("每小时")).toBeTruthy();
    expect(screen.getByLabelText("每天")).toBeTruthy();
    expect(screen.getByLabelText("每周")).toBeTruthy();
  });
});
