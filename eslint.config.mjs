import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", ".kilo/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**", "_cuarentena/**", "next-env.d.ts", "patch-customers-step1.cjs"]),
]);
