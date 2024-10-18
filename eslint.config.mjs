import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslintEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/.eslintrc.js"],
  },
  ...fixupConfigRules(
    compat.extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended",
      "plugin:import/recommended",
      "plugin:import/typescript",
    ),
  ),
  {
    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslintEslintPlugin),
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: "tsconfig.json",
      },
    },
  },
];
