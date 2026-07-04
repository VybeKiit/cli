import { defineConfig } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '4000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL,
  },
  webServer: {
    command: 'pnpm exec tsx --env-file=.env src/server.ts',
    url: `${baseURL}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
