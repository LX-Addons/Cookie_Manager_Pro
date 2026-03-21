import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DomainManager } from "@/components/DomainManager";
import * as storageHook from "@/hooks/useStorage";

vi.mock("@/hooks/useStorage", () => ({
  useStorage: vi.fn(),
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      const translations: Record<string, string> = {
        "domainManager.whitelistDomains": "白名单域名",
        "domainManager.whitelistHelp": "白名单中的域名Cookie不会被清除",
        "domainManager.blacklistDomains": "黑名单域名",
        "domainManager.blacklistHelp": "黑名单中的域名Cookie将被优先清除",
        "domainManager.domainPlaceholder": "例如: google.com",
        "domainManager.addCurrentWebsite": "添加当前网站",
        "domainManager.clearBlacklistCookies": "清除黑名单Cookie",
        "domainManager.addedToWhitelist": "已添加到白名单",
        "domainManager.addedToBlacklist": "已添加到黑名单",
        "domainManager.addedToList": "已添加到列表",
        "domainManager.alreadyInWhitelist": "已在白名单中",
        "domainManager.alreadyInBlacklist": "已在黑名单中",
        "domainManager.alreadyInList": "已在{listType}中",
        "domainManager.invalidDomain": "无效的域名",
        "domainManager.deleted": "已删除",
        "domainManager.ruleCount": "数量: {count}",
        "domainManager.addDomain": "添加域名",
        "domainManager.quickAdd": "快速添加",
        "domainManager.currentDomainInList": "当前域名在列表中",
        "domainManager.currentDomainNotInList": "当前域名不在列表中",
        "domainManager.dangerZone": "危险区域",
        "domainManager.clearBlacklistWarning": "清除黑名单Cookie警告",
        "domainManager.domainList": "域名列表",
        "domainManager.emptyWhitelist": "白名单为空",
        "domainManager.emptyBlacklist": "黑名单为空",
        "domainManager.emptyWhitelistHint": "白名单为空提示",
        "domainManager.emptyBlacklistHint": "黑名单为空提示",
        "domainManager.protectedTag": "保护",
        "domainManager.cleanupTag": "清除",
        "domainManager.removeDomain": "移除{domain}",
        "tabs.whitelist": "白名单",
        "tabs.blacklist": "黑名单",
        "common.add": "添加",
        "common.delete": "删除",
      };
      let text = translations[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
  }),
}));

describe("DomainManager", () => {
  const mockOnMessage = vi.fn();
  const mockOnClearBlacklist = vi.fn();
  const mockSetList = vi.fn();

  beforeEach(() => {
    mockOnMessage.mockClear();
    mockOnClearBlacklist.mockClear();
    mockSetList.mockClear();

    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      [],
      mockSetList,
    ]);
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

  it("should show error for invalid domain", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "invalid_domain" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("无效的域名");
  });

  it("should add current domain when button is clicked", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const buttons = screen.getAllByText("example.com");
    const addButton = buttons.find((btn) => btn.tagName === "BUTTON") as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    fireEvent.click(addButton);

    expect(mockSetList).toHaveBeenCalled();
    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });

  it("should disable add current domain button when no current domain", () => {
    render(<DomainManager type="whitelist" currentDomain="" onMessage={mockOnMessage} />);

    expect(screen.queryByText("example.com")).not.toBeTruthy();
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
  });

  it("should call onClearBlacklist when clear button is clicked", () => {
    render(
      <DomainManager
        type="blacklist"
        currentDomain="example.com"
        onMessage={mockOnMessage}
        onClearBlacklist={mockOnClearBlacklist}
      />
    );

    const clearButton = screen.getByText("清除黑名单Cookie");
    fireEvent.click(clearButton);

    expect(mockOnClearBlacklist).toHaveBeenCalled();
  });

  it("should add valid domain to list", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "test.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockSetList).toHaveBeenCalled();
    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });

  it("should add domain to blacklist with correct message", () => {
    render(
      <DomainManager type="blacklist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const buttons = screen.getAllByText("example.com");
    const addButton = buttons.find((btn) => btn.tagName === "BUTTON") as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    fireEvent.click(addButton);

    expect(mockSetList).toHaveBeenCalled();
    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });

  it("should show error when domain already in whitelist", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const buttons = screen.getAllByText("example.com");
    const addButton = buttons.find((btn) => btn.tagName === "BUTTON") as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    expect(addButton.disabled).toBe(true);
    expect(mockSetList).not.toHaveBeenCalled();
  });

  it("should show error when domain already in blacklist", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(
      <DomainManager type="blacklist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const buttons = screen.getAllByText("example.com");
    const addButton = buttons.find((btn) => btn.tagName === "BUTTON") as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    expect(addButton.disabled).toBe(true);
    expect(mockSetList).not.toHaveBeenCalled();
  });

  it("should remove domain from list", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const removeButtons = screen.getAllByText("删除");
    fireEvent.click(removeButtons[0]);

    expect(mockOnMessage).toHaveBeenCalledWith("已删除");
    expect(mockSetList).toHaveBeenCalled();
  });

  it("should handle add domain with input", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "newdomain.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockSetList).toHaveBeenCalled();
    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });

  it("should show already in list message with list type for whitelist", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(<DomainManager type="whitelist" currentDomain="" onMessage={mockOnMessage} />);

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "example.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已在白名单中");
    expect(mockSetList).not.toHaveBeenCalled();
  });

  it("should show already in list message with list type for blacklist", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(<DomainManager type="blacklist" currentDomain="" onMessage={mockOnMessage} />);

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "example.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已在黑名单中");
    expect(mockSetList).not.toHaveBeenCalled();
  });

  it("should handle add domain via Enter key", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "newdomain.com" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSetList).toHaveBeenCalled();
    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });

  it("should not add domain via Enter key when input is empty", () => {
    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockSetList).not.toHaveBeenCalled();
  });

  it("should show added to list message with list type for whitelist", () => {
    render(<DomainManager type="whitelist" currentDomain="" onMessage={mockOnMessage} />);

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "newdomain.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });

  it("should show added to list message with list type for blacklist", () => {
    render(<DomainManager type="blacklist" currentDomain="" onMessage={mockOnMessage} />);

    const input = screen.getByPlaceholderText("例如: google.com");
    fireEvent.change(input, { target: { value: "newdomain.com" } });

    const addButton = screen.getByText("添加");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("已添加到列表");
  });
});
