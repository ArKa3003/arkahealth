import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Part F coverage gate: modules with Vitest scaffolds that currently meet ≥85% line coverage.
 * Expand this list as additional `__tests__/aiie/*` and integration tests land.
 */
const NEW_LIB_COVERAGE_GLOBS = [
  "lib/aiie/swallow-triage.ts",
  "lib/cards/card-shared.ts",
  "lib/cards/duplicate-order-card.ts",
  "lib/cards/overuse-soft-block-card.ts",
  "lib/cards/oop-card.ts",
  "lib/federated/laplace.ts",
  "lib/fhir/record-scraper.ts",
  "lib/retrieval/excerpt.ts",
  "lib/retrieval/rate-limit.ts",
];

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: NEW_LIB_COVERAGE_GLOBS,
      exclude: ["**/*.test.ts", "**/__tests__/**"],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
