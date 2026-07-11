import { angularSafeFill, resolvePaceMs } from '@vybekiit/browser-automation/core/pace';
import { chromium, type Page } from 'playwright';
import { describe, expect, it } from 'vitest';

describe('resolvePaceMs', () => {
  it('defaults to 800ms when unset', () => {
    expect(resolvePaceMs({})).toBe(800);
  });

  it('reads a positive override from AUTOMATE_PACE_MS', () => {
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: '1500' })).toBe(1500);
  });

  it('allows zero for fast local runs', () => {
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: '0' })).toBe(0);
  });

  it('falls back to default on non-numeric or negative values', () => {
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: 'slow' })).toBe(800);
    expect(resolvePaceMs({ AUTOMATE_PACE_MS: '-100' })).toBe(800);
  });
});

describe('angularSafeFill', () => {
  it('writes the exact URI via native setter (no interleaving)', async () => {
    process.env.AUTOMATE_PACE_MS = '0';
    const browser = await chromium.launch({ headless: true });
    try {
      const page: Page = await browser.newPage();
      await page.setContent(
        `<!doctype html><html><body>
            <input id="uri" formcontrolname="uri" value="" />
          </body></html>`,
      );
      const uri = 'http://localhost:3000/api/auth/callback/google';
      await angularSafeFill(page.locator('#uri'), uri);
      expect(await page.locator('#uri').inputValue()).toBe(uri);
    } finally {
      await browser.close();
      delete process.env.AUTOMATE_PACE_MS;
    }
  }, 60_000);
});
