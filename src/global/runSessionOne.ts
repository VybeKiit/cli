import { randomUUID } from 'node:crypto';
import { access, readdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { Effect } from 'effect';
import open from 'open';
import { runCreateApp } from '../commands/createApp';
import {
  parseSetupPreferences,
  type SetupPreferences,
  setupEnvironment,
} from '../commands/setupPreferences';
import { writeEnvKeys } from '../doctor/env';
import { findPnpmCommand, runAppCommand, startDetachedCommand } from '../lib/appProcesses';
import { shipFirstPartyMcpConfigs } from '../lib/firstPartyMcp';
import { type LocatedKitWorkspace, locateKitWorkspace } from '../lib/kitWorkspaceSource';
import { pathExists } from '../lib/pathExists';
import { repairKitBuildRoots } from '../lib/scaffoldKitWorkspace';
import { setupLogPath } from '../lib/setupLog';
import { choosePreviewPort } from './previewPort';

/** Default folder name under the home directory for the first web app. */
export const DEFAULT_FIRST_APP_DIR_NAME = 'vybekiit-app';

/** Seed prompt that loads the buyer onboarding skill in Claude Code. */
export const SESSION_ONE_SEED_PROMPT = 'Set up my app.';

/** What Session #1 did, for reporting and install-state stamping. */
export type SessionOneResult = {
  /** Absolute app path when create/reuse succeeded; null when aborted. */
  readonly appPath: string | null;
  /** True when this run scaffolded a new kit workspace. */
  readonly created: boolean;
  readonly depsInstalled: boolean;
  readonly packagesBuilt: boolean;
  readonly devStarted: boolean;
  readonly projectToolsReady: boolean;
  /** True when the generated welcome route returned a successful response. */
  readonly previewReady: boolean;
  readonly browserOpened: boolean;
  readonly welcomeUrl?: string;
  /** Buyer-facing lines to print after the global-install banner. */
  readonly lines: readonly string[];
};

/** Injectable seams for unit tests (defaults talk to the real filesystem and PATH). */
export type SessionOneDeps = {
  readonly createApp: (args: readonly string[]) => Promise<number>;
  readonly pathExists: (path: string) => Promise<boolean>;
  readonly isEmptyDir: (path: string) => Promise<boolean>;
  readonly runCommand: (
    cwd: string,
    bin: string,
    args: readonly string[],
  ) => Promise<{ readonly code: number }>;
  readonly startDetached: (cwd: string, bin: string, args: readonly string[]) => boolean;
  readonly waitForPreview: (url: string, previewIdentity?: string) => Promise<boolean>;
  readonly previewPort: () => Promise<number>;
  readonly previewIdentity: string;
  readonly openBrowser: (url: string) => Promise<boolean>;
  readonly prepareProjectTools: (appPath: string) => Promise<boolean>;
  readonly writeSetupEnvironment: (appPath: string, values: Record<string, string>) => void;
  readonly pnpmCommand: () => Promise<readonly [string, ...string[]] | null>;
  readonly homeDir: () => string;
  readonly env: NodeJS.ProcessEnv;
  readonly platform: NodeJS.Platform;
};

/**
 * Whether CLI args request skipping Session #1 (first app + Claude handoff).
 *
 * @param args - Raw CLI args after the command name.
 * @returns True when Session #1 must not run.
 */
export const shouldSkipSessionOne = (
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): boolean => {
  if (args.includes('--skip-session-one') || args.includes('--skip-first-app')) {
    return true;
  }
  const flag = env.VYBEKIIT_SKIP_SESSION_ONE;
  return flag === '1' || flag === 'true' || flag === 'yes';
};

/**
 * Resolve the absolute path for the first-run web app.
 *
 * Honour `VYBEKIIT_FIRST_APP_DIR` when set; otherwise `~/vybekiit-app`.
 *
 * @param deps - Home + env injection.
 * @returns Absolute destination directory.
 */
export const firstAppPath = (deps: Pick<SessionOneDeps, 'homeDir' | 'env'>): string => {
  const override = deps.env.VYBEKIIT_FIRST_APP_DIR?.trim();
  if (override !== undefined && override !== '') {
    return override.startsWith('/') || /^[A-Za-z]:[\\/]/.test(override)
      ? override
      : join(deps.homeDir(), override);
  }
  return join(deps.homeDir(), DEFAULT_FIRST_APP_DIR_NAME);
};

const defaultPathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const BUYER_BUILD_ROOTS = [
  join('scripts', 'lib', 'tsupWorkspaceAliases.mjs'),
  'tsup.base.ts',
  join('templates', 'web', 'app', '[locale]', 'setup', 'page.tsx'),
] as const;
const LEGACY_CLIENT_STATE_ALIAS = '"@vybekiit/client-state"';
const SETUP_TITLE_MESSAGE = '"setup.title"';

export type ProjectBuildRootRepairDeps = {
  readonly pathExists: (path: string) => Promise<boolean>;
  readonly readText: (path: string) => Promise<string>;
  readonly locateKit: () => Promise<LocatedKitWorkspace>;
  readonly repairFromKit: (kitRoot: string, appPath: string) => Promise<void>;
};

/** Restore setup support omitted by an older kit delivery without replacing buyer code. */
export const repairProjectBuildRoots = async (
  appPath: string,
  deps: ProjectBuildRootRepairDeps = {
    pathExists,
    readText: async (path) => await readFile(path, 'utf8'),
    locateKit: locateKitWorkspace,
    repairFromKit: repairKitBuildRoots,
  },
): Promise<boolean> => {
  const buildRootsReady = async (): Promise<boolean> => {
    const checks = await Promise.all(
      BUYER_BUILD_ROOTS.map((relativePath) => deps.pathExists(join(appPath, relativePath))),
    );
    if (!checks.every(Boolean)) {
      return false;
    }

    try {
      const [baseTsconfig, englishMessages] = await Promise.all([
        deps.readText(join(appPath, 'tsconfig.base.json')),
        deps.readText(join(appPath, 'templates', 'web', 'messages', 'en.json')),
      ]);
      return (
        !baseTsconfig.includes(LEGACY_CLIENT_STATE_ALIAS) &&
        englishMessages.includes(SETUP_TITLE_MESSAGE)
      );
    } catch {
      return false;
    }
  };

  if (await buildRootsReady()) {
    return true;
  }

  let source: LocatedKitWorkspace | undefined;
  try {
    source = await deps.locateKit();
    await deps.repairFromKit(source.kitRoot, appPath);
    return await buildRootsReady();
  } catch {
    return false;
  } finally {
    await source?.cleanup?.();
  }
};

const defaultIsEmptyDir = async (path: string): Promise<boolean> => {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch {
    return true;
  }
};

const wait = async (milliseconds: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, milliseconds));

