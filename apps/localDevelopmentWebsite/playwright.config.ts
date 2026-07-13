import { defineConfig, devices } from '@playwright/test';

// Default off 3005 so a concurrent `pnpm dev:local` does not collide with e2e.
const port = process.env.PLAYWRIGHT_PORT === undefined ? '3015' : process.env.PLAYWRIGHT_PORT;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL === undefined
    ? `http://localhost:${port}`
    : process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './test',
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One retry helps after a heavy monorepo verify leaves the machine under memory pressure.
  retries: process.env.CI ? 2 : 1,
  // Serial workers: parallel Chromium after full `pnpm verify` OOMs or aborts navigations.
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    // PLAYWRIGHT_SLOW_MO=ms slows each action so a headed run is watchable.
    launchOptions: {
      ...(process.env.PLAYWRIGHT_SLOW_MO !== undefined && process.env.PLAYWRIGHT_SLOW_MO !== ''
        ? { slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO) }
        : {}),
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Wipe production `.next` from `pnpm build` so dev mode can compile cleanly.
    command: `rm -rf .next && pnpm exec next dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_E2E: '1',
      // Fixture tool stream for Live work e2e (no real agent / secrets).
      NEXT_PUBLIC_ASSISTANT_FIXTURE: '1',
      PLAYWRIGHT: '1',
      PORT: port,
    },
  },
});
