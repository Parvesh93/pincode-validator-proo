import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],

  test: {
    environment: "node",

    include: [
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
    ],

    exclude: [
      "node_modules/**",
      "build/**",
      ".react-router/**",
      "extensions/**",
    ],

    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    reporters: ["default"],
  },
});