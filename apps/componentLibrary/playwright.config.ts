import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT === undefined ? '3002' : process.env.PLAYWRIGHT_PORT;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL === undefined
    ? `http://localhost:${port}`
    : process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
