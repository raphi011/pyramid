import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

import { playwright } from "@vitest/browser-playwright";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      include: ["components/**/*.tsx"],
      exclude: [
        "**/*.stories.tsx",
        "**/*.test.tsx",
        "**/*.test.ts",
      ],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
    },
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["./.storybook/vitest.setup.ts"],
          teardownTimeout: 20000,
        },
      },
      {
        extends: true,
        test: {
          name: "db",
          include: [
            "app/lib/db/__tests__/**/*.test.ts",
            "app/lib/__tests__/**/*.test.ts",
          ],
          environment: "node",
          pool: "forks",
          setupFiles: ["./app/lib/db/__tests__/setup.ts"],
        },
      },
    ],
  },
});
