// @ts-check

import js from "@eslint/js";
import globals from "globals";
import tslint from "typescript-eslint";

export default tslint.config(
  {
    name: "base/ignoreFiles",
    ignores: ["cli-incremental-info", "coverage", "**/dist/*"],
  },
  {
    name: "base/defaultMatches",
    files: ["**/*.{js,mjs,cjs,ts}"],
  },
  {
    name: "base/globals",
    languageOptions: { globals: { ...globals.node, ...globals.es2023 } },
  },
  js.configs.recommended,
  ...tslint.configs.strictTypeChecked,
  ...tslint.configs.stylisticTypeChecked,
  {
    name: "base/projectRules",
    plugins: {
      "@typescript-eslint": tslint.plugin,
    },
    languageOptions: {
      parser: tslint.parser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2023,
        project: ["tsconfig.json", "tsconfig.*.json"],
      },
    },
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            arguments: false,
          },
        },
      ],
    },
  },
  {
    // disable type-aware linting on JS files
    files: ["**/*.js"],
    ...tslint.configs.disableTypeChecked,
  }
);
