import { defineConfig, devices } from '@playwright/test';

/**
 * Cross-browser smoke suite for the P9 "Browser compatibility" module.
 * Runs against the dockerized dev stack behind nginx — start it first with
 * `make certs && make up`, then `npm run test:e2e` from `frontend/`.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://localhost:8443',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
