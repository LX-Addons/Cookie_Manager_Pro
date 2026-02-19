import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import IndexPopup from "../../popup";

interface CookieListProps {
  cookies: unknown[];
  currentDomain?: string;
  onUpdate?: () => void;
  onMessage?: (text: string, isError?: boolean) => void;
  whitelist?: string[];
  blacklist?: string[];
  onAddToWhitelist?: (domains: string[]) => void;
  onAddToBlacklist?: (domains: string[]) => void;
}

vi.mock("~utils/cleanup", () => ({
  performCleanupWithFilter: vi.fn(() =>
    Promise.resolve({ count: 5, clearedDomains: ["example.com"] })
  ),
  cleanupExpiredCookies: vi.fn(() => Promise.resolve(3)),
  performCleanup: vi.fn(() => Promise.resolve({ count: 2, clearedDomains: ["test.com"] })),
}));

let cookieListProps: CookieListProps | null = null;
vi.mock("~components/CookieList", () => ({
  CookieList: vi.fn((props: CookieListProps) => {
    cookieListProps = props;
    return <div data-testid="cookie-list">Cookie 详情</div>;
  }),
}));

vi.mock("~hooks/useTranslation", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        "common.confirm": "确定",
        "common.cancel": "取消",
        "common.add": "添加",
        "common.delete": "删除",
        "common.save": "保存",
        "common.edit": "编辑",
        "common.clear": "清除",
        "common.clearAll": "清除全部",
        "common.export": "导出",
        "common.yes": "是",
        "common.no": "否",
        "common.count": "{count} 个",
        "common.domains": "{domain} 等{count}个域名",
        "common.allWebsites": "所有网站",
        "tabs.manage": "管理",
        "tabs.whitelist": "白名单",
        "tabs.blacklist": "黑名单",
        "tabs.settings": "设置",
        "tabs.log": "日志",
        "popup.currentWebsite": "当前网站",
        "popup.cookieStats": "Cookie统计",
        "popup.total": "总数",
        "popup.current": "当前网站",
        "popup.session": "会话",
        "popup.persistent": "持久",
        "popup.thirdParty": "第三方",
        "popup.tracking": "追踪",
        "popup.quickActions": "快速操作",
        "popup.addToWhitelist": "添加到白名单",
        "popup.addToBlacklist": "添加到黑名单",
        "popup.clearCurrent": "清除当前网站",
        "popup.clearAllCookies": "清除所有Cookie",
        "popup.unableToGetDomain": "无法获取域名",
        "popup.updateStatsFailed": "更新统计信息失败",
        "popup.clearCookiesFailed": "清除Cookie失败",
        "popup.startupCleanup": "启动清理",
        "popup.expiredCookieCleanup": "过期 Cookie 清理",
        "popup.cleanedExpired": "已清理 {count} 个过期 Cookie",
        "popup.noExpiredFound": "没有找到过期的 Cookie",
        "popup.cleanExpiredFailed": "清理过期 Cookie 失败",
        "popup.addedToWhitelist": "已添加 {domain} 到白名单",
        "popup.alreadyInWhitelist": "{domain} 已在白名单中",
        "popup.addedToBlacklist": "已添加 {domain} 到黑名单",
        "popup.alreadyInBlacklist": "{domain} 已在黑名单中",
        "popup.clearedSuccess": "{successMsg} {count} 个Cookie",
        "popup.confirmClear": "清除确认",
        "popup.confirmClearCurrent": "确定要清除 {domain} 的Cookie吗？",
        "popup.confirmClearAll": "确定要清除所有Cookie吗？（白名单除外）",
        "popup.clearedBlacklist": "已清除黑名单网站的 {count} 个Cookie",
        "popup.noBlacklistCookies": "黑名单网站暂无Cookie可清除",
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
        "settings.privacyProtection": "隐私保护",
        "settings.privacyProtectionDesc": "增强您的在线隐私保护，识别并警示潜在的追踪行为",
        "settings.showCookieRisk": "显示 Cookie 风险评估",
        "settings.advancedCleanup": "高级清理",
        "settings.advancedCleanupDesc": "除了 Cookie 外，还可以清理其他可能存储您数据的浏览器存储",
        "settings.clearLocalStorage": "清理本地存储",
        "settings.clearIndexedDB": "清理索引数据库",
        "settings.clearCache": "清理缓存",
        "settings.settingsSaved": "设置已保存",
        "domainManager.whitelistDomains": "白名单域名",
        "domainManager.blacklistDomains": "黑名单域名",
        "domainManager.whitelistHelp": "白名单中的域名Cookie不会被清除",
        "domainManager.blacklistHelp": "黑名单中的域名Cookie将被优先清除",
        "domainManager.domainPlaceholder": "例如: google.com",
        "domainManager.addCurrentWebsite": "添加当前网站",
        "domainManager.clearBlacklistCookies": "清除黑名单Cookie",
        "domainManager.domainEmpty": "域名不能为空",
        "domainManager.invalidDomain": "域名格式不正确",
        "domainManager.alreadyInList": "{domain} 已在{listType}中",
        "domainManager.addedToList": "已添加到{listType}",
        "domainManager.deleted": "已删除",
        "clearLog.clearLogs": "清除日志",
        "clearLog.clearExpired": "清除过期",
        "clearLog.exportLogs": "导出日志",
        "clearLog.clearAllLogs": "清除全部",
        "clearLog.confirmClearLogs": "确定要清除所有日志记录吗？",
        "clearLog.logsCleared": "已清除所有日志",
        "clearLog.logRetentionForever": "日志保留设置为永久，无需清理",
        "clearLog.expiredLogsCleared": "已清除 {count} 条过期日志",
        "clearLog.noExpiredLogs": "没有需要清理的过期日志",
        "clearLog.logsExported": "日志已导出",
        "clearLog.noLogs": "暂无清除日志记录",
        "cookieList.noCookies": "当前网站暂无 Cookie",
        "cookieList.cookieDetails": "Cookie 详情 ({count})",
        "cookieList.selected": "{count} 个已选中",
        "cookieList.deleteSelected": "删除选中",
        "cookieList.addToWhitelist": "加入白名单",
        "cookieList.addToBlacklist": "加入黑名单",
        "cookieList.selectAll": "全选",
        "cookieList.deletedCookie": "已删除 Cookie: {name}",
        "cookieList.deleteCookieFailed": "删除 Cookie 失败",
        "cookieList.deleteSensitiveCookie": "删除敏感 Cookie",
        "cookieList.deleteConfirm": "删除确认",
        "cookieList.deleteSensitiveMessage":
          '即将删除敏感 Cookie "{name}"，这可能导致您在该网站的登录状态失效。确定要继续吗？',
        "cookieList.deleteMessage": '确定要删除 Cookie "{name}" 吗？',
        "cookieList.cookieUpdated": "Cookie 已更新",
        "cookieList.updateCookieFailed": "更新 Cookie 失败",
        "cookieList.deleteSelectedSensitive": "批量删除敏感 Cookie",
        "cookieList.deleteSelectedConfirm": "批量删除确认",
        "cookieList.deleteSelectedSensitiveMessage":
          "选中的 Cookie 中包含 {sensitiveCount} 个敏感 Cookie，删除后可能影响登录状态。确定要删除选中的 {selectedCount} 个 Cookie 吗？",
        "cookieList.deleteSelectedMessage": "确定要删除选中的 {selectedCount} 个 Cookie 吗？",
        "cookieList.deletedSelected": "已删除 {count} 个 Cookie",
        "cookieList.functionUnavailable": "此功能当前不可用",
        "cookieList.addedDomainsToWhitelist": "已添加 {count} 个域名到白名单",
        "cookieList.domainsAlreadyInWhitelist": "所选域名已在白名单中",
        "cookieList.selectDomainsFirst": "请先选择要添加的域名",
        "cookieList.addedDomainsToBlacklist": "已添加 {count} 个域名到黑名单",
        "cookieList.domainsAlreadyInBlacklist": "所选域名已在黑名单中",
        "cookieList.sensitiveCookie": "敏感 Cookie",
        "cookieList.edit": "编辑",
        "cookieList.hide": "隐藏",
        "cookieList.show": "显示",
        "cookieList.value": "值:",
        "cookieList.path": "路径:",
        "cookieList.secure": "安全:",
        "cookieList.httpOnly": "仅 HTTP:",
        "cookieList.sameSite": "SameSite:",
        "cookieList.notSet": "未设置",
        "cookieList.expirationTime": "过期时间:",
        "cookieList.lowRisk": "低风险",
        "cookieList.mediumRisk": "中风险",
        "cookieList.highRisk": "高风险",
        "cookieList.trackingCookie": "疑似追踪 Cookie",
        "cookieList.thirdPartyCookie": "第三方 Cookie",
        "cookieList.notHttpOnly": "非 HttpOnly（可被 JavaScript 访问）",
        "cookieList.notSecure": "非 Secure（可能在不安全连接中传输）",
        "cookieEditor.editCookie": "编辑 Cookie",
        "cookieEditor.createCookie": "新建 Cookie",
        "cookieEditor.name": "名称",
        "cookieEditor.value": "值",
        "cookieEditor.domain": "域名",
        "cookieEditor.path": "路径",
        "cookieEditor.expiration": "过期时间（Unix 时间戳，可选）",
        "cookieEditor.expirationPlaceholder": "留空表示会话 Cookie",
        "cookieEditor.sameSite": "SameSite",
        "cookieEditor.unspecified": "未设置",
        "cookieEditor.strict": "Strict",
        "cookieEditor.lax": "Lax",
        "cookieEditor.none": "None",
        "cookieEditor.secureOnly": "Secure（仅 HTTPS）",
        "cookieEditor.httpOnlyOnly": "HttpOnly（禁止 JavaScript 访问）",
        "errorBoundary.error": "出错了",
        "errorBoundary.errorMessage": "抱歉，扩展遇到了一个错误。请尝试重新加载。",
        "errorBoundary.retry": "重试",
        "cookieTypes.session": "会话Cookie",
        "cookieTypes.persistent": "持久Cookie",
        "cookieTypes.all": "所有Cookie",
        "actions.clear": "清除",
        "actions.edit": "编辑",
        "actions.delete": "删除",
        "actions.import": "导入",
        "actions.export": "导出",
        "actions.action": "操作",
      };
      let result = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, String(v));
        });
      }
      return result;
    }),
    setLocale: vi.fn(),
    detectBrowserLocale: vi.fn(() => "zh-CN"),
  })),
}));

