import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["lib/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
    },
    rules: {
      "no-prototype-builtins": "error",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/", "test/", "src/"],
  },
];
