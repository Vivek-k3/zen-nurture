import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";


export default [
  {
    ignores: [
      ".next/**",
      "convex/_generated/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "tsconfig.tsbuildinfo",
    ],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {},
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
];