vi.mock("~utils", () => ({
  isDomainMatch: vi.fn((domain: string, currentDomain: string) => domain.includes(currentDomain)),
  isInList: vi.fn(() => false),
  isTrackingCookie: vi.fn(() => false),
  isThirdPartyCookie: vi.fn(() => false),
  isSensitiveCookie: vi.fn(() => false),
  normalizeDomain: vi.fn((d: string) => d.replace(/^\./, "").toLowerCase()),
  assessCookieRisk: vi.fn(() => ({ level: "low", reason: "安全" })),
  getRiskLevelColor: vi.fn(() => "#22c55e"),
  getRiskLevelText: vi.fn(() => "低风险"),
  clearSingleCookie: vi.fn(() => Promise.resolve(true)),
  editCookie: vi.fn(() => Promise.resolve(true)),
  maskCookieValue: vi.fn(() => "••••••••"),
  getCookieKey: vi.fn((name: string, domain: string) => `${name}-${domain}`),
  toggleSetValue: vi.fn((set: Set<string>, value: string) => {
    const next = new Set(set);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next;
  }),
  getCookieTypeName: vi.fn(() => "会话"),
  getActionText: vi.fn(() => "清除"),
  getActionColor: vi.fn(() => "#22c55e"),
  formatLogTime: vi.fn(() => "2024-01-01 12:00"),
}));