export const waitForPreview = async (url: string, previewIdentity?: string): Promise<boolean> => {
  const attemptPreview = async (remainingAttempts: number): Promise<boolean> => {
    try {
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(2000) });
      const previewHtml = await response.text();
      if (
        response.ok &&
        (previewIdentity === undefined ||
          previewHtml.includes(`data-vybekiit-preview="${previewIdentity}"`))
      ) {
        return true;
      }
    } catch {
      // The preview process is still starting. Retry within the bounded window.
    }
    if (remainingAttempts <= 1) {
      return false;
    }
    await wait(500);
    return await attemptPreview(remainingAttempts - 1);
  };

  return await attemptPreview(60);
};

/** Whether this process has a desktop browser bridge it can open honestly. */
export const canOpenDesktopBrowser = (
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
): boolean => {
  if (env.CI === '1' || env.CI === 'true') {
    return false;
  }
  if (platform !== 'linux') {
    return true;
  }
  return Boolean(env.DISPLAY || env.WAYLAND_DISPLAY || env.WSL_DISTRO_NAME);
};

const defaultOpenBrowser = async (url: string): Promise<boolean> => {
  if (!canOpenDesktopBrowser()) {
    return false;
  }
  try {
    await open(url);
    return true;
  } catch {
    return false;
  }
};

/** Local welcome URL opened only after the generated preview responds. */
export const sessionOneWelcomeUrl = (preferences: SetupPreferences, port = 3000): string => {
  const query = new URLSearchParams({
    hosting: preferences.hosting,
    data: preferences.data,
    googleSignIn: String(preferences.googleSignIn),
  });
  return `http://localhost:${port}/en/setup?${query.toString()}`;
};

