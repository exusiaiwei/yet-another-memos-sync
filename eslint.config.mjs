import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  // Obsidian plugin guidelines (official) — already wires up @typescript-eslint
  ...obsidianmd.configs.recommended,

  // Project-specific TS parser config and rule overrides
  {
    files: ["main.ts", "src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", { args: "none" }],
      "@typescript-eslint/ban-ts-comment": "off",
      "no-prototype-builtins": "off",
      "@typescript-eslint/no-empty-function": "off",
    },
  },

  // Ignore generated / vendored output
  {
    ignores: ["main.js", "node_modules/**", "dist/**", "test/**", "*.mjs"],
  },
];
