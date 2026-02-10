import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Mock chrome API for tests
global.chrome = {
  cookies: {
    getAll: vi.fn(),
    remove: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
    getAllCookieStores: vi.fn(),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  browsingData: {
    remove: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
} as unknown as typeof chrome;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
