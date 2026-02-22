import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: vi.fn(() => {
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
      "settings.language": "语言设置",
      "settings.languageDesc": "选择您喜欢的界面语言",
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

    const t = (key: string, params?: Record<string, string | number>) => {
      let result = translations[key] || key;
      if (key === "domainManager.addedToList" && params?.listType === "白名单") {
        return "已添加到白名单";
      }
      if (key === "domainManager.addedToList" && params?.listType === "黑名单") {
        return "已添加到黑名单";
      }
      if (key === "domainManager.alreadyInList" && params?.listType === "白名单") {
        return `${params.domain} 已在白名单中`;
      }
      if (key === "domainManager.alreadyInList" && params?.listType === "黑名单") {
        return `${params.domain} 已在黑名单中`;
      }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          result = result.replace(`{${k}}`, String(v));
        });
      }
      return result;
    };

    return {
      t,
      setLocale: vi.fn(),
      detectBrowserLocale: vi.fn(() => "zh-CN"),
      locale: "zh-CN",
    };
  }),
}));

const mockStorage = new Map<string, unknown>();

class MockStorage {
  async get(key: string) {
    return mockStorage.get(key);
  }
  async set(key: string, value: unknown) {
    mockStorage.set(key, value);
  }
}

vi.mock("wxt/utils/storage", () => ({
  Storage: MockStorage,
  storage: {
    getItem: vi.fn(async (key: string) => mockStorage.get(key)),
    setItem: vi.fn(async (key: string, value: unknown) => {
      mockStorage.set(key, value);
    }),
    watch: vi.fn((key: string, callback: (value: unknown) => void) => {
      return vi.fn();
    }),
  },
}));

vi.mock("@/hooks/useStorage", () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    if (key === "settings") {
      const defaultSettings = defaultValue as Record<string, unknown>;
      return [
        {
          ...defaultSettings,
          locale: "zh-CN",
        },
        vi.fn(),
      ];
    }
    return [defaultValue, vi.fn()];
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockEvent = <T extends (...args: any[]) => any = () => void>() => ({
  addListener: vi.fn<(callback: T) => void>(),
  removeListener: vi.fn<(callback: T) => void>(),
  hasListener: vi.fn<(callback: T) => boolean>(() => false),
  hasListeners: vi.fn<() => boolean>(() => false),
});

global.chrome = {
  cookies: {
    getAll: vi.fn(() => Promise.resolve([])),
    remove: vi.fn(() => Promise.resolve({})),
    set: vi.fn(() => Promise.resolve({})),
    get: vi.fn(),
    getAllCookieStores: vi.fn(),
    onChanged: createMockEvent<(changeInfo: chrome.cookies.CookieChangeInfo) => void>(),
  },
  browsingData: {
    remove: vi.fn(),
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    onUpdated: createMockEvent(),
    onRemoved: createMockEvent(),
    onCreated: createMockEvent(),
    onActivated: createMockEvent(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: createMockEvent(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      onChanged: createMockEvent(),
    },
    onChanged: createMockEvent(),
  },
  runtime: {
    lastError: undefined as chrome.runtime.LastError | undefined,
    onInstalled: createMockEvent(),
    onStartup: createMockEvent(),
    onMessage: createMockEvent(),
    sendMessage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
    getManifest: vi.fn(() => ({ manifest_version: 3, name: "Test", version: "1.0" })),
  },
  alarms: {
    create: vi.fn(),
    get: vi.fn(() => Promise.resolve(undefined)),
    getAll: vi.fn(() => Promise.resolve([])),
    clear: vi.fn(() => Promise.resolve(true)),
    clearAll: vi.fn(() => Promise.resolve(true)),
    onAlarm: createMockEvent(),
  },
} as unknown as typeof chrome;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockStorage.clear();
});
