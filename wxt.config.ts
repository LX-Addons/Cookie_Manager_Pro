import { defineConfig } from "wxt";

const icons = {
  16: "/icon.png",
  32: "/icon.png",
  48: "/icon.png",
  128: "/icon.png",
};

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    manifest_version: 3,
    name: "Cookie Manager Pro",
    description: "高级 Cookie 管理，支持白名单/黑名单功能和选择性 Cookie 清除",
    permissions: ["cookies", "storage", "tabs", "browsingData", "alarms"],
    host_permissions: ["https://*/*", "http://*/*"],
    action: {
      default_icon: icons,
      default_title: "Cookie Manager Pro",
    },
    icons,
    content_security_policy: {
      extension_pages:
        "default-src 'self'; script-src 'self'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; form-action 'none'; base-uri 'self';",
    },
  },
  vite: () => ({
    build: {
      minify: true,
      sourcemap: false,
    },
    server: {
      // 提高 Windows 上的构建稳定性
      watch: {
        usePolling: false,
      },
    },
  }),
  zip: {
    artifactTemplate: "{{name}}-{{version}}-{{manifestVersion}}.zip",
  },
});
