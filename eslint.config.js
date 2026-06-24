// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const checkFile = require("eslint-plugin-check-file");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/**/!^[.*": "KEBAB_CASE",
        },
      ],
    },
  },
  {
    files: ["src/app/**/_layout.tsx", "src/app/**/\\[*\\].tsx"],
    rules: {
      "check-file/filename-naming-convention": "off",
    },
  },
  {
    ignores: ["dist/*", ".expo/*", "node_modules/*", "ios/*", "android/*"],
  },
]);
