import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DomainManager } from "../../components/DomainManager";

vi.mock("~hooks/useTranslation", () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string, params?: Record<string, string | number>) => {
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
        "tabs.whitelist": "白名单",
        "tabs.blacklist": "黑名单",
        "domainManager.whitelistDomains": "白名单域名",
        "domainManager.blacklistDomains": "黑名单域名",
        "domainManager.whitelistHelp": "白名单中的域名Cookie不会被清除",
        "domainManager.blacklistHelp": "黑名单中的域名Cookie将被优先清除",
        "domainManager.domainPlaceholder": "例如: google.com",
        "domainManager.addCurrentWebsite": "添加当前网站",
        "domainManager.clearBlacklistCookies": "清除黑名单Cookie",
        "domainManager.domainEmpty": "域名不能为空",
        "domainManager.invalidDomain": "域名格式不正确",
        "domainManager.deleted": "已删除",
      };
      return translations[key] || key;
    }),
    setLocale: vi.fn(),
    detectBrowserLocale: vi.fn(() => "zh-CN"),
  })),
}));

describe("DomainManager", () => {
  const mockOnMessage = vi.fn();
  const mockOnClearBlacklist = vi.fn();

  beforeEach(() => {
    mockOnMessage.mockClear();
    mockOnClearBlacklist.mockClear();
  });

  it("should render whitelist manager", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    expect(screen.getByText("白名单域名")).toBeTruthy();
    expect(screen.getByText("白名单中的域名Cookie不会被清除")).toBeTruthy();
  });

  it("should render blacklist manager", () => {
    render(
      <DomainManager type="blacklist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    expect(screen.getByText("黑名单域名")).toBeTruthy();
    expect(screen.getByText("黑名单中的域名Cookie将被优先清除")).toBeTruthy();
  });

  it("should update input value when typing", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test.com" } });

    expect(input.value).toBe("test.com");
  });

  it("should show error for empty domain", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("域名不能为空");
  });

  it("should show error for invalid domain", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "invalid_domain" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("域名格式不正确");
  });

  it("should add current domain when button is clicked", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const addButton = screen.getByText("添加当前网站");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已添加到白名单");
  });

  it("should disable add current domain button when no current domain", () => {
    render(<DomainManager type="whitelist" currentDomain="" onMessage={mockOnMessage} />);

    const addButton = screen.getByText("添加当前网站") as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);
  });

  it("should show clear blacklist button for blacklist type", () => {
    render(
      <DomainManager
        type="blacklist"
        currentDomain="example.com"
        onMessage={mockOnMessage}
        onClearBlacklist={mockOnClearBlacklist}
      />
    );

    const clearButton = screen.getByText("清除黑名单Cookie");
    expect(clearButton).toBeTruthy();

    fireEvent.click(clearButton);
    expect(mockOnClearBlacklist).toHaveBeenCalledOnce();
  });

  it("should not show clear blacklist button for whitelist type", () => {
    render(
      <DomainManager
        type="whitelist"
        currentDomain="example.com"
        onMessage={mockOnMessage}
        onClearBlacklist={mockOnClearBlacklist}
      />
    );

    expect(screen.queryByText("清除黑名单Cookie")).toBeNull();
  });

  it("should add valid domain to list", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "test.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已添加到白名单");
  });

  it("should add domain to blacklist with correct message", () => {
    render(
      <DomainManager type="blacklist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const addButton = screen.getByText("添加当前网站");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已添加到黑名单");
  });
});
