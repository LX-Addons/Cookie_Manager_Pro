import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DomainManager } from "../../components/DomainManager";
import * as storageHook from "wxt/utils/storage";

vi.mock("wxt/utils/storage", () => ({
  useStorage: vi.fn(),
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

  it("should show error when domain already in whitelist", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const addButton = screen.getByText("添加当前网站");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("example.com 已在白名单中");
  });

  it("should show error when domain already in blacklist", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["example.com"],
      mockSetList,
    ]);

    render(
      <DomainManager type="blacklist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    const addButton = screen.getByText("添加当前网站");
    fireEvent.click(addButton);

    expect(mockOnMessage).toHaveBeenCalledWith("example.com 已在黑名单中");
  });

  it("should remove domain from list", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["test.com", "example.com"],
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

  it("should render domain list items", () => {
    (storageHook.useStorage as ReturnType<typeof vi.fn>).mockImplementation(() => [
      ["test.com", "example.com"],
      mockSetList,
    ]);

    render(
      <DomainManager type="whitelist" currentDomain="example.com" onMessage={mockOnMessage} />
    );

    expect(screen.getByText("test.com")).toBeTruthy();
    expect(screen.getByText("example.com")).toBeTruthy();
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
  });
});
