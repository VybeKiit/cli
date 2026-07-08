import { LS_FIELD_FALLBACKS } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldFallbacks';
import { lsField } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldLocator';
import { LS_DRAFT_FIELDS } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import { type Browser, chromium, type Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('LS field fallbacks coverage', () => {
  it('covers every product editor draft field except dashboard reads', () => {
    for (const key of LS_DRAFT_FIELDS) {
      if (!key.startsWith('dashboard.')) {
        expect(LS_FIELD_FALLBACKS[key], key).toBeDefined();
      }
    }
  });
});

describe('lsField resolution', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page.close().catch(() => undefined);
    await browser.close({ reason: 'ls field locator tests complete' }).catch(() => undefined);
  }, 30_000);

  it('uses registry entry when present on page', async () => {
    await page.setContent(`
      <button>New Product</button>
      <input id="input_name" aria-label="Name" />
    `);
    const locator = await lsField(page, 'product.createButton');
    expect(await locator.textContent()).toBe('New Product');
  });

  it('falls back to checkbox role hint when registry selector misses DOM', async () => {
    await page.setContent(`
      <div class="form-group">
        <label class="form-label mb-0">Generate license keys</label>
        <div role="checkbox" aria-checked="false" tabindex="0" aria-label="Generate license keys"></div>
      </div>
    `);
    const toggle = await lsField(page, 'product.settings.licenseKeysToggle');
    expect(await toggle.count()).toBe(1);
    expect(await toggle.getAttribute('role')).toBe('checkbox');
  });

  it('resolves file inputs by index (attached, not visibility)', async () => {
    await page.setContent(`
      <input type="file" style="display:none" />
      <input type="file" style="display:none" />
    `);
    const media = await lsField(page, 'product.media.uploadInput');
    const files = await lsField(page, 'product.files.uploadInput');
    expect(await media.evaluate((el) => (el as { type?: string }).type)).toBe('file');
    expect(await files.evaluate((el) => (el as { type?: string }).type)).toBe('file');
    expect(await media.count()).toBe(1);
    expect(await files.count()).toBe(1);
  });
});
