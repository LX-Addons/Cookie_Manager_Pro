import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Cookie Manager Pro",
    description: "高级Cookie管理，支持白名单/黑名单功能和选择性Cookie清除",
    permissions: ["cookies", "storage", "tabs", "browsingData", "alarms"],
    host_permissions: ["https://*/*", "http://*/*"],
    action: {
      default_icon: {
        16: "/icon.png",
        32: "/icon.png",
        48: "/icon.png",
        128: "/icon.png",
      },
    },
    icons: {
      16: "/icon.png",
      32: "/icon.png",
      48: "/icon.png",
      128: "/icon.png",
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline';",
    },
  },
});