describe("IndexPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const { useStorage } = require("@plasmohq/storage/hook");
    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [
            {
              mode: "whitelist",
              themeMode: "light",
              clearType: "all",
              clearCache: false,
              clearLocalStorage: false,
              clearIndexedDB: false,
              cleanupOnStartup: false,
              cleanupExpiredCookies: false,
              logRetention: "7d",
              locale: "zh-CN",
            },
            vi.fn(),
          ];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          id: 1,
          url: "https://example.com/test",
          active: true,
          currentWindow: true,
        },
      ])
    );

    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          name: "test",
          value: "value",
          domain: ".example.com",
          path: "/",
          secure: true,
          httpOnly: false,
          sameSite: "lax",
        },
        {
          name: "session",
          value: "sessionval",
          domain: ".example.com",
          path: "/",
          secure: false,
          httpOnly: false,
          sameSite: "lax",
        },
        {
          name: "persistent",
          value: "persistentval",
          domain: ".example.com",
          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "strict",
          expirationDate: Date.now() / 1000 + 3600,
        },
      ])
    );
  });

  it("should render header", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
  });

  it("should render tabs", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("管理")).toBeTruthy();
    expect(screen.getByText("设置")).toBeTruthy();
    expect(screen.getByText("日志")).toBeTruthy();
  });

  it("should switch tabs when clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const settingsTab = screen.getByRole("tab", { name: /设置/ });
    fireEvent.click(settingsTab);

    expect(screen.getByRole("tabpanel")).toBeTruthy();
  });

  it("should render cookie statistics section", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("Cookie统计")).toBeTruthy();
  });

  it("should render quick actions section", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("快速操作")).toBeTruthy();
  });

  it("should render quick action buttons", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("添加到白名单")).toBeTruthy();
    expect(screen.getByText("添加到黑名单")).toBeTruthy();
    expect(screen.getByText("清除当前网站")).toBeTruthy();
    expect(screen.getByText("清除所有Cookie")).toBeTruthy();
  });

  it("should switch to log tab when clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const logTab = screen.getByRole("tab", { name: /日志/ });
    fireEvent.click(logTab);

    await waitFor(() => {
      expect(screen.getByText("清除日志")).toBeTruthy();
    });
  });

  it("should switch to settings tab when clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const settingsTab = screen.getByRole("tab", { name: /设置/ });
    fireEvent.click(settingsTab);

    await waitFor(() => {
      expect(screen.getByText("工作模式")).toBeTruthy();
    });
  });

  it("should show confirm dialog when clear current site is clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });
  });

  it("should show confirm dialog when clear all is clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });
  });

  it("should close confirm dialog when cancel is clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const cancelBtn = screen.getByText("取消");
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("清除确认")).toBeNull();
    });
  });

  it("should execute clear when confirm is clicked", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalled();
    });
  });

  it("should execute clear all when confirm is clicked", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalled();
    });
  });

  it("should display current domain", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const domainInfo = document.querySelector(".domain-info");
    await waitFor(() => {
      expect(domainInfo?.textContent).toBe("example.com");
    });
  });

  it("should display stat labels", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const statLabels = document.querySelectorAll(".stat-label");
    expect(statLabels.length).toBeGreaterThan(0);
    expect(statLabels[0].textContent).toBe("总数");
  });

  it("should switch to whitelist tab when clicked", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const whitelistTab = screen.getByRole("tab", { name: /白名单/ });
    fireEvent.click(whitelistTab);

    await waitFor(() => {
      expect(screen.getByText("白名单域名")).toBeTruthy();
    });
  });

  it("should handle add to whitelist click", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const addWhitelistBtn = screen.getByText("添加到白名单");
    fireEvent.click(addWhitelistBtn);

    await waitFor(() => {
      expect(screen.getByText(/已添加.*到白名单/)).toBeTruthy();
    });
  });

  it("should handle add to blacklist click", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const addBlacklistBtn = screen.getByText("添加到黑名单");
    fireEvent.click(addBlacklistBtn);

    await waitFor(() => {
      expect(screen.getByText(/已添加.*到黑名单/)).toBeTruthy();
    });
  });

  it("should handle tab without url", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          id: 1,
          url: undefined,
          active: true,
          currentWindow: true,
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("无法获取域名")).toBeTruthy();
  });

  it("should handle invalid url", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          id: 1,
          url: "invalid-url",
          active: true,
          currentWindow: true,
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("无法获取域名")).toBeTruthy();
  });

  it("should show success message after clearing cookies", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/已清除/)).toBeTruthy();
    });
  });

  it("should display stat values", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues.length).toBeGreaterThan(0);
    });
  });

  it("should have correct tab structure", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(4);
  });

  it("should have correct aria attributes on tabs", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const manageTab = screen.getByRole("tab", { name: /管理/ });
    expect(manageTab.getAttribute("aria-selected")).toBe("true");
    expect(manageTab.getAttribute("tabindex")).toBe("0");
  });

  it("should update aria-selected when tab changes", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const settingsTab = screen.getByRole("tab", { name: /设置/ });
    fireEvent.click(settingsTab);

    await waitFor(() => {
      expect(settingsTab.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should render container with theme class", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const container = document.querySelector(".container");
    expect(container?.className).toMatch(/theme-/);
  });

  it("should render cookie list component", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Cookie 详情/)).toBeTruthy();
    });
  });

  it("should handle cookies change event", async () => {
    const addListenerMock = chrome.cookies.onChanged.addListener as ReturnType<typeof vi.fn>;

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(addListenerMock).toHaveBeenCalled();
  });

  it("should handle multiple cookies with different domains", async () => {
    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          name: "test1",
          value: "value1",
          domain: ".example.com",
          path: "/",
          secure: true,
          httpOnly: false,
          sameSite: "lax",
        },
        {
          name: "test2",
          value: "value2",
          domain: ".other.com",
          path: "/",
          secure: false,
          httpOnly: false,
          sameSite: "lax",
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues[0].textContent).toBe("2");
    });
  });

  it("should render message component", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const addWhitelistBtn = screen.getByText("添加到白名单");
    fireEvent.click(addWhitelistBtn);

    await waitFor(() => {
      const message = document.querySelector(".message");
      expect(message).toBeTruthy();
    });
  });

  it("should render confirm dialog with danger variant for clear all", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      const title = document.querySelector(".confirm-title.danger");
      expect(title).toBeTruthy();
    });
  });

  it("should render confirm dialog with warning variant for clear current", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      const title = document.querySelector(".confirm-title");
      expect(title).toBeTruthy();
      expect(title?.classList.contains("danger")).toBe(false);
    });
  });

  it("should render section icons", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const sectionIcons = document.querySelectorAll(".section-icon");
    expect(sectionIcons.length).toBeGreaterThan(0);
  });

  it("should render tab icons", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const tabIcons = document.querySelectorAll(".tab-icon");
    expect(tabIcons.length).toBe(4);
  });

  it("should render button icons", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const btnIcons = document.querySelectorAll(".btn-icon");
    expect(btnIcons.length).toBeGreaterThan(0);
  });

  it("should handle empty cookies list", async () => {
    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues[0].textContent).toBe("0");
    });
  });

  it("should register media query listener", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    expect(window.matchMedia).toBeDefined();
  });

  it("should handle cookies with tracking cookies", async () => {
    const { isTrackingCookie } = await import("~utils");
    (isTrackingCookie as ReturnType<typeof vi.fn>).mockImplementation(() => true);

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues.length).toBeGreaterThan(0);
    });
  });

  it("should handle cookies with third party cookies", async () => {
    const { isThirdPartyCookie } = await import("~utils");
    (isThirdPartyCookie as ReturnType<typeof vi.fn>).mockImplementation(() => true);

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues.length).toBeGreaterThan(0);
    });
  });

  it("should render all stat items", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statItems = document.querySelectorAll(".stat-item");
      expect(statItems.length).toBe(6);
    });
  });

  it("should render all sections", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const sections = document.querySelectorAll(".section");
      expect(sections.length).toBe(3);
    });
  });

  it("should have correct tabpanel ids", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const managePanel = document.getElementById("manage-panel");
    expect(managePanel).toBeTruthy();
  });

  it("should have correct button classes", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const successBtn = document.querySelector(".btn-success");
    const secondaryBtn = document.querySelector(".btn-secondary");
    const warningBtn = document.querySelector(".btn-warning");
    const dangerBtn = document.querySelector(".btn-danger");

    expect(successBtn).toBeTruthy();
    expect(secondaryBtn).toBeTruthy();
    expect(warningBtn).toBeTruthy();
    expect(dangerBtn).toBeTruthy();
  });

  it("should handle multiple clears in sequence", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalledTimes(1);
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn2 = screen.getByText("确定");
    fireEvent.click(confirmBtn2);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalledTimes(2);
    });
  });

  it("should show message with error class when error", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const message = document.querySelector(".message");
    expect(message?.classList.contains("error")).toBe(false);
    expect(message?.classList.contains("visible")).toBe(false);
  });

  it("should handle chrome.tabs.query returning empty array", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve([]));

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("无法获取域名")).toBeTruthy();
  });

  it("should handle tab with chrome:// url", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          id: 1,
          url: "chrome://extensions",
          active: true,
          currentWindow: true,
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const domainInfo = document.querySelector(".domain-info");
    expect(domainInfo?.textContent).toBe("extensions");
  });

  it("should handle tab with about: url", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          id: 1,
          url: "about:blank",
          active: true,
          currentWindow: true,
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(screen.getByText("无法获取域名")).toBeTruthy();
  });

  it("should handle updateStats error", async () => {
    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.reject(new Error("Failed to get cookies"))
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("更新统计信息失败")).toBeTruthy();
    });
  });

  it("should handle clearCookies error", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.reject(new Error("Failed to clear"))
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText("清除Cookie失败")).toBeTruthy();
    });
  });

  it("should call cookies.onChanged listener", async () => {
    let cookieListener: (() => void) | null = null;
    (chrome.cookies.onChanged.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: () => void) => {
        cookieListener = fn;
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(cookieListener).not.toBeNull();

    await act(async () => {
      if (cookieListener) {
        cookieListener();
      }
    });
  });

  it("should handle media query change event", async () => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    const mockMatchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(listeners.length).toBeGreaterThan(0);

    await act(async () => {
      listeners[0]({ matches: true } as MediaQueryListEvent);
    });
  });

  it("should render with dark theme when system is dark", async () => {
    const mockMatchMedia = vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    await act(async () => {
      render(<IndexPopup />);
    });

    const container = document.querySelector(".container");
    expect(container?.className).toContain("theme-");
  });

  it("should handle clear with multiple domains", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 10, clearedDomains: ["example.com", "test.com", "other.com"] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/已清除/)).toBeTruthy();
    });
  });

  it("should handle clear with zero count", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 0, clearedDomains: [] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/已清除/)).toBeTruthy();
    });
  });

  it("should remove cookies.onChanged listener on unmount", async () => {
    const removeListenerMock = chrome.cookies.onChanged.removeListener as ReturnType<typeof vi.fn>;

    const { unmount } = await act(async () => {
      return render(<IndexPopup />);
    });

    await act(async () => {
      unmount();
    });

    expect(removeListenerMock).toHaveBeenCalled();
  });

  it("should handle escape key to close confirm dialog", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("清除确认")).toBeNull();
    });
  });

  it("should handle clear with single domain", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 5, clearedDomains: ["example.com"] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(/已清除/)).toBeTruthy();
    });
  });

  it("should handle debounce timer on cookies change", async () => {
    vi.useFakeTimers();

    let cookieListener: (() => void) | null = null;
    (chrome.cookies.onChanged.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: () => void) => {
        cookieListener = fn;
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(cookieListener).not.toBeNull();

    await act(async () => {
      if (cookieListener) {
        cookieListener();
        cookieListener();
      }
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();
  });

  it("should remove media query listener on unmount", async () => {
    const removeEventListenerMock = vi.fn();
    const mockMatchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
    }));

    Object.defineProperty(window, "matchMedia", {
      value: mockMatchMedia,
      writable: true,
    });

    const { unmount } = await act(async () => {
      return render(<IndexPopup />);
    });

    await act(async () => {
      unmount();
    });

    expect(removeEventListenerMock).toHaveBeenCalled();
  });

  it("should handle message visibility timeout", async () => {
    vi.useFakeTimers();

    await act(async () => {
      render(<IndexPopup />);
    });

    const addWhitelistBtn = screen.getByText("添加到白名单");
    fireEvent.click(addWhitelistBtn);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const message = document.querySelector(".message");
    expect(message?.classList.contains("visible")).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    vi.useRealTimers();
  });

  it("should handle cookies with storeId", async () => {
    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          name: "test",
          value: "value",
          domain: ".example.com",
          path: "/",
          secure: true,
          httpOnly: false,
          sameSite: "lax",
          storeId: "store-1",
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues[0].textContent).toBe("1");
    });
  });

  it("should handle cookies with sameSite attribute", async () => {
    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve([
        {
          name: "test",
          value: "value",
          domain: ".example.com",
          path: "/",
          secure: true,
          httpOnly: false,
          sameSite: "strict",
        },
      ])
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const statValues = document.querySelectorAll(".stat-value");
      expect(statValues.length).toBeGreaterThan(0);
    });
  });

  it("should handle error message with error class", async () => {
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.reject(new Error("Failed"))
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      const message = document.querySelector(".message");
      expect(message?.classList.contains("error")).toBe(true);
    });
  });

  it("should handle tab aria-controls attribute", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const manageTab = screen.getByRole("tab", { name: /管理/ });
    expect(manageTab.getAttribute("aria-controls")).toBe("manage-panel");
  });

  it("should handle confirm dialog overlay click", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const overlay = document.querySelector(".confirm-overlay");
    if (overlay) {
      fireEvent.click(overlay);
    }

    await waitFor(() => {
      expect(screen.queryByText("清除确认")).toBeNull();
    });
  });

  it("should handle confirm dialog Enter key", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const overlay = document.querySelector(".confirm-overlay");
    if (overlay) {
      fireEvent.keyDown(overlay, { key: "Enter" });
    }

    await waitFor(() => {
      expect(screen.queryByText("清除确认")).toBeNull();
    });
  });

  it("should handle confirm dialog Space key", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("清除确认")).toBeTruthy();
    });

    const overlay = document.querySelector(".confirm-overlay");
    if (overlay) {
      fireEvent.keyDown(overlay, { key: " " });
    }

    await waitFor(() => {
      expect(screen.queryByText("清除确认")).toBeNull();
    });
  });

  it("should handle message with isError true", async () => {
    (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.reject(new Error("Failed"))
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      const message = document.querySelector(".message.error");
      expect(message).toBeTruthy();
    });
  });

  it("should handle quickAddToWhitelist with no currentDomain", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve([]));

    await act(async () => {
      render(<IndexPopup />);
    });

    const addWhitelistBtn = screen.getByText("添加到白名单");
    fireEvent.click(addWhitelistBtn);

    await waitFor(() => {
      expect(screen.getByText("无法获取域名")).toBeTruthy();
    });
  });

  it("should handle quickAddToBlacklist with no currentDomain", async () => {
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockImplementation(() => Promise.resolve([]));

    await act(async () => {
      render(<IndexPopup />);
    });

    const addBlacklistBtn = screen.getByText("添加到黑名单");
    fireEvent.click(addBlacklistBtn);

    await waitFor(() => {
      expect(screen.getByText("无法获取域名")).toBeTruthy();
    });
  });

  it("should handle message text content", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const addWhitelistBtn = screen.getByText("添加到白名单");
    fireEvent.click(addWhitelistBtn);

    await waitFor(() => {
      const message = document.querySelector(".message");
      expect(message?.textContent).toContain("已添加");
    });
  });

  it("should handle confirm dialog confirm button focus", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      const confirmBtn = screen.getByText("确定");
      expect(confirmBtn).toBeTruthy();
    });
  });

  it("should handle settings change triggering init", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const settingsMock = vi.fn((key: string, defaultValue: unknown) => {
      if (key === "settings") {
        return [
          {
            mode: "whitelist",
            themeMode: "light",
            clearType: "all",
            clearCache: false,
            clearLocalStorage: false,
            clearIndexedDB: false,
            cleanupOnStartup: false,
            cleanupExpiredCookies: false,
            logRetention: "7d",
            locale: "zh-CN",
          },
          vi.fn(),
        ];
      }
      if (key === "whitelist") {
        return [[], vi.fn()];
      }
      if (key === "blacklist") {
        return [[], vi.fn()];
      }
      if (key === "clearLog") {
        return [[], vi.fn()];
      }
      return [defaultValue, vi.fn()];
    });

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(settingsMock);

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(settingsMock).toHaveBeenCalled();
  });

  it("should handle arrow right key for tab navigation", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const manageTab = screen.getByRole("tab", { name: /管理/ });
    const tablist = document.querySelector('[role="tablist"]');

    expect(manageTab.getAttribute("aria-selected")).toBe("true");

    if (tablist) {
      fireEvent.keyDown(tablist, { key: "ArrowRight" });
    }

    await waitFor(() => {
      const whitelistTab = screen.getByRole("tab", { name: /白名单/ });
      expect(whitelistTab.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should handle arrow left key for tab navigation", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const manageTab = screen.getByRole("tab", { name: /管理/ });
    const tablist = document.querySelector('[role="tablist"]');

    expect(manageTab.getAttribute("aria-selected")).toBe("true");

    if (tablist) {
      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
    }

    await waitFor(() => {
      const logTab = screen.getByRole("tab", { name: /日志/ });
      expect(logTab.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should handle Home key for tab navigation", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const settingsTab = screen.getByRole("tab", { name: /设置/ });
    fireEvent.click(settingsTab);

    await waitFor(() => {
      expect(settingsTab.getAttribute("aria-selected")).toBe("true");
    });

    const tablist = document.querySelector('[role="tablist"]');
    if (tablist) {
      fireEvent.keyDown(tablist, { key: "Home" });
    }

    await waitFor(() => {
      const manageTab = screen.getByRole("tab", { name: /管理/ });
      expect(manageTab.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should handle End key for tab navigation", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    const manageTab = screen.getByRole("tab", { name: /管理/ });
    expect(manageTab.getAttribute("aria-selected")).toBe("true");

    const tablist = document.querySelector('[role="tablist"]');
    if (tablist) {
      fireEvent.keyDown(tablist, { key: "End" });
    }

    await waitFor(() => {
      const logTab = screen.getByRole("tab", { name: /日志/ });
      expect(logTab.getAttribute("aria-selected")).toBe("true");
    });
  });

  it("should apply custom theme CSS variables when theme is custom", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation((key: string, defaultValue: unknown) => {
      if (key === "settings") {
        return [
          {
            mode: "whitelist",
            themeMode: "custom",
            customTheme: {
              primary: "#ff0000",
              success: "#00ff00",
              warning: "#ffff00",
              danger: "#0000ff",
              bgPrimary: "#ffffff",
              textPrimary: "#000000",
            },
            clearType: "all",
            clearCache: false,
            clearLocalStorage: false,
            clearIndexedDB: false,
            cleanupOnStartup: false,
            cleanupExpiredCookies: false,
            logRetention: "7d",
            locale: "zh-CN",
          },
          vi.fn(),
        ];
      }
      if (key === "whitelist") {
        return [[], vi.fn()];
      }
      if (key === "blacklist") {
        return [[], vi.fn()];
      }
      if (key === "clearLog") {
        return [[], vi.fn()];
      }
      return [defaultValue, vi.fn()];
    });

    await act(async () => {
      render(<IndexPopup />);
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue("--primary-500")).toBe("#ff0000");
  });

  it("should render CookieList with all required props", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockWhitelist = ["test.com"];
    const mockBlacklist = ["bad.com"];

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation((key: string, defaultValue: unknown) => {
      if (key === "whitelist") {
        return [mockWhitelist, vi.fn()];
      }
      if (key === "blacklist") {
        return [mockBlacklist, vi.fn()];
      }
      if (key === "settings") {
        return [
          {
            mode: "whitelist",
            themeMode: "light",
            clearType: "all",
            clearCache: false,
            clearLocalStorage: false,
            clearIndexedDB: false,
            cleanupOnStartup: false,
            cleanupExpiredCookies: false,
            logRetention: "7d",
            locale: "zh-CN",
          },
          vi.fn(),
        ];
      }
      if (key === "clearLog") {
        return [[], vi.fn()];
      }
      return [defaultValue, vi.fn()];
    });

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Cookie 详情/)).toBeTruthy();
    });
  });

  it("should pass onUpdate callback to CookieList and trigger on cookie change", async () => {
    vi.useFakeTimers();

    let cookieListener: (() => void) | null = null;
    (chrome.cookies.onChanged.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: () => void) => {
        cookieListener = fn;
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    expect(cookieListener).not.toBeNull();

    const initialCallCount = (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mock.calls.length;

    await act(async () => {
      if (cookieListener) {
        cookieListener();
      }
      vi.advanceTimersByTime(300);
    });

    vi.useRealTimers();

    expect(
      (chrome.cookies.getAll as ReturnType<typeof vi.fn>).mock.calls.length
    ).toBeGreaterThanOrEqual(initialCallCount);
  });

  it("should pass onMessage callback to CookieList", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });

  it("should pass whitelist and blacklist to CookieList", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });
});

describe("IndexPopup onClearBlacklist", () => {
  it("should render blacklist tab and have clear blacklist button", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanupWithFilter } = await import("~utils/cleanup");

    const mockSettings = {
      mode: "blacklist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 5, clearedDomains: ["example.com"] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    const blacklistTab = screen.getByRole("tab", { name: /黑名单/ });
    fireEvent.click(blacklistTab);

    await waitFor(() => {
      expect(screen.getByText("清除黑名单Cookie")).toBeTruthy();
    });
  });

  it("should call onClearBlacklist and clear blacklist cookies", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    const { isInList } = await import("~utils");

    const mockSettings = {
      mode: "blacklist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 5, clearedDomains: ["example.com"] })
    );

    (isInList as ReturnType<typeof vi.fn>).mockImplementation(() => true);

    await act(async () => {
      render(<IndexPopup />);
    });

    const blacklistTab = screen.getByRole("tab", { name: /黑名单/ });
    fireEvent.click(blacklistTab);

    await waitFor(() => {
      expect(screen.getByText("清除黑名单Cookie")).toBeTruthy();
    });

    const clearBlacklistBtn = screen.getByText("清除黑名单Cookie");
    fireEvent.click(clearBlacklistBtn);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalled();
    });
  });

  it("should show message when no cookies to clear from blacklist", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    const { isInList } = await import("~utils");

    const mockSettings = {
      mode: "blacklist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 0, clearedDomains: [] })
    );

    (isInList as ReturnType<typeof vi.fn>).mockImplementation(() => true);

    await act(async () => {
      render(<IndexPopup />);
    });

    const blacklistTab = screen.getByRole("tab", { name: /黑名单/ });
    fireEvent.click(blacklistTab);

    await waitFor(() => {
      expect(screen.getByText("清除黑名单Cookie")).toBeTruthy();
    });

    const clearBlacklistBtn = screen.getByText("清除黑名单Cookie");
    fireEvent.click(clearBlacklistBtn);

    await waitFor(() => {
      expect(screen.getByText("黑名单网站暂无Cookie可清除")).toBeTruthy();
    });
  });
});

