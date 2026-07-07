import { CdpUnreachableError } from '@vybekiit/browser-automation/core/errors';
import { type Browser, chromium, type Page } from 'playwright';

export interface RecorderSession {
  readonly browser: Browser;
  readonly dispose: () => Promise<void>;
  readonly ownsPage: boolean;
  readonly page: Page;
}

export interface RecorderSessionOptions {
  readonly cdpEndpoint: string;
  readonly profileHint: string;
  readonly startUrl: string;
  readonly tabUrlPattern: RegExp;
}

/**
 * Attach the recorder to a dedicated Chrome session.
 *
 * @param options - CDP endpoint, profile hint, start URL, and tab reuse pattern.
 * @returns The recorder browser session.
 * @example
 * const session = await attachRecorderSession({ cdpEndpoint, profileHint, startUrl, tabUrlPattern });
 */
export const attachRecorderSession = async (
  options: RecorderSessionOptions,
): Promise<RecorderSession> => {
  const { cdpEndpoint, profileHint, startUrl, tabUrlPattern } = options;

  let browser: Browser;
  try {
    browser = await chromium.connectOverCDP(cdpEndpoint, { timeout: 15_000, noDefaults: true });
  } catch (err) {
    // biome-ignore lint/style/useErrorCause: CdpUnreachableError stores the cause through its ErrorOptions constructor.
    throw new CdpUnreachableError(cdpEndpoint, profileHint, { cause: err });
  }

  const [context] = browser.contexts();
  if (context === undefined) {
    await browser.close().catch(() => undefined);
    throw new CdpUnreachableError(cdpEndpoint, profileHint, {
      cause: new Error('Connected to Chrome but no browser context was found.'),
    });
  }

  const existing = context
    .pages()
    .filter((p) => !p.isClosed())
    .find((p) => tabUrlPattern.test(p.url()));

  let page: Page;
  let ownsPage: boolean;

  if (existing === undefined) {
    page = await context.newPage();
    ownsPage = true;
    console.log(`Opening ${startUrl}`);
    await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
    console.log(`Opened new tab for Inspector: ${page.url()}`);
  } else {
    page = existing;
    ownsPage = false;
    await page.bringToFront();
    console.log(`Reusing open tab for Inspector: ${page.url()}`);
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
};

/**
 * Print the manual Playwright Inspector recording instructions.
 *
 * @param draftPath - Draft file where copied locators should be pasted.
 * @param applyCommand - Command that converts the draft into the generated registry.
 * @returns Nothing; writes instructions to stdout.
 * @example
 * printInspectorInstructions('/tmp/selectors.txt', 'pnpm recorder:apply');
 */
export const printInspectorInstructions = (draftPath: string, applyCommand: string): void => {
  console.log(
    [
      '',
      'Playwright Inspector should be open. In it:',
      '  1. Confirm the highlighted browser tab matches the page you want to record.',
      '  2. Click "Pick locator" (target icon, top-left of Inspector).',
      '  3. Click each field - the suggested locator appears in the Inspector panel.',
      `  4. Copy each locator into ${draftPath}`,
      '     (one line per field: fieldKey = getByRole(...)).',
      '     Inspector does NOT write to the draft file automatically - paste manually.',
      '  5. Close the Inspector window when done.',
      `  6. Run \`${applyCommand}\` to write the generated registry.`,
      '',
    ].join('\n'),
  );
};
