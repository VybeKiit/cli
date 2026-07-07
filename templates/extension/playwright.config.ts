import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

const port = process.env.PLAYWRIGHT_PORT === undefined ? '3010' : process.env.PLAYWRIGHT_PORT;
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
    command: `pnpm build && pnpm exec serve .output/chrome-mv3 -l ${port} --no-clipboard`,
    url: `${baseURL}/popup.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
