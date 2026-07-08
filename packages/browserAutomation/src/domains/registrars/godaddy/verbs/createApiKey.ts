import { DEFAULT_VERB_LOGGER, type VerbLogger } from '@vybekiit/browser-automation/core/verbLogger';
import { waitForGdAuthenticated } from '@vybekiit/browser-automation/domains/registrars/godaddy/dashboard/waitForAuthenticated';
import {
  scrapeGodaddyKeyPair,
  scrapeGodaddyKeysFromList,
} from '@vybekiit/browser-automation/domains/registrars/godaddy/scrape';
import {
  GD_KEYS_URL,
  type GdSetupParams,
  type GdSetupResult,
} from '@vybekiit/browser-automation/domains/registrars/godaddy/types';
import type { BrowserContext, Locator, Page } from 'playwright';

const envCredentials = (): { apiKey?: string; apiSecret?: string } => {
  const apiKey = process.env.GODADDY_API_KEY?.trim();
  const apiSecret = process.env.GODADDY_API_SECRET?.trim();
  return {
    ...(apiKey ? { apiKey } : {}),
    ...(apiSecret ? { apiSecret } : {}),
  };
};

const clickFirstVisible = async (page: Page, locators: Locator[]): Promise<boolean> => {
  for (const locator of locators) {
    // `.first()` — some controls (e.g. GoDaddy's header + empty-state "Create New API Key")
    // render more than one match; without it Playwright throws a strict-mode violation.
    if ((await locator.count()) > 0) {
      await locator.first().click({ timeout: 10_000 });
      return true;
    }
  }
  return false;
};

const readExistingKeys = async (page: Page): Promise<string[]> => {
  const html = await page.content();
  return scrapeGodaddyKeysFromList(html);
};

const tryRecreateSecret = async (
  page: Page,
  log: Pick<VerbLogger, 'log' | 'warn'>,
): Promise<string | null> => {
  const actions = page.getByRole('button', { name: /actions|more|menu|⋯|\.\.\./i }).first();
  if ((await actions.count()) > 0) {
    await actions.click({ timeout: 5000 }).catch(() => undefined);
  }

  const recreate = page
    .getByRole('button', { name: /recreate.*secret|reset.*secret|new secret/i })
    .or(page.getByRole('menuitem', { name: /recreate.*secret|reset.*secret|new secret/i }))
    .first();
  if ((await recreate.count()) === 0) return null;

  log.log('[gd] recreating API secret for existing key');
  await recreate.click({ timeout: 10_000 });
  await page.waitForTimeout(1500);

  const pair = await readKeyPairFromPage(activeModal(page));
  return pair === null ? null : pair.apiSecret;
};

/**
 * Resolve the active create-key modal. GoDaddy renders one modal instance per "Create New
 * API Key" button (header + empty-state) bound to shared open state, so opening one shows two
 * stacked, identical dialogs. The last one in DOM order paints on top, so its controls are the
 * clickable ones — the earlier modal's buttons are intercepted by the top backdrop.
 */
const activeModal = (page: Page): Locator => page.getByRole('dialog').last();

const openCreateKeyDialog = async (page: Page): Promise<Locator> => {
  const clicked = await clickFirstVisible(page, [
    page.getByRole('button', { name: /create new api key/i }),
    page.getByRole('link', { name: /create new api key/i }),
    page.getByRole('button', { name: /create key|new key|add key/i }),
    page.getByRole('link', { name: /create key|new key/i }),
  ]);
  if (!clicked) {
    throw new Error(
      'Could not find "Create New API Key" on GoDaddy Developer portal — sign in and retry.',
    );
  }
  const modal = activeModal(page);
  await modal.waitFor({ state: 'visible', timeout: 10_000 });
  return modal;
};

const fillKeyName = async (modal: Locator, keyName: string): Promise<void> => {
  const nameInput = modal
    .locator(
      'input[name*="name" i], input[id*="name" i], input[placeholder*="name" i], input[type="text"]',
    )
    .first();
  if ((await nameInput.count()) > 0) {
    await nameInput.fill(keyName);
  }
};

const chooseOteEnvironment = async (modal: Locator): Promise<void> => {
  const select = modal.locator('select').first();
  if ((await select.count()) > 0) {
    const options = await select.locator('option').allTextContents();
    const oteIndex = options.findIndex((t) => /ote|test|sandbox/i.test(t));
    if (oteIndex >= 0) {
      await select.selectOption({ index: oteIndex });
    }
    return;
  }

  const oteOption = modal.getByRole('option', { name: /ote|test|sandbox/i }).first();
  if ((await oteOption.count()) > 0) {
    await oteOption.click();
    return;
  }

  // GoDaddy's OTE radio has no accessible name; the id is the reliable anchor. OTE is the
  // default-selected environment, so this only re-affirms it.
  const oteRadio = modal
    .locator('#envRadio_ote')
    .or(modal.getByRole('radio', { name: /ote|test|sandbox/i }))
    .first();
  if ((await oteRadio.count()) > 0) {
    await oteRadio.check({ force: true });
  }
};

const advanceWizard = async (modal: Locator): Promise<void> => {
  const next = modal
    .getByRole('button', { name: /^next$/i })
    .or(modal.getByRole('button', { name: /create|generate|save|confirm/i }))
    .first();
  await next.click({ timeout: 10_000 });
  await modal.page().waitForTimeout(1500);
};

