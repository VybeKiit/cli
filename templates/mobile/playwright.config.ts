import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const port = process.env.PLAYWRIGHT_PORT ?? '8081';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

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
    command: `pnpm exec expo start --web --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
