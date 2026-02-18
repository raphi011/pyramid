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
      exclude: ["**/*.stories.tsx", "**/*.test.tsx", "**/*.test.ts"],
      reporter: ["text", "html", "json-summary"],
      reportsDirectory: "coverage",
    },
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        resolve: {
          alias: {
            "@/app/lib/actions/challenge": path.join(
              dirname,
              ".storybook/mocks/challenge-action.ts",
            ),
            "@/app/lib/actions/match": path.join(
              dirname,
              ".storybook/mocks/match-action.ts",
            ),
            "@/app/lib/actions/enroll": path.join(
              dirname,
              ".storybook/mocks/enroll-action.ts",
            ),
          },
        },
        optimizeDeps: {
          include: [
            "@dnd-kit/core",
            "@dnd-kit/sortable",
            "@dnd-kit/utilities",
            "@headlessui/react",
            "@heroicons/react/24/outline",
            "@heroicons/react/20/solid",
            "clsx",
            "framer-motion",
            "qrcode.react",
            "recharts",
            "storybook/test",
          ],
        },
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: ["./.storybook/vitest.setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "unit",
          include: ["lib/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            "@": dirname,
            "server-only": path.join(
              dirname,
              ".storybook/mocks/server-only.ts",
            ),
          },
        },
        test: {
          name: "db",
          include: ["app/lib/**/*.test.ts"],
          environment: "node",
          pool: "forks",
          setupFiles: ["./app/lib/db/test-setup.ts"],
        },
      },
    ],
  },
});
