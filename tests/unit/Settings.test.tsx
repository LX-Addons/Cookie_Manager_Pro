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

let useStorageMock: any;

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
        "settings.logRetention": "日志保留时长",
        "settings.logRetentionDesc": "控制操作日志的保存时间，过长时间的日志会占用存储空间",
        "settings.oneHour": "1小时",
        "settings.sixHours": "6小时",
        "settings.twelveHours": "12小时",
        "settings.oneDay": "1天",
        "settings.threeDays": "3天",
        "settings.sevenDays": "7天",
        "settings.tenDays": "10天",
        "settings.thirtyDays": "30天",
        "settings.forever": "永久",
        "settings.themeMode": "主题模式",
        "settings.themeModeDesc": "选择您喜欢的界面主题，自定义主题可以让您完全掌控视觉效果",
        "settings.followBrowser": "跟随浏览器",
        "settings.light": "亮色",
        "settings.dark": "暗色",
        "settings.custom": "自定义",
        "settings.primaryColor": "主色调",
        "settings.successColor": "成功色",
        "settings.warningColor": "警告色",
        "settings.dangerColor": "危险色",
        "settings.bgPrimary": "主背景",
        "settings.bgSecondary": "次背景",
        "settings.textPrimary": "主文字",
        "settings.textSecondary": "次文字",
        "settings.autoCleanup": "自动清理",
        "settings.autoCleanupDesc": "配置不同场景下的自动清理行为，减少手动操作的繁琐",
        "settings.enableAutoCleanup": "启用自动清理",
        "settings.cleanupOnTabDiscard": "启用已丢弃/未加载标签的清理",
        "settings.cleanupOnStartup": "启动时清理打开标签页的 Cookie",
        "settings.cleanupExpiredCookies": "清理所有过期的 Cookie",
        "settings.language": "语言设置",
        "settings.languageDesc": "选择您喜欢的界面语言",
        "settings.settingsSaved": "设置已保存",
        "settings.privacyProtection": "隐私保护",
        "settings.privacyProtectionDesc": "增强您的在线隐私保护，识别并警示潜在的追踪行为",
        "settings.showCookieRisk": "显示 Cookie 风险评估",
        "settings.advancedCleanup": "高级清理",
        "settings.advancedCleanupDesc": "除了 Cookie 外，还可以清理其他可能存储您数据的浏览器存储",
        "settings.clearLocalStorage": "清理本地存储",
        "settings.clearIndexedDB": "清理索引数据库",
        "settings.clearCache": "清理缓存",
      };
      return translations[key] || key;
    },
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/components/RadioGroup", () => ({
  RadioGroup: ({
    name,
    value,
    onChange,
    options,
  }: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div data-testid={`radio-${name}`}>
      {options.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  ),
}));

vi.mock("@/components/CheckboxGroup", () => ({
  CheckboxGroup: ({
    options,
  }: {
    options: { checked: boolean; label: string; onChange: (checked: boolean) => void }[];
  }) => (
    <div data-testid="checkbox-group">
      {options.map((option, index) => (
        <label key={index}>
          <input
            type="checkbox"
            checked={option.checked}
            onChange={(e) => option.onChange(e.target.checked)}
          />
          {option.label}
        </label>
      ))}
    </div>
  ),
}));

