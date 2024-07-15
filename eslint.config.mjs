import { Linter } from "eslint";
import pluginPrettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import pluginTypeScript from "@typescript-eslint/eslint-plugin";
import parserTypeScript from "@typescript-eslint/parser";

const config = [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: parserTypeScript,
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {
        browser: true,
        es2021: true,
      },
    },
    plugins: {
      prettier: pluginPrettier,
      "@typescript-eslint": pluginTypeScript,
    },
    rules: {
      ...prettierConfig.rules,
      "prettier/prettier": ["error", { endOfLine: "auto" }],
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
    files: ["src/scripts/**/*.ts"],
    ignores: [],
  },
];

export default config;
