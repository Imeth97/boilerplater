import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["test/e2e/**/*.test.ts"],
    globals: true,
    setupFiles: ["test/e2e/setup.ts"],
    testTimeout: 30000,
  },
  define: {
    global: "globalThis",
  },
});