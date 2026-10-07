import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;
export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

/**
 * Browser tests against the real stack (API + database + SPA).
 *
 * Locally: start the backend and `npm run dev` in frontend, then
 * `npm test` here; running servers are reused. In CI the servers below are
 * started automatically.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  // Tests share one database and real-time server; keep them sequential
  workers: 1,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start:prod',
      cwd: '../backend',
      url: `${API_URL}/v1/health`,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      cwd: '../frontend',
      url: BASE_URL,
      reuseExistingServer: !CI,
      timeout: 120_000,
      env: { VITE_API_URL: API_URL, VITE_WS_URL: API_URL },
    },
  ],
});
