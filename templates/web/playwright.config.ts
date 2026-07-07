import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const port = process.env.PLAYWRIGHT_PORT === undefined ? '3100' : process.env.PLAYWRIGHT_PORT;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL === undefined
    ? `http://localhost:${port}`
    : process.env.PLAYWRIGHT_BASE_URL;
const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    headless,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