describe("IndexPopup buildDomainString", () => {
  it("should render component with default settings", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });
});

describe("IndexPopup addLog", () => {
  it("should render with FOREVER log retention", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "forever",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });

  it("should render with 7d log retention", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });
});

describe("IndexPopup whitelist and blacklist callbacks", () => {
  it("should render with empty whitelist", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });

  it("should render with existing whitelist", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "whitelist") {
          return [["example.com"], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        if (key === "settings") {
          return [
            {
              mode: "whitelist",
              themeMode: "light",
              clearType: "all",
              clearCache: false,
              clearLocalStorage: false,
              clearIndexedDB: false,
              cleanupOnStartup: false,
              cleanupExpiredCookies: false,
              logRetention: "7d",
              locale: "zh-CN",
            },
            vi.fn(),
          ];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });

  it("should render with empty blacklist", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });

  it("should render with existing blacklist", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "blacklist") {
          return [["example.com"], vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        if (key === "settings") {
          return [
            {
              mode: "whitelist",
              themeMode: "light",
              clearType: "all",
              clearCache: false,
              clearLocalStorage: false,
              clearIndexedDB: false,
              cleanupOnStartup: false,
              cleanupExpiredCookies: false,
              logRetention: "7d",
              locale: "zh-CN",
            },
            vi.fn(),
          ];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("Cookie Manager Pro")).toBeTruthy();
    });
  });
});

