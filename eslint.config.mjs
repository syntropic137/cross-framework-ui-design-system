// ESLint 9 flat config (replaces .eslintrc.cjs).
// Applies to every workspace package — ESLint walks up from each package dir
// to find this file at the monorepo root.
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";
import storybook from "eslint-plugin-storybook";
import globals from "globals";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/generated/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: "module", ecmaVersion: 2022 },
      globals: { ...globals.node, ...globals.es2021, ...globals.browser },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript handles undefined-variable checking itself; the core rule
      // false-positives on ambient types (e.g. HandlebarsTemplateDelegate).
      "no-undef": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
  prettier,
];
