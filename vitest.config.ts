import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/**/*.test.ts",
      "apps/**/*.test.tsx",
      "tools/**/*.test.ts"
    ],
    environment: "node",
    coverage: {
      reporter: ["text", "html"]
    }
  }
});
