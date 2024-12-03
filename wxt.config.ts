import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: "src",
    extensionApi: "chrome",
    modules: ["@wxt-dev/module-solid"],
    imports: false, // Disable auto-imports
    manifest: {
        permissions: ["webRequest", "tabs"],
        host_permissions: ["*://*.la.utexas.edu/*"],
    },
});
