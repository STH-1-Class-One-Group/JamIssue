import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceFiles = [
  "src/**/*.{ts,tsx}",
  "scripts/**/*.ts",
  "deploy/api-worker-shell/**/*.ts",
  "test/**/*.{ts,tsx}",
];

export default tseslint.config(
  {
    ignores: [
      "infra/nginx/site/**",
      "deploy/api-worker-shell/.wrangler/**",
      "node_modules/**",
      "backend/**",
      "docs/**",
      ".tmp/**",
      ".python-temp/**",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
);
