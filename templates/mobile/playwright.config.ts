import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const port = process.env.PLAYWRIGHT_PORT === undefined ? '8081' : process.env.PLAYWRIGHT_PORT;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL === undefined
    ? `http://localhost:${port}`
    : process.env.PLAYWRIGHT_BASE_URL;
const headless = process.env.PLAYWRIGHT_HEADLESS !== 'false';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
    headless,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec expo start --web --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
