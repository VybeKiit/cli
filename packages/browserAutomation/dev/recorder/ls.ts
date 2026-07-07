import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROFILE_PATHS } from '@vybekiit/browser-automation/core/types';
import { LS_DASHBOARD_URL } from '@vybekiit/browser-automation/domains/payments/ls/types';
import { ensureChromeWithCdp, profileDirFor } from './shared/chrome';
import { applyDraft, ensureDraftTemplate, type ParsedEntry, renderGenerated } from './shared/draft';
import { LS_DRAFT_FIELDS } from './shared/fields';
import { appendRecorderLog } from './shared/log';
import { runLsProbe } from './shared/probe/run';
import { runLsProbeE2e, runLsProbeE2eCleanup } from './shared/probe/runE2e';
import { attachRecorderSession, printInspectorInstructions } from './shared/session';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DRAFT_PATH = resolve(PACKAGE_ROOT, '.ls-selectors.draft.txt');
const GENERATED_PATH = resolve(
  PACKAGE_ROOT,
  'src/domains/payments/ls/selectors/registry.generated.ts',
);
const LOG_DIR = resolve(PACKAGE_ROOT, 'dev/recorder/logs');
const DEFAULT_CDP_PORT = 9222;

const DRAFT_HEADER = [
  '# Lemon Squeezy selector draft — maintainer only. Paste Playwright Inspector locators below.',
  '# Format: fieldKey = getByRole(...)',
  '# Lines starting with # and blank lines are ignored.',
  '# Sign in at app.lemonsqueezy.com first, then use Pick locator in the Inspector.',
];

async function openRecorder(): Promise<void> {
  await appendRecorderLog('ls-open', 'starting open-recorder');
  const profile = profileDirFor('ls');
  await ensureChromeWithCdp({ port: DEFAULT_CDP_PORT, profileDir: profile });
  await ensureDraftTemplate(DRAFT_PATH, LS_DRAFT_FIELDS, DRAFT_HEADER);

  const session = await attachRecorderSession({
    cdpEndpoint: `http://localhost:${DEFAULT_CDP_PORT}`,
    profileHint: PROFILE_PATHS.ls,
    startUrl: LS_DASHBOARD_URL,
    tabUrlPattern: /lemonsqueezy\.com/,
  });

  try {
    process.env.PWDEBUG = '1';
    printInspectorInstructions(
      DRAFT_PATH,
      'pnpm --filter @vybekiit/browser-automation recorder:ls apply',
    );
    await session.page.pause();
  } finally {
    await session.dispose();
    await appendRecorderLog('ls-open', 'session complete');
  }
}

async function applyRecorded(): Promise<void> {
  await appendRecorderLog('ls-apply', 'apply-recorded-selectors');
  await applyDraft({
    draftPath: DRAFT_PATH,
    generatedPath: GENERATED_PATH,
    knownFields: LS_DRAFT_FIELDS,
    render: (entries: Record<string, ParsedEntry>) =>
      renderGenerated(entries, {
        banner: 'LS recorded selectors — maintainer recorder apply.',
        importLine: "import type { SelectorEntry } from '../../../extension/selectors';",
        exportName: 'LS_RECORDED_SELECTORS',
      }),
  });
  await appendRecorderLog('ls-apply', `wrote ${GENERATED_PATH}`);
}

async function probeSelectors(): Promise<void> {
  await appendRecorderLog('ls-probe', 'starting passive href probe');
  const profile = profileDirFor('ls');
  await ensureChromeWithCdp({ port: DEFAULT_CDP_PORT, profileDir: profile });

  const session = await attachRecorderSession({
    cdpEndpoint: `http://localhost:${DEFAULT_CDP_PORT}`,
    profileHint: PROFILE_PATHS.ls,
    startUrl: LS_DASHBOARD_URL,
    tabUrlPattern: /lemonsqueezy\.com/,
  });

  try {
    await session.page.waitForURL(/lemonsqueezy\.com/, { timeout: 15_000 }).catch(() => undefined);
    const report = await runLsProbe(session.page, {
      startUrl: session.page.url().includes('/dashboard') ? session.page.url() : LS_DASHBOARD_URL,
      generatedPath: GENERATED_PATH,
      logDir: LOG_DIR,
    });
    await appendRecorderLog(
      'ls-probe',
      `complete verified=${report.verified.length} missing=${report.missing.join(',') || 'none'}`,
    );
    if (report.missing.length > 0) process.exitCode = 1;
  } finally {
    await session.dispose();
  }
}

async function probeE2e(): Promise<void> {
  if (process.env.PROBE_E2E_ALLOW !== '1') {
    console.log('[ls-probe-e2e] paused — creates four LS products (maintainer-only).');
    console.log(
      '  Set PROBE_E2E_ALLOW=1 to run, or use: recorder:ls probe-e2e cleanup (delete-only).',
    );
    console.log('  Production ls setup uses frozen registry + fallbacks; probe is not required.');
    process.exitCode = 1;
    return;
  }

  const cleanupAfter = process.argv.includes('--cleanup');
  await appendRecorderLog('ls-probe-e2e', cleanupAfter ? 'e2e with cleanup' : 'e2e create');
  const profile = profileDirFor('ls');
  await ensureChromeWithCdp({ port: DEFAULT_CDP_PORT, profileDir: profile });

  const session = await attachRecorderSession({
    cdpEndpoint: `http://localhost:${DEFAULT_CDP_PORT}`,
    profileHint: PROFILE_PATHS.ls,
    startUrl: LS_DASHBOARD_URL,
    tabUrlPattern: /lemonsqueezy\.com/,
  });

  try {
    await session.page.waitForURL(/lemonsqueezy\.com/, { timeout: 15_000 }).catch(() => undefined);
    const report = await runLsProbeE2e(session.page, {
      startUrl: session.page.url().includes('/dashboard') ? session.page.url() : LS_DASHBOARD_URL,
      generatedPath: GENERATED_PATH,
      logDir: LOG_DIR,
      cleanupAfter,
    });
    await appendRecorderLog(
      'ls-probe-e2e',
      `complete verified=${report.verified.length} missing=${report.missing.join(',') || 'none'}`,
    );
    if (report.missing.length > 0) process.exitCode = 1;
  } finally {
    await session.dispose();
  }
}

async function probeE2eCleanup(): Promise<void> {
  await appendRecorderLog('ls-probe-e2e', 'cleanup by prefix');
  const profile = profileDirFor('ls');
  await ensureChromeWithCdp({ port: DEFAULT_CDP_PORT, profileDir: profile });

  const session = await attachRecorderSession({
    cdpEndpoint: `http://localhost:${DEFAULT_CDP_PORT}`,
    profileHint: PROFILE_PATHS.ls,
    startUrl: LS_DASHBOARD_URL,
    tabUrlPattern: /lemonsqueezy\.com/,
  });

  try {
    await runLsProbeE2eCleanup(session.page);
  } finally {
    await session.dispose();
  }
}

const [command, subcommand] = process.argv.slice(2);
if (command === 'open') {
  openRecorder().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else if (command === 'apply') {
  applyRecorded().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else if (command === 'probe') {
  probeSelectors().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else if (command === 'probe-e2e') {
  if (subcommand === 'cleanup') {
    probeE2eCleanup().catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
  } else {
    probeE2e().catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
  }
} else {
  console.log(
    'Usage: recorder:ls open | apply | probe | probe-e2e [--cleanup] | probe-e2e cleanup',
  );
  process.exitCode = 1;
}
