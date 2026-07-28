import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-staging",
  timeout: 120_000,
  retries: 1,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