describe("Settings", () => {
  const mockOnMessage = vi.fn();

  beforeEach(() => {
    mockOnMessage.mockClear();
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

    (vi.mocked as any)(useStorageMock).mockClear();
  });

  it("should render settings container", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("工作模式")).toBeTruthy();
    expect(screen.getByText("Cookie清除类型")).toBeTruthy();
    expect(screen.getByText("定时清理")).toBeTruthy();
    expect(screen.getByText("日志保留时长")).toBeTruthy();
  });

  it("should render work mode section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("工作模式")).toBeTruthy();
    expect(
      screen.getByText("控制 Cookie 清理的应用范围，根据您的需求选择合适的保护策略")
    ).toBeTruthy();
  });

  it("should render cookie clear type section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("Cookie清除类型")).toBeTruthy();
    expect(
      screen.getByText("选择要清除的 Cookie 类型，会话 Cookie 在关闭浏览器后会自动失效")
    ).toBeTruthy();
  });

  it("should render scheduled cleanup section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("定时清理")).toBeTruthy();
    expect(screen.getByText("设置自动清理的时间间隔，确保您的隐私得到持续保护")).toBeTruthy();
  });

  it("should render log retention section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("日志保留时长")).toBeTruthy();
    expect(screen.getByText("控制操作日志的保存时间，过长时间的日志会占用存储空间")).toBeTruthy();
  });

  it("should render theme mode section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("主题模式")).toBeTruthy();
    expect(
      screen.getByText("选择您喜欢的界面主题，自定义主题可以让您完全掌控视觉效果")
    ).toBeTruthy();
  });

  it("should render auto cleanup section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("自动清理")).toBeTruthy();
    expect(screen.getByText("配置不同场景下的自动清理行为，减少手动操作的繁琐")).toBeTruthy();
  });

  it("should render privacy protection section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("隐私保护")).toBeTruthy();
    expect(screen.getByText("增强您的在线隐私保护，识别并警示潜在的追踪行为")).toBeTruthy();
  });

  it("should render advanced cleanup section with description", () => {
    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("高级清理")).toBeTruthy();
    expect(
      screen.getByText("除了 Cookie 外，还可以清理其他可能存储您数据的浏览器存储")
    ).toBeTruthy();
  });

  it("should handle log retention change to one hour", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const select = screen.getByTestId("log-retention-select");
    fireEvent.change(select, { target: { value: LogRetention.ONE_HOUR } });

    expect(mockOnMessage).toHaveBeenCalledWith("设置已保存");
  });

  it("should handle log retention change to seven days", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const select = screen.getByTestId("log-retention-select");
    fireEvent.change(select, { target: { value: LogRetention.SEVEN_DAYS } });

    expect(mockOnMessage).toHaveBeenCalledWith("设置已保存");
  });

  it("should handle all checkboxes in auto cleanup section", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const checkboxes = screen.getAllByRole("checkbox");

    fireEvent.click(checkboxes[0]);
    expect(mockOnMessage).toHaveBeenCalledTimes(1);

    fireEvent.click(checkboxes[1]);
    expect(mockOnMessage).toHaveBeenCalledTimes(2);

    fireEvent.click(checkboxes[2]);
    expect(mockOnMessage).toHaveBeenCalledTimes(3);

    fireEvent.click(checkboxes[3]);
    expect(mockOnMessage).toHaveBeenCalledTimes(4);
  });

  it("should handle all checkboxes in privacy protection section", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const checkboxes = screen.getAllByRole("checkbox");

    fireEvent.click(checkboxes[4]);
    expect(mockOnMessage).toHaveBeenCalledTimes(1);
  });

  it("should handle all checkboxes in advanced cleanup section", () => {
    render(<Settings onMessage={mockOnMessage} />);

    const checkboxes = screen.getAllByRole("checkbox");

    fireEvent.click(checkboxes[5]);
    expect(mockOnMessage).toHaveBeenCalledTimes(1);

    fireEvent.click(checkboxes[6]);
    expect(mockOnMessage).toHaveBeenCalledTimes(2);

    fireEvent.click(checkboxes[7]);
    expect(mockOnMessage).toHaveBeenCalledTimes(3);
  });

  it("should show custom theme settings when custom theme is selected", () => {
    mockSettings.themeMode = ThemeMode.CUSTOM;

    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.getByText("主色调")).toBeTruthy();
    expect(screen.getByText("成功色")).toBeTruthy();
    expect(screen.getByText("警告色")).toBeTruthy();
    expect(screen.getByText("危险色")).toBeTruthy();
    expect(screen.getByText("主背景")).toBeTruthy();
    expect(screen.getByText("次背景")).toBeTruthy();
    expect(screen.getByText("主文字")).toBeTruthy();
    expect(screen.getByText("次文字")).toBeTruthy();
  });

  it("should not show custom theme settings when theme is not custom", () => {
    mockSettings.themeMode = ThemeMode.LIGHT;

    render(<Settings onMessage={mockOnMessage} />);

    expect(screen.queryByText("主色调")).toBeNull();
  });

  it("should render custom theme color inputs when custom theme is selected", () => {
    mockSettings.themeMode = ThemeMode.CUSTOM;

    render(<Settings onMessage={mockOnMessage} />);

    const colorInputs = document.querySelectorAll('input[type="color"]');
    expect(colorInputs.length).toBe(8);
  });

  it("should handle custom theme color changes", () => {
    mockSettings.themeMode = ThemeMode.CUSTOM;

    render(<Settings onMessage={mockOnMessage} />);

    const colorInputs = document.querySelectorAll('input[type="color"]');

    // Change first color input
    fireEvent.change(colorInputs[0], { target: { value: "#ff0000" } });
    expect(mockOnMessage).toHaveBeenCalledWith("设置已保存");
  });
});
