import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const port = process.env.PLAYWRIGHT_PORT ?? '3010';
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
    command: `pnpm build && pnpm exec serve .output/chrome-mv3 -l ${port} --no-clipboard`,
    url: `${baseURL}/popup.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