const readKeyPairFromPage = async (
  scope: Locator,
): Promise<{ apiKey: string; apiSecret: string } | null> => {
  // GoDaddy renders the key + secret in two ordered `keyCodeBlock` divs (not inputs); the
  // class carries a CSS-module hash so match the stable substring. Fall back to inputs for
  // older layouts.
  const fromDom = await scope
    .evaluate((root) => {
      const blocks = Array.from(root.querySelectorAll('[class*="keyCodeBlock" i]'))
        .map((el) => {
          const text = el.textContent;
          return text === null ? '' : text.trim();
        })
        .filter((v) => v.length >= 15);
      if (blocks.length >= 2) return { apiKey: blocks[0]!, apiSecret: blocks[1]! };

      const inputs = Array.from(root.querySelectorAll('input, textarea'));
      const values = inputs
        .map((el) => {
          const value = (el as HTMLInputElement).value;
          return value === undefined ? '' : value.trim();
        })
        .filter((v) => v.length >= 20);
      if (values.length >= 2) return { apiKey: values[0]!, apiSecret: values[1]! };
      if (values.length === 1) return { apiKey: values[0]!, apiSecret: '' };
      return null;
    })
    .catch(() => null);
  if (fromDom?.apiKey && fromDom.apiSecret) return fromDom;

  const html = await scope.innerHTML().catch(() => '');
  const scraped = scrapeGodaddyKeyPair(html);
  if (scraped) return scraped;

  const fromText = await scope
    .evaluate((root) => {
      const innerText = (root as HTMLElement).innerText;
      const body = innerText === undefined ? root.textContent : innerText;
      const text = body === null ? '' : body;
      const keyMatch = text.match(/(?:API\s*)?Key[:\s]+([A-Za-z0-9_-]{20,})/i);
      const secretMatch = text.match(/(?:API\s*)?Secret[:\s]+([A-Za-z0-9_-]{20,})/i);
      if (keyMatch?.[1] && secretMatch?.[1]) {
        return { apiKey: keyMatch[1], apiSecret: secretMatch[1] };
      }
      return null;
    })
    .catch(() => null);
  return fromText;
};

const tryReuseExistingKey = async (
  page: Page,
  params: GdSetupParams,
  log: Pick<VerbLogger, 'log' | 'warn'>,
): Promise<GdSetupResult | null> => {
  const existingKeys = await readExistingKeys(page);
  const fromEnv = envCredentials();
  let apiKey: string | undefined;

  if (fromEnv.apiKey !== undefined && existingKeys.includes(fromEnv.apiKey)) {
    apiKey = fromEnv.apiKey;
  } else {
    apiKey = existingKeys[0];
  }

  if (!apiKey) return null;

  log.log('[gd] existing API key found — reusing');

  let apiSecret = fromEnv.apiSecret === undefined ? '' : fromEnv.apiSecret;
  if (fromEnv.apiKey === apiKey && fromEnv.apiSecret) {
    log.log('[gd] using GODADDY_API_SECRET from environment');
  } else {
    const recreated = await tryRecreateSecret(page, log);
    if (recreated) apiSecret = recreated;
  }

  if (!apiSecret) {
    throw new Error(
      'GoDaddy API key exists but secret is not available. Set GODADDY_API_SECRET in .env or recreate the secret in the portal, then retry.',
    );
  }

  return {
    apiKey,
    apiSecret,
    ote: params.ote !== false,
    reusedExisting: true,
  };
};

/**
 * Create or reuse a GoDaddy API key and read credentials.
 *
 * @param page - Playwright page to inspect or mutate.
 * @param params - Validated automation parameters for the operation.
 * @param context - Browser context used for authenticated waits.
 * @param log - Input value for log.
 * @returns Promise resolving with the automation result.
 * @example
 * const result = await createApiKeyInPortal(page, params, context, log);
 */
export const createApiKeyInPortal = async (
  page: Page,
  params: GdSetupParams = {},
  context?: BrowserContext,
  log: Pick<VerbLogger, 'log' | 'warn'> = DEFAULT_VERB_LOGGER,
): Promise<GdSetupResult> => {
  await page.goto(GD_KEYS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  page = await waitForGdAuthenticated(page, log, context === undefined ? page.context() : context);

  const reused = await tryReuseExistingKey(page, params, log);
  if (reused) return reused;

  log.log('[gd] no existing key — creating new API key');
  const modal = await openCreateKeyDialog(page);

  const keyName = params.keyName === undefined ? `vybekiit-${Date.now()}` : params.keyName;
  await fillKeyName(modal, keyName);

  if (params.ote !== false) {
    await chooseOteEnvironment(modal);
  }

  await advanceWizard(modal);

  const pair = await readKeyPairFromPage(modal);
  if (!pair) {
    throw new Error(
      'GoDaddy API key was created but could not be read from the portal (copy it manually).',
    );
  }

  await clickFirstVisible(page, [
    modal.getByRole('button', { name: /got it|done|close|ok/i }),
  ]).catch(() => undefined);

  return {
    apiKey: pair.apiKey,
    apiSecret: pair.apiSecret,
    ote: params.ote !== false,
    reusedExisting: false,
  };
};
