import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROFILE_PATHS } from '@vybekiit/browserAutomation/core/types';
import { ensureChromeWithCdp, profileDirFor } from './shared/chrome';
import { applyDraft, ensureDraftTemplate, type ParsedEntry, renderGenerated } from './shared/draft';
import { CWS_DRAFT_FIELDS } from './shared/fields';
import { appendRecorderLog } from './shared/log';
import { attachRecorderSession, printInspectorInstructions } from './shared/session';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DRAFT_PATH = resolve(PACKAGE_ROOT, '.cws-selectors.draft.txt');
const GENERATED_PATH = resolve(PACKAGE_ROOT, 'src/domains/extension/selectors.generated.ts');
const DEFAULT_CDP_PORT = 9222;

const DRAFT_HEADER = [
  '# CWS selector draft — maintainer only. Paste Playwright Inspector locators below.',
  '# Format: fieldKey = getByRole(...)',
  '# Lines starting with # and blank lines are ignored.',
];

async function openRecorder(chromeWebStoreId: string): Promise<void> {
  await appendRecorderLog('extension-open', `starting open-recorder for ${chromeWebStoreId}`);
  const profile = profileDirFor('extension');
  await ensureChromeWithCdp({ port: DEFAULT_CDP_PORT, profileDir: profile });
  await ensureDraftTemplate(DRAFT_PATH, CWS_DRAFT_FIELDS, DRAFT_HEADER);

  const listingHref = `https://chrome.google.com/webstore/devconsole/${chromeWebStoreId}/edit/listing?hl=en`;
  const session = await attachRecorderSession({
    cdpEndpoint: `http://localhost:${DEFAULT_CDP_PORT}`,
    profileHint: PROFILE_PATHS.extension,
    startUrl: listingHref,
    tabUrlPattern: /chrome\.google\.com\/webstore\/devconsole/,
  });

  try {
    process.env.PWDEBUG = '1';
    printInspectorInstructions(
      DRAFT_PATH,
      'pnpm --filter @vybekiit/browser-automation recorder:extension apply',
    );
    await session.page.pause();
  } finally {
    await session.dispose();
    await appendRecorderLog('extension-open', 'session complete');
  }
}

async function applyRecorded(): Promise<void> {
  await appendRecorderLog('extension-apply', 'apply-recorded-selectors');
  await applyDraft({
    draftPath: DRAFT_PATH,
    generatedPath: GENERATED_PATH,
    knownFields: CWS_DRAFT_FIELDS,
    render: (entries: Record<string, ParsedEntry>) =>
      renderGenerated(entries, {
        banner: 'Recorded selector overrides — maintainer recorder apply.',
        importLine: "import type { SelectorEntry } from './selectors';",
        exportName: 'RECORDED_SELECTORS',
      }),
  });
  await appendRecorderLog('extension-apply', `wrote ${GENERATED_PATH}`);
}

const [command, arg] = process.argv.slice(2);
if (command === 'open') {
  if (!arg) throw new Error('Usage: recorder:extension open <chromeWebStoreId>');
  openRecorder(arg).catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else if (command === 'apply') {
  applyRecorded().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else {
  console.log('Usage: recorder:extension open <chromeWebStoreId> | apply');
  process.exitCode = 1;
}