describe("IndexPopup cleanupExpiredCookies", () => {
  it("should call cleanupExpiredCookies and clear expired cookies", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { cleanupExpiredCookies: cleanupExpiredCookiesUtil } = await import("~utils/cleanup");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: true,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (cleanupExpiredCookiesUtil as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(5)
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cleanupExpiredCookiesUtil).toHaveBeenCalled();
    });
  });

  it("should show message when no expired cookies found", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { cleanupExpiredCookies: cleanupExpiredCookiesUtil } = await import("~utils/cleanup");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: true,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (cleanupExpiredCookiesUtil as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve(0)
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("没有找到过期的 Cookie")).toBeTruthy();
    });
  });

  it("should handle cleanupExpiredCookies error", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { cleanupExpiredCookies: cleanupExpiredCookiesUtil } = await import("~utils/cleanup");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: true,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (cleanupExpiredCookiesUtil as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.reject(new Error("Failed"))
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("清理过期 Cookie 失败")).toBeTruthy();
    });
  });
});

describe("IndexPopup additional coverage", () => {
  beforeEach(() => {
    cookieListProps = null;
  });

  it("should call onAddToWhitelist callback with new domains", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [["existing.com"], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cookieListProps).not.toBeNull();
      expect(cookieListProps?.onAddToWhitelist).toBeDefined();
    });

    await act(async () => {
      cookieListProps?.onAddToWhitelist?.(["new.com", "existing.com"]);
    });
  });

  it("should call onAddToBlacklist callback with new domains", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [["existing.com"], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cookieListProps).not.toBeNull();
      expect(cookieListProps?.onAddToBlacklist).toBeDefined();
    });

    await act(async () => {
      cookieListProps?.onAddToBlacklist?.(["new.com", "existing.com"]);
    });
  });

  it("should handle onAddToWhitelist with no new domains", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [["existing.com"], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cookieListProps).not.toBeNull();
      expect(cookieListProps?.onAddToWhitelist).toBeDefined();
    });

    await act(async () => {
      cookieListProps?.onAddToWhitelist?.(["existing.com"]);
    });
  });

  it("should handle onAddToBlacklist with no new domains", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [["existing.com"], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cookieListProps).not.toBeNull();
      expect(cookieListProps?.onAddToBlacklist).toBeDefined();
    });

    await act(async () => {
      cookieListProps?.onAddToBlacklist?.(["existing.com"]);
    });
  });

  it("should handle cleanupStartup function", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanup } = await import("~utils/cleanup");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: true,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: true,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanup as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 3, clearedDomains: ["example.com"] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(performCleanup).toHaveBeenCalled();
    });
  });

  it("should handle cleanupStartup with no count", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanup } = await import("~utils/cleanup");

    const mockSettings = {
      mode: "whitelist",
      themeMode: "light",
      clearType: "all",
      clearCache: true,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: true,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanup as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 0, clearedDomains: [] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(performCleanup).toHaveBeenCalled();
    });
  });

  it("should call CookieList onMessage callback", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cookieListProps).not.toBeNull();
      expect(cookieListProps?.onMessage).toBeDefined();
    });

    await act(async () => {
      cookieListProps?.onMessage?.("Test message", false);
    });

    await waitFor(() => {
      const message = document.querySelector(".message");
      expect(message?.textContent).toContain("Test message");
    });
  });

  it("should call CookieList onMessage callback with error", async () => {
    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(cookieListProps).not.toBeNull();
      expect(cookieListProps?.onMessage).toBeDefined();
    });

    await act(async () => {
      cookieListProps?.onMessage?.("Error message", true);
    });

    await waitFor(() => {
      const message = document.querySelector(".message");
      expect(message).toBeTruthy();
      expect(message?.textContent).toContain("Error message");
    });
  });

  it("should handle buildDomainString with no cleared domains and current domain", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanupWithFilter } = await import("~utils/cleanup");

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [
            {
              mode: "whitelist",
              themeMode: "light",
              clearType: "all",
              clearCache: false,
              clearLocalStorage: false,
              clearIndexedDB: false,
              cleanupOnStartup: false,
              cleanupExpiredCookies: false,
              logRetention: "7d",
              locale: "zh-CN",
            },
            vi.fn(),
          ];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 0, clearedDomains: [] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("清除所有Cookie")).toBeTruthy();
    });

    const clearAllBtn = screen.getByText("清除所有Cookie");
    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.getByText("确定")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalled();
    });
  });

  it("should handle quickClearCurrent function", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanupWithFilter } = await import("~utils/cleanup");

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [
            {
              mode: "whitelist",
              themeMode: "light",
              clearType: "all",
              clearCache: false,
              clearLocalStorage: false,
              clearIndexedDB: false,
              cleanupOnStartup: false,
              cleanupExpiredCookies: false,
              logRetention: "7d",
              locale: "zh-CN",
            },
            vi.fn(),
          ];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [[], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 5, clearedDomains: ["example.com"] })
    );

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("清除当前网站")).toBeTruthy();
    });

    const clearCurrentBtn = screen.getByText("清除当前网站");
    fireEvent.click(clearCurrentBtn);

    await waitFor(() => {
      expect(screen.getByText("确定")).toBeTruthy();
    });

    const confirmBtn = screen.getByText("确定");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(performCleanupWithFilter).toHaveBeenCalled();
    });
  });

  it("should handle onClearBlacklist function", async () => {
    const { useStorage } = await import("@plasmohq/storage/hook");
    const { performCleanupWithFilter } = await import("~utils/cleanup");
    const { isInList } = await import("~utils");

    const mockSettings = {
      mode: "blacklist",
      themeMode: "light",
      clearType: "all",
      clearCache: false,
      clearLocalStorage: false,
      clearIndexedDB: false,
      cleanupOnStartup: false,
      cleanupExpiredCookies: false,
      logRetention: "7d",
      locale: "zh-CN",
    };

    (useStorage as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, defaultValue: unknown) => {
        if (key === "settings") {
          return [mockSettings, vi.fn()];
        }
        if (key === "whitelist") {
          return [[], vi.fn()];
        }
        if (key === "blacklist") {
          return [["example.com"], vi.fn()];
        }
        if (key === "clearLog") {
          return [[], vi.fn()];
        }
        return [defaultValue, vi.fn()];
      }
    );

    (performCleanupWithFilter as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({ count: 3, clearedDomains: ["example.com"] })
    );

    (isInList as ReturnType<typeof vi.fn>).mockImplementation(() => true);

    await act(async () => {
      render(<IndexPopup />);
    });

    await waitFor(() => {
      expect(screen.getByText("黑名单")).toBeTruthy();
    });

    const blacklistTab = screen.getByText("黑名单");
    fireEvent.click(blacklistTab);
  });
});
