import { expect, type Page } from '@playwright/test';

/**
 * Ignore expected local-dev console noise during fixture e2e.
 * Hydration SVG gradient ids (React useId) and missing optional assets are not product bugs.
 */
export const ignoreConsoleLine = (line: string): boolean =>
  /favicon|Download the React DevTools|WebSocket connection to 'ws:\/\/localhost:3006|hydrated but some attributes|Failed to load resource: the server responded with a status of 404|net::ERR_|404 \(Not Found\)/i.test(
    line,
  );

/** True when a console line looks like a leaked secret. */
export const looksLikeSecret = (line: string): boolean =>
  /sk_live_|sk_test_|postgres:\/\//i.test(line) || /api[_-]?key\s*[:=]/i.test(line);

/**
 * Attach console + pageerror collectors for production-safety assertions.
 *
 * @param page - Playwright page.
 * @returns Mutable list of error strings.
 */
export const attachConsoleErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
};

/**
 * Assert console has no secrets and no unexpected errors.
 *
 * @param errors - Collected console/page errors.
 */
export const expectCleanConsole = (errors: readonly string[]): void => {
  const secrets = errors.filter((e) => looksLikeSecret(e));
  expect(secrets, `secrets in console: ${secrets.join('\n')}`).toEqual([]);
  const unexpected = errors.filter((e) => !ignoreConsoleLine(e));
  expect(unexpected, `console errors: ${unexpected.join('\n')}`).toEqual([]);
};

/**
 * Type a prompt into the chat textarea and submit.
 *
 * @param page - Playwright page.
 * @param prompt - User message.
 */
export const sendChatPrompt = async (page: Page, prompt: string): Promise<void> => {
  // Prefer chat-input test id — page may include hidden third-party textareas (e.g. recaptcha).
  const input = page.getByTestId('chat-input').or(page.locator('textarea:visible').first());
  await expect(input).toBeVisible({ timeout: 15_000 });
  await input.fill(prompt);
  await page.keyboard.press('Enter');
};

/**
 * Wait until a domain journey card on the chat rail hits 100%.
 *
 * @param page - Playwright page.
 * @param domain - Domain id (auth, database, payments, deploy, crud).
 * @param timeoutMs - Poll timeout.
 */
export const expectDomainDone = async (
  page: Page,
  domain: string,
  timeoutMs = 25_000,
): Promise<void> => {
  const rail = page.getByTestId('journey-rail-host');
  const card = rail.getByTestId(`domain-journey-${domain}`);
  await expect(card).toBeVisible({ timeout: 15_000 });
  await expect
    .poll(async () => card.getAttribute('data-progress'), { timeout: timeoutMs })
    .toBe('100');
};

/**
 * Assert Live work card shows the expected brand mark and is active when done.
 *
 * @param page - Playwright page.
 * @param domain - Domain id on the card.
 * @param providerId - Brand id on data-provider (e.g. neon, lemon-squeezy).
 * @param hostTestId - Rail host test id (chat vs scenarios).
 */
export const expectActiveBrand = async (
  page: Page,
  domain: string,
  providerId: string,
  hostTestId = 'journey-rail-host',
): Promise<void> => {
  const host = page.getByTestId(hostTestId);
  const card = host.getByTestId(`domain-journey-${domain}`);
  await expect(card).toBeVisible();
  const mark = card.getByTestId('provider-mark');
  await expect(mark).toHaveAttribute('data-provider', providerId);
  await expect(mark).toHaveAttribute('data-active', 'true');
};

/** Catalog of production Live work cases (chat + scenarios). */
export type LiveWorkCase = {
  readonly id: string;
  readonly prompt: string;
  /** Domains that must reach 100%. */
  readonly domains: readonly string[];
  /** domain → brand data-provider id after completion. */
  readonly brands: Readonly<Record<string, string>>;
};

/**
 * Full matrix used by production e2e — one entry per openable scenario.
 * Brands are the resolved ProviderMark ids (not free-text aliases).
 */
export const LIVE_WORK_CASES: readonly LiveWorkCase[] = [
  {
    id: 'neon',
    prompt: 'create neon database with ready feature checks',
    domains: ['database'],
    brands: { database: 'neon' },
  },
  {
    id: 'supabase',
    prompt: 'wire supabase database',
    domains: ['database'],
    brands: { database: 'supabase' },
  },
  {
    id: 'auth-google',
    prompt: 'add google sign-in and auth for my app',
    domains: ['auth'],
    brands: { auth: 'google' },
  },
  {
    id: 'stripe',
    prompt: 'setup stripe payments and checkout',
    domains: ['payments'],
    brands: { payments: 'stripe' },
  },
  {
    id: 'lemon',
    prompt: 'take money with lemon squeezy',
    domains: ['payments'],
    brands: { payments: 'lemon-squeezy' },
  },
  {
    id: 'crud-orders',
    prompt: 'add crud for orders',
    domains: ['crud'],
    brands: { crud: 'lemon-squeezy' },
  },
  {
    id: 'cloudflare',
    prompt: 'deploy index.html to cloudflare pages',
    domains: ['deploy'],
    brands: { deploy: 'cloudflare' },
  },
  {
    id: 'vercel',
    prompt: 'deploy to vercel production',
    domains: ['deploy'],
    brands: { deploy: 'vercel' },
  },
  {
    id: 'render',
    prompt: 'deploy basic index.html to render',
    domains: ['deploy'],
    brands: { deploy: 'render' },
  },
  {
    id: 'railway',
    prompt: 'deploy to railway',
    domains: ['deploy'],
    brands: { deploy: 'railway' },
  },
  {
    id: 'combo',
    prompt: 'wire neon database, stripe payments, and deploy to cloudflare',
    domains: ['database', 'payments', 'deploy'],
    brands: {
      database: 'neon',
      payments: 'stripe',
      deploy: 'cloudflare',
    },
  },
  {
    id: 'saas',
    prompt: 'add google sign-in, neon database, stripe payments, and deploy to cloudflare',
    domains: ['auth', 'database', 'payments', 'deploy'],
    brands: {
      auth: 'google',
      database: 'neon',
      payments: 'stripe',
      deploy: 'cloudflare',
    },
  },
];
