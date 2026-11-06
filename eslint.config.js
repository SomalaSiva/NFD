import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/**", "node_modules/**", "drizzle/meta/**", "web/assets/app/parts/**"] },
  js.configs.recommended,
  {
    files: ["worker/**/*.js", "web/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
        APP_CSS: "readonly",
        APP_JS: "readonly",
        APP_ROUTE_ASSETS: "readonly",
        APP_ROUTE_URLS: "readonly",
        APP_ICON: "readonly",
        APP_ICON_192: "readonly",
        APP_ICON_512: "readonly",
        APP_MANIFEST: "readonly",
        PAGE_HTML: "readonly",
        PRIVACY_HTML: "readonly",
        GUIDELINES_HTML: "readonly",
      },
    },
    rules: { "no-empty": ["error", { allowEmptyCatch: true }], "no-control-regex": "off" },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.js", "test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: globals.node,
    },
  },
];
