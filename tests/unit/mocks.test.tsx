import { describe, it, expect } from "vitest";
import { hasDomainInText, createTranslationMock } from "../utils/mocks";

describe("mocks", () => {
  describe("hasDomainInText", () => {
    it("should return false for null textContent", () => {
      expect(hasDomainInText(null, "example.com")).toBe(false);
    });

    it("should return false for undefined textContent", () => {
      expect(hasDomainInText(undefined, "example.com")).toBe(false);
    });

    it("should return false for empty string textContent", () => {
      expect(hasDomainInText("", "example.com")).toBe(false);
    });

    it("should return true when domain is found in text", () => {
      expect(hasDomainInText("🌐 example.com (2)", "example.com")).toBe(true);
    });

    it("should return false when domain is not found in text", () => {
      expect(hasDomainInText("🌐 test.com (2)", "example.com")).toBe(false);
    });

    it("should handle domain with special regex characters", () => {
      expect(hasDomainInText("🌐 test.com (2)", "test.com")).toBe(true);
      expect(hasDomainInText("🌐 example.com (2)", "example.com")).toBe(true);
    });

    it("should not match suffix domains", () => {
      expect(hasDomainInText("🌐 example.com.cn (2)", "example.com")).toBe(false);
    });

    it("should match subdomains", () => {
      expect(hasDomainInText("🌐 sub.example.com (2)", "example.com")).toBe(true);
    });

    it("should not match partial domain names", () => {
      expect(hasDomainInText("🌐 evil.com (2)", "example.com")).toBe(false);
      expect(hasDomainInText("🌐 example.org (2)", "example.com")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(hasDomainInText("🌐 EXAMPLE.COM (2)", "example.com")).toBe(true);
      expect(hasDomainInText("🌐 example.com (2)", "EXAMPLE.COM")).toBe(true);
    });
  });

  describe("createTranslationMock", () => {
    it("should return a mock useTranslation function", () => {
      const mock = createTranslationMock({});
      expect(mock.useTranslation).toBeDefined();
      expect(typeof mock.useTranslation).toBe("function");
    });

    it("should return the translation key when no translation exists", () => {
      const mock = createTranslationMock({});
      const { t } = mock.useTranslation();
      expect(t("missing.key")).toBe("missing.key");
    });

    it("should return the translated text when translation exists", () => {
      const mock = createTranslationMock({
        "test.key": "Hello World",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key")).toBe("Hello World");
    });

    it("should return text without params when no params provided", () => {
      const mock = createTranslationMock({
        "test.key": "Hello {name}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key")).toBe("Hello {name}");
    });

    it("should replace single placeholder with value", () => {
      const mock = createTranslationMock({
        "test.key": "Hello {name}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { name: "World" })).toBe("Hello World");
    });

    it("should replace multiple placeholders with values", () => {
      const mock = createTranslationMock({
        "test.key": "Hello {name}, you have {count} messages",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { name: "Alice", count: 5 })).toBe("Hello Alice, you have 5 messages");
    });

    it("should replace multiple occurrences of the same placeholder", () => {
      const mock = createTranslationMock({
        "test.key": "{name} says hello to {name}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { name: "Bob" })).toBe("Bob says hello to Bob");
    });

    it("should keep placeholder when value is not provided", () => {
      const mock = createTranslationMock({
        "test.key": "Hello {name}, you have {count} messages",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { name: "Alice" })).toBe("Hello Alice, you have {count} messages");
    });

    it("should handle numeric values", () => {
      const mock = createTranslationMock({
        "test.key": "Count: {count}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { count: 123 })).toBe("Count: 123");
    });

    it("should handle string values with special characters", () => {
      const mock = createTranslationMock({
        "test.key": "Message: {msg}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { msg: "Hello! How are you?" })).toBe("Message: Hello! How are you?");
    });

    it("should handle null values by keeping placeholder", () => {
      const mock = createTranslationMock({
        "test.key": "Value: {value}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { value: null })).toBe("Value: {value}");
    });

    it("should handle undefined values by keeping placeholder", () => {
      const mock = createTranslationMock({
        "test.key": "Value: {value}",
      });
      const { t } = mock.useTranslation();
      expect(t("test.key", { value: undefined })).toBe("Value: {value}");
    });
  });
});
