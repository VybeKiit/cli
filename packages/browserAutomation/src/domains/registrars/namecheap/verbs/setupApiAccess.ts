import type { BrowserContext, Page } from 'playwright';

import { fetchPublicIpv4 } from '../../shared/publicIp';
import { waitForNcAuthenticated } from '../dashboard/waitForAuthenticated';
import {
  htmlContainsWhitelistedIp,
  scrapeNamecheapApiKey,
  scrapeNamecheapApiUser,
} from '../scrape';
import { NC_API_ACCESS_URL, type NcSetupParams, type NcSetupResult } from '../types';

function envCredentials(): { apiKey?: string; apiUser?: string } {
  const apiKey = process.env.NAMECHEAP_API_KEY?.trim();
  const apiUser = process.env.NAMECHEAP_API_USER?.trim().toLowerCase();
  return {
    ...(apiKey ? { apiKey } : {}),
    ...(apiUser ? { apiUser } : {}),
  };
}

async function isApiAccessEnabled(page: Page): Promise<boolean> {
  const toggle = page.getByRole('checkbox', { name: /api access/i }).first();
  if ((await toggle.count()) > 0) {
    return toggle.isChecked().catch(() => false);
  }
  const switchBtn = page.getByRole('switch', { name: /api access/i }).first();
  if ((await switchBtn.count()) > 0) {
    return (await switchBtn.getAttribute('aria-checked')) === 'true';
  }
  const html = await page.content();
  return Boolean(scrapeNamecheapApiKey(html));
}

async function enableApiAccessToggle(page: Page): Promise<void> {
  if (await isApiAccessEnabled(page)) return;

  const toggle = page.getByRole('checkbox', { name: /api access/i }).first();
  if ((await toggle.count()) > 0) {
    await toggle.check({ force: true });
    return;
  }

  const switchBtn = page.getByRole('switch', { name: /api access/i }).first();
  if ((await switchBtn.count()) > 0) {
    await switchBtn.click();
    return;
  }

  const enableBtn = page.getByRole('button', { name: /enable api access/i }).first();
  if ((await enableBtn.count()) > 0) {
    await enableBtn.click();
  }
}

async function whitelistIp(page: Page, ip: string): Promise<void> {
  const html = await page.content();
  if (htmlContainsWhitelistedIp(html, ip)) return;

  const ipInput = page
    .locator('input[name*="ip" i], input[id*="ip" i], input[placeholder*="ip" i]')
    .first();
  if ((await ipInput.count()) > 0) {
    await ipInput.fill(ip);
    const addBtn = page.getByRole('button', { name: /add|save|whitelist/i }).first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();
      await page.waitForTimeout(1500);
    }
    return;
  }

  const addIpBtn = page.getByRole('button', { name: /add ip|whitelist/i }).first();
  if ((await addIpBtn.count()) > 0) {
    await addIpBtn.click();
    await page.locator('input').last().fill(ip);
    await page
      .getByRole('button', { name: /save|add|confirm/i })
      .first()
      .click();
    await page.waitForTimeout(1500);
  }
}

async function readCredentialsFromPage(
  page: Page,
  log: Pick<Console, 'log' | 'warn'>,
): Promise<{ apiKey: string; apiUser: string } | null> {
  const html = await page.content();
  let apiKey = scrapeNamecheapApiKey(html);
  let apiUser = scrapeNamecheapApiUser(html);

  const keyInput = page.locator('input[name*="ApiKey" i], input[id*="apikey" i]').first();
  if (!apiKey && (await keyInput.count()) > 0) {
    apiKey = (await keyInput.inputValue()).trim() || null;
  }

  const userInput = page.locator('input[name*="ApiUser" i], input[id*="apiuser" i]').first();
  if (!apiUser && (await userInput.count()) > 0) {
    apiUser = (await userInput.inputValue()).trim().toLowerCase() || null;
  }

  const fromEnv = envCredentials();
  apiKey = apiKey ?? fromEnv.apiKey ?? null;
  apiUser = apiUser ?? fromEnv.apiUser ?? null;

  if (!apiUser) {
    const profileLink = page.locator('[data-username], .user-name, .profile-name').first();
    if ((await profileLink.count()) > 0) {
      const text = (await profileLink.textContent())?.trim().toLowerCase();
      if (text && /^[a-z0-9_-]{3,32}$/.test(text)) apiUser = text;
    }
  }

  if (apiKey && apiUser) {
    return { apiKey, apiUser };
  }

  const regenerate = page.getByRole('button', { name: /regenerate|reset api key/i }).first();
  if ((await regenerate.count()) > 0) {
    log.log('[nc] no readable key — regenerating API key');
    await regenerate.click();
    await page.waitForTimeout(2000);
    const refreshed = await page.content();
    apiKey = scrapeNamecheapApiKey(refreshed) ?? apiKey;
    apiUser = apiUser ?? scrapeNamecheapApiUser(refreshed);
  }

  if (!(apiKey && apiUser)) return null;
  return { apiKey, apiUser };
}

/** Enable API access, whitelist the current public IP, and read API credentials. */
export async function setupApiAccess(
  page: Page,
  params: NcSetupParams = {},
  context?: BrowserContext,
  log: Pick<Console, 'log' | 'warn'> = console,
): Promise<NcSetupResult> {
  await page.goto(NC_API_ACCESS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  page = await waitForNcAuthenticated(page, log, context ?? page.context());

  const alreadyEnabled = await isApiAccessEnabled(page);
  if (alreadyEnabled) {
    log.log('[nc] API access already enabled — reusing existing credentials');
  } else {
    await enableApiAccessToggle(page);
  }

  const clientIp = await fetchPublicIpv4();
  await whitelistIp(page, clientIp);

  const credentials = await readCredentialsFromPage(page, log);
  if (!credentials) {
    throw new Error(
      'Could not read Namecheap API credentials from the dashboard. Enable API access manually, then retry.',
    );
  }

  return {
    apiKey: credentials.apiKey,
    apiUser: credentials.apiUser,
    clientIp,
    reusedExisting: alreadyEnabled,
    sandbox: params.sandbox === true,
  };
}
