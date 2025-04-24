// @ts-check

import eslint from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "out/**", "coverage/**"],
  },
  eslint.configs.recommended,
  {
    files: ["**/*.js"], // Apply to all JS files
    languageOptions: {
      ecmaVersion: 12, // Matches your old setting
      sourceType: "module", // Matches your old setting
      globals: {
        ...globals.browser, // browser environment globals
        ...globals.node, // node environment globals
        ...globals.jest, // jest environment globals
      },
    },
    rules: {
      semi: ["error", "always"], // Your rule
      quotes: ["error", "double"], // Your rule
      "no-unused-vars": ["warn"], // Your rule
    },
  },
];
