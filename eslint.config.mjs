import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default defineConfig([
  ...tseslint.configs.recommended,
  {
    files: ["**/*.tsx"],
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
  globalIgnores([
    ".next/**",
    ".data/**",
    "reports/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
]);
