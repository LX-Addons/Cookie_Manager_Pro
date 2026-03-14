import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock WXT defineBackground global function (WXT already declares the type)
// @ts-expect-error - WXT provides the type definition
globalThis.defineBackground = (fn: () => void) => {
  fn();
  return fn;
};

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, params?: Record<string, string | number>) => {
      let text = key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    locale: "zh-CN",
    setLocale: vi.fn(),
  })),
}));

afterEach(() => {
  cleanup();
});

class MockStorage {
  private data = new Map<string, unknown>();

  get(key: string): unknown {
    return this.data.get(key);
  }

  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }
}

// 使用工厂函数创建 mock，确保在模块加载时正确初始化
vi.mock("wxt/utils/storage", () => {
  const mockStorageData = new Map<string, unknown>();
  return {
    Storage: MockStorage,
    storage: {
      getItem: vi.fn(async (key: string) => mockStorageData.get(key)),
      setItem: vi.fn(async (key: string, value: unknown) => {
        mockStorageData.set(key, value);
      }),
      watch: vi.fn(() => {
        return vi.fn();
      }),
    },
  };
});

// Mock Chrome API
global.chrome = {
  cookies: {
    getAll: vi.fn(),
    getAllCookieStores: vi.fn(),
    remove: vi.fn(),
    set: vi.fn(),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    onActivated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    onStartup: {
      addListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    getManifest: vi.fn(),
  },
  i18n: {
    getMessage: vi.fn((key: string) => key),
    getUILanguage: vi.fn(() => "zh-CN"),
  },
  browsingData: {
    remove: vi.fn(),
  },
} as unknown as typeof chrome;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
