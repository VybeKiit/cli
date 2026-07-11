import {
  fillJsOrigins,
  fillRedirectUris,
  saveAuthPlatformClientForm,
  waitForAuthPlatformForm,
} from '@vybekiit/browser-automation/domains/google/dashboard/authPlatformForm';
import { chromium, type Page } from 'playwright';
import { describe, expect, it } from 'vitest';

/**
 * Fixture mirrors dual URI stacks (origins + redirects) with formcontrolname="uri".
 * Used as a hermetic stand-in for Google Auth Platform client edit.
 */
const dualUriFormHtml = `<!doctype html>
<html><body>
<main>
  <h1>Client</h1>
  <input formcontrolname="displayName" value="Replybase Web" />
  <div class="cfc-form-stack-container">
    <h2>Authorised JavaScript origins</h2>
    <div data-section="origins">
      <input formcontrolname="uri" data-kind="origin" value="" />
      <button type="button" id="add-origin">Add URI</button>
    </div>
  </div>
  <div class="cfc-form-stack-container">
    <h2>Authorised redirect URIs</h2>
    <div data-section="redirects">
      <input formcontrolname="uri" data-kind="redirect" value="https://replybase.dev/api/auth/callback/google" />
      <button type="button" id="add-redirect">Add URI</button>
    </div>
  </div>
  <button type="button" id="save">Save</button>
</main>
<script>
  const wire = (sectionSel, addId) => {
    const section = document.querySelector(sectionSel);
    const add = document.getElementById(addId);
    add.addEventListener('click', () => {
      const input = document.createElement('input');
      input.setAttribute('formcontrolname', 'uri');
      input.value = '';
      section.insertBefore(input, add);
    });
  };
  wire('[data-section="origins"]', 'add-origin');
  wire('[data-section="redirects"]', 'add-redirect');
</script>
</body></html>`;

const silentLog = { log: () => {}, warn: () => {} };

/**
 * Launch a one-shot headless page for a fixture case.
 * Avoids shared browser afterAll hangs under turbo parallel test load.
 *
 * @param run - Test body receiving a page with the dual-URI fixture loaded.
 */
const withFixturePage = async (run: (page: Page) => Promise<void>): Promise<void> => {
  process.env.AUTOMATE_PACE_MS = '0';
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(dualUriFormHtml);
    await run(page);
  } finally {
    await browser.close();
    delete process.env.AUTOMATE_PACE_MS;
  }
};

describe('authPlatformForm (fixture e2e)', () => {
  it('waitForAuthPlatformForm resolves when uri fields exist', async () => {
    await withFixturePage(async (page) => {
      await expect(
        waitForAuthPlatformForm(page, { fieldTimeoutMs: 2000, maxReloads: 0 }),
      ).resolves.toBe(page);
    });
  }, 60_000);

  it('fills origins and merges redirects without cross-contaminating stacks', async () => {
    await withFixturePage(async (page) => {
      const origins = await fillJsOrigins(
        page,
        ['http://localhost:3000', 'https://replybase.dev'],
        silentLog,
      );
      const redirects = await fillRedirectUris(
        page,
        [
          'https://replybase.dev/api/auth/callback/google',
          'http://localhost:3000/api/auth/callback/google',
        ],
        silentLog,
      );

      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('https://replybase.dev');
      expect(redirects).toContain('http://localhost:3000/api/auth/callback/google');
      expect(redirects).toContain('https://replybase.dev/api/auth/callback/google');

      const originValues = await page
        .locator('[data-section="origins"] input')
        .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
      for (const v of originValues) {
        if (v.length > 0) {
          expect(v.includes('/api/')).toBe(false);
        }
      }

      const redirectValues = await page
        .locator('[data-section="redirects"] input')
        .evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value));
      expect(redirectValues.some((v) => v.includes('/api/auth/callback/google'))).toBe(true);
    });
  }, 60_000);

  it('saveAuthPlatformClientForm clicks Save when enabled', async () => {
    await withFixturePage(async (page) => {
      await fillJsOrigins(page, ['http://localhost:3000'], silentLog);
      await fillRedirectUris(page, ['http://localhost:3000/api/auth/callback/google'], silentLog);
      await expect(saveAuthPlatformClientForm(page, silentLog)).resolves.toBeUndefined();
    });
  }, 60_000);
});