const defaultDeps = (): SessionOneDeps => ({
  createApp: runCreateApp,
  pathExists: defaultPathExists,
  isEmptyDir: defaultIsEmptyDir,
  runCommand: runAppCommand,
  startDetached: startDetachedCommand,
  waitForPreview,
  previewPort: () => Effect.runPromise(choosePreviewPort),
  previewIdentity: randomUUID(),
  openBrowser: defaultOpenBrowser,
  prepareProjectTools: async (appPath) => {
    try {
      const buildRootsReady = await repairProjectBuildRoots(appPath);
      const writtenConfigs = await shipFirstPartyMcpConfigs({ dest: appPath, template: 'web' });
      return buildRootsReady && writtenConfigs.length === 2;
    } catch {
      return false;
    }
  },
  writeSetupEnvironment: (appPath, values) =>
    writeEnvKeys(join(appPath, 'templates', 'web'), values),
  pnpmCommand: findPnpmCommand,
  homeDir: homedir,
  env: process.env,
  platform: process.platform,
});

const RERUN_SETUP = 'Run npx vybekiit setup again.';

const previewLines = (outcome: Omit<SessionOneResult, 'lines'>): readonly string[] => {
  const welcomeUrl = outcome.welcomeUrl || 'http://localhost:3000/en/setup';
  if (outcome.browserOpened) {
    return [`  ✓ Welcome page opened in your browser: ${welcomeUrl}`];
  }
  if (outcome.previewReady) {
    return [`  ✓ Welcome page verified. Open ${welcomeUrl} in your browser.`];
  }
  if (outcome.devStarted) {
    return [`  ✗ The preview did not pass its readiness check. ${RERUN_SETUP}`];
  }
  return [];
};

const preparationLines = (outcome: Omit<SessionOneResult, 'lines'>): readonly string[] => {
  const logHint = `Details are in ${setupLogPath()}. ${RERUN_SETUP}`;
  const preparationChecks = [
    { failed: !outcome.depsInstalled, line: `  ✗ The app packages did not install. ${logHint}` },
    {
      failed: outcome.depsInstalled && !outcome.packagesBuilt,
      line: `  ✗ The app could not be prepared for preview. ${logHint}`,
    },
    {
      failed: !outcome.projectToolsReady,
      line: `  ✗ Project tools still need repair. ${RERUN_SETUP}`,
    },
  ];
  return preparationChecks.filter(({ failed }) => failed).map(({ line }) => line);
};

const projectToolsLines = (ready: boolean): readonly string[] =>
  ready
    ? [
        '  ✓ @vybekiit/ui and the UI catalog are ready for your assistant',
        '  ✓ VybeKiit tools, browser automation, and matching project skills are connected',
      ]
    : [];

/**
 * Build buyer-facing success / partial-success lines for Session #1.
 *
 * @param outcome - Outcome fields without lines.
 * @returns Ordered stdout lines.
 */
export const formatSessionOneLines = (
  outcome: Omit<SessionOneResult, 'lines'>,
): readonly string[] => {
  if (outcome.appPath === null) {
    return [
      '',
      'Could not create your first app automatically.',
      '  Run: npx vybekiit create app --web',
      '',
    ];
  }

  const headline = outcome.previewReady
    ? `✓ Your app preview is ready at ${outcome.appPath}`
    : `Your app needs attention at ${outcome.appPath}`;
  return [
    '',
    headline,
    ...preparationLines(outcome),
    ...projectToolsLines(outcome.projectToolsReady),
    ...previewLines(outcome),
    '',
    'Report mode is built in. If something looks wrong, press Option+Shift+R',
    '(Alt+Shift+R on Windows), click it, and tell your assistant what is off.',
    '',
  ];
};

/**
 * Session #1 after a first successful global install:
 * create a web kit workspace (once), install deps, build packages, start dev,
 * open Claude Code with the onboarding seed prompt.
 *
 * Safe to call only on true first install (`previous === null`). Never clobbers
 * a non-empty existing directory at the target path.
 *
 * @param deps - Injectable dependencies (defaults to real IO).
 * @returns Outcome + lines for stdout.
 * @example
 * const result = await runSessionOne();
 */
