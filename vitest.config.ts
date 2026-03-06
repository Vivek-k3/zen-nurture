import path from "node:path";
import { defineConfig, defineProject } from "vitest/config";

const coverageInclude = [
  "src/lib/**/*.ts",
  "convex/lib/**/*.ts",
  "src/components/auth/authGuardDecision.ts",
];
const alias = {
  "@": path.resolve(__dirname, "src"),
};

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: coverageInclude,
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
      },
    },
    projects: [
      defineProject({
        resolve: { alias },
        test: {
          name: "unit",
          globals: true,
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "convex/lib/**/*.test.ts"],
        },
      }),
      defineProject({
        resolve: { alias },
        test: {
          name: "component",
          globals: true,
          environment: "jsdom",
          setupFiles: ["./tests/setup/vitest.setup.ts"],
          include: ["tests/component/**/*.test.ts", "tests/component/**/*.test.tsx"],
        },
      }),
      defineProject({
        resolve: { alias },
        test: {
          name: "convex",
          globals: true,
          environment: "node",
          include: ["tests/convex/**/*.test.ts"],
        },
      }),
      defineProject({
        resolve: { alias },
        test: {
          name: "route",
          globals: true,
          environment: "node",
          include: ["tests/route/**/*.test.ts"],
        },
      }),
    ],
  },
});
