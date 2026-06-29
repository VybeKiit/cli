import { chromium, type Browser, type Page } from 'playwright';

import { CdpUnreachableError } from '../../../src/core/errors';

export type RecorderSession = {
  browser: Browser;
  dispose: () => Promise<void>;
  ownsPage: boolean;
  page: Page;
};

export async function attachRecorderSession(options: {
  cdpEndpoint: string;
  profileHint: string;
  startUrl: string;
  tabUrlPattern: RegExp;
}): Promise<RecorderSession> {
  const { cdpEndpoint, profileHint, startUrl, tabUrlPattern } = options;

  let browser;
  try {
    browser = await chromium.connectOverCDP(cdpEndpoint, { timeout: 15_000 });
  } catch (err) {
    throw new CdpUnreachableError(cdpEndpoint, profileHint, err);
  }

  const context = browser.contexts()[0];
  if (!context) {
    await browser.close().catch(() => undefined);
    throw new CdpUnreachableError(
      cdpEndpoint,
      profileHint,
      new Error('Connected to Chrome but no browser context was found.'),
    );
  }

  const existing = context
    .pages()
    .filter((p) => !p.isClosed())
    .find((p) => tabUrlPattern.test(p.url()));

  let page: Page;
  let ownsPage: boolean;

  if (existing) {
    page = existing;
    ownsPage = false;
    await page.bringToFront();
    console.log(`Reusing open tab for Inspector: ${page.url()}`);
  } else {
    page = await context.newPage();
    ownsPage = true;
    console.log(`Opening ${startUrl}`);
    await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
    console.log(`Opened new tab for Inspector: ${page.url()}`);
  }

  return {
    browser,
    ownsPage,
    page,
    dispose: async (): Promise<void> => {
      if (ownsPage) {
        await page.close({ runBeforeUnload: false }).catch(() => undefined);
      }
      await browser.close({ reason: 'recorder session complete' }).catch(() => undefined);
    },
  };
}

export function printInspectorInstructions(draftPath: string, applyCommand: string): void {
  console.log(
    [
      '',
      'Playwright Inspector should be open. In it:',
      '  1. Confirm the highlighted browser tab matches the page you want to record.',
      '  2. Click "Pick locator" (target icon, top-left of Inspector).',
      '  3. Click each field — the suggested locator appears in the Inspector panel.',
      `  4. Copy each locator into ${draftPath}`,
      '     (one line per field: fieldKey = getByRole(...)).',
      '     Inspector does NOT write to the draft file automatically — paste manually.',
      '  5. Close the Inspector window when done.',
      `  6. Run \`${applyCommand}\` to write the generated registry.`,
      '',
    ].join('\n'),
  );
}