export const runSessionOne = async (
  deps: SessionOneDeps = defaultDeps(),
  preferences: SetupPreferences = parseSetupPreferences([]),
): Promise<SessionOneResult> => {
  const appPath = firstAppPath(deps);
  const exists = await deps.pathExists(appPath);
  const empty = exists ? await deps.isEmptyDir(appPath) : true;

  let created = false;

  if (exists && !empty) {
    // Adopt only when it already looks like a kit workspace (has templates/web).
    const looksLikeKit = await deps.pathExists(join(appPath, 'templates', 'web'));
    if (!looksLikeKit) {
      const failed: Omit<SessionOneResult, 'lines'> = {
        appPath: null,
        created: false,
        depsInstalled: false,
        packagesBuilt: false,
        devStarted: false,
        projectToolsReady: false,
        previewReady: false,
        browserOpened: false,
      };
      return {
        ...failed,
        lines: [
          '',
          `${appPath} already exists and is not a VybeKiit app.`,
          '  Pick a free folder and run: npx vybekiit create app --web ~/my-app',
          '  Or set VYBEKIIT_FIRST_APP_DIR and run setup again.',
          '',
        ],
      };
    }
  } else {
    process.stdout.write(`\nCreating your app at ${appPath}...\n`);
    const code = await deps.createApp(['--web', appPath]);
    if (code !== 0) {
      const failed: Omit<SessionOneResult, 'lines'> = {
        appPath: null,
        created: false,
        depsInstalled: false,
        packagesBuilt: false,
        devStarted: false,
        projectToolsReady: false,
        previewReady: false,
        browserOpened: false,
      };
      return { ...failed, lines: formatSessionOneLines(failed) };
    }
    created = true;
  }

  const pnpm = await deps.pnpmCommand();
  if (pnpm === null) {
    const partial: Omit<SessionOneResult, 'lines'> = {
      appPath,
      created,
      depsInstalled: false,
      packagesBuilt: false,
      devStarted: false,
      projectToolsReady: false,
      previewReady: false,
      browserOpened: false,
    };
    return {
      ...partial,
      lines: formatSessionOneLines(partial),
    };
  }

  const [pnpmBin, ...pnpmPrefix] = pnpm;
  const projectToolsReady = await deps.prepareProjectTools(appPath);
  deps.writeSetupEnvironment(appPath, {
    ...setupEnvironment(preferences),
    VYBE_ASSISTANT: 'claude',
    VYBE_REPORT_MODE: '1',
    VYBE_SETUP_PREVIEW_ID: deps.previewIdentity,
  });

  process.stdout.write('\nInstalling your app packages. This can take a few minutes...\n');
  const install = await deps.runCommand(appPath, pnpmBin, [...pnpmPrefix, 'install']);
  const depsInstalled = install.code === 0;

  let packagesBuilt = false;
  if (depsInstalled) {
    process.stdout.write('Preparing your app preview...\n');
    const build = await deps.runCommand(appPath, pnpmBin, [...pnpmPrefix, 'build:packages']);
    packagesBuilt = build.code === 0;
  }

  const previewPort = await deps.previewPort();
  let devStarted = false;
  if (depsInstalled && packagesBuilt && projectToolsReady) {
    devStarted = deps.startDetached(appPath, pnpmBin, [
      ...pnpmPrefix,
      'dev',
      '--port',
      String(previewPort),
    ]);
  }

  const welcomeUrl = sessionOneWelcomeUrl(preferences, previewPort);
  const previewReady =
    devStarted && projectToolsReady
      ? await deps.waitForPreview(welcomeUrl, deps.previewIdentity)
      : false;
  const desktopHandoffReady = previewReady && canOpenDesktopBrowser(deps.platform, deps.env);
  const browserOpened = desktopHandoffReady ? await deps.openBrowser(welcomeUrl) : false;

  const outcome: Omit<SessionOneResult, 'lines'> = {
    appPath,
    created,
    depsInstalled,
    packagesBuilt,
    devStarted,
    projectToolsReady,
    previewReady,
    browserOpened,
    welcomeUrl,
  };
  return { ...outcome, lines: formatSessionOneLines(outcome) };
};
