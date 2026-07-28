import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "student-tablet",
      use: { ...devices["iPad (gen 7)"], baseURL: "http://127.0.0.1:43173" },
      testMatch: /student\.spec\.ts/,
    },
    {
      name: "teacher-desktop",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:43174" },
      testMatch: /teacher\.spec\.ts/,
    },
    {
      name: "studio-desktop",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:43175" },
      testMatch: /studio\.spec\.ts/,
    },
    {
      name: "student-config-guard",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:43273" },
      testMatch: /student-config\.spec\.ts/,
    },
    {
      name: "teacher-config-guard",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:43274" },
      testMatch: /teacher-config\.spec\.ts/,
    },
    {
      name: "studio-config-guard",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:43275" },
      testMatch: /studio-config\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: "npm run dev --workspace @middle-of-math/student -- --port 43173 --strictPort",
      env: { VITE_DEMO_MODE: "true" },
      url: "http://127.0.0.1:43173",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev --workspace @middle-of-math/teacher -- --port 43174 --strictPort",
      env: { VITE_DEMO_MODE: "true" },
      url: "http://127.0.0.1:43174",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev --workspace @middle-of-math/studio -- --port 43175 --strictPort",
      env: { VITE_DEMO_MODE: "true" },
      url: "http://127.0.0.1:43175",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev --workspace @middle-of-math/student -- --port 43273 --strictPort",
      env: { VITE_DEMO_MODE: "false", VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" },
      url: "http://127.0.0.1:43273",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev --workspace @middle-of-math/teacher -- --port 43274 --strictPort",
      env: { VITE_DEMO_MODE: "false", VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" },
      url: "http://127.0.0.1:43274",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev --workspace @middle-of-math/studio -- --port 43275 --strictPort",
      env: { VITE_DEMO_MODE: "false", VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: "" },
      url: "http://127.0.0.1:43275",
      reuseExistingServer: false,
    },
  ],
});
