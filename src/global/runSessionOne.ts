import { spawn } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { runCreateApp } from '../commands/createApp';
import { makeExec } from './exec';

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
  readonly claudeOpened: boolean;
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
  readonly openClaude: (appPath: string, prompt: string) => Promise<boolean>;
  readonly resolvePnpm: () => Promise<readonly [string, ...string[]] | null>;
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
export const resolveFirstAppPath = (deps: Pick<SessionOneDeps, 'homeDir' | 'env'>): string => {
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

const defaultIsEmptyDir = async (path: string): Promise<boolean> => {
  try {
    const entries = await readdir(path);
    return entries.length === 0;
  } catch {
    return true;
  }
};

const defaultRunCommand = async (
  cwd: string,
  bin: string,
  args: readonly string[],
): Promise<{ readonly code: number }> =>
  await new Promise((resolve) => {
    const child = spawn(bin, [...args], {
      cwd,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: process.env,
    });
    child.on('error', () => {
      resolve({ code: 127 });
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 1 });
    });
  });

const defaultStartDetached = (cwd: string, bin: string, args: readonly string[]): boolean => {
  try {
    const child = spawn(bin, [...args], {
      cwd,
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
};

/**
 * Open Claude Code in the app folder with the onboarding seed prompt.
 *
 * Prefer a new Terminal window on macOS (works even when install ran via `curl | sh`
 * with a non-TTY stdin). Elsewhere, try a detached `claude` spawn; callers always
 * print a manual fallback.
 *
 * @param appPath - Absolute kit workspace path.
 * @param prompt - Seed user message (onboarding).
 * @param platform - `process.platform`.
 * @returns True when a launch was attempted successfully.
 */
export const openClaudeWithSeed = async (
  appPath: string,
  prompt: string,
  platform: NodeJS.Platform = process.platform,
): Promise<boolean> => {
  if (platform === 'darwin') {
    const shellCommand = `cd ${JSON.stringify(appPath)} && claude ${JSON.stringify(prompt)}`;
    const osa = makeExec('osascript');
    const result = await osa([
      '-e',
      `tell application "Terminal" to do script ${JSON.stringify(shellCommand)}`,
    ]);
    if (result.code === 0) {
      return true;
    }
  }

  try {
    const child = spawn('claude', [prompt], {
      cwd: appPath,
      detached: true,
      stdio: 'ignore',
      env: process.env,
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
};

const defaultResolvePnpm = async (): Promise<readonly [string, ...string[]] | null> => {
  const pnpm = makeExec('pnpm');
  const version = await pnpm(['--version']);
  if (version.code === 0) {
    return ['pnpm'];
  }

  // Prefer corepack so packageManager field is honoured without a global install.
  const corepack = makeExec('corepack');
  const enabled = await corepack(['enable']);
  if (enabled.code === 0) {
    const prepared = await corepack(['prepare', 'pnpm@10.33.2', '--activate']);
    if (prepared.code === 0) {
      const again = await pnpm(['--version']);
      if (again.code === 0) {
        return ['pnpm'];
      }
    }
  }

  const npx = makeExec('npx');
  const npxCheck = await npx(['-y', 'pnpm@10.33.2', '--version']);
  if (npxCheck.code === 0) {
    return ['npx', '-y', 'pnpm@10.33.2'];
  }

  return null;
};

const defaultDeps = (): SessionOneDeps => ({
  createApp: runCreateApp,
  pathExists: defaultPathExists,
  isEmptyDir: defaultIsEmptyDir,
  runCommand: defaultRunCommand,
  startDetached: defaultStartDetached,
  openClaude: (appPath, prompt) => openClaudeWithSeed(appPath, prompt, process.platform),
  resolvePnpm: defaultResolvePnpm,
  homeDir: homedir,
  env: process.env,
  platform: process.platform,
});

/**
 * Build buyer-facing success / partial-success lines for Session #1.
 *
 * @param result - Outcome fields without lines.
 * @returns Ordered stdout lines.
 */
export const formatSessionOneLines = (
  result: Omit<SessionOneResult, 'lines'>,
): readonly string[] => {
  if (result.appPath === null) {
    return [
      '',
      'Session #1: could not create your first app automatically.',
      '  Run:  npx vybekiit create app --web',
      '  Then open that folder in Claude Code and say: "Set up my app."',
      '',
    ];
  }

  const lines: string[] = [
    '',
    result.created
      ? `✅ Your first web app is ready at ${result.appPath}`
      : `✅ Using your app at ${result.appPath}`,
  ];

  if (result.depsInstalled) {
    lines.push('  • Dependencies installed');
  } else {
    lines.push('  • Dependencies still need install — in that folder run:  pnpm install');
  }
  if (result.packagesBuilt) {
    lines.push('  • Kit packages built for local preview');
  } else if (result.depsInstalled) {
    lines.push('  • Kit packages still need a build — in that folder run:  pnpm build:packages');
  }
  if (result.devStarted) {
    lines.push('  • Preview starting at http://localhost:3000');
  } else if (result.depsInstalled && result.packagesBuilt) {
    lines.push('  • Preview not started — in that folder run:  pnpm dev');
  }

  if (result.claudeOpened) {
    lines.push('  • Claude Code opening with: "Set up my app."');
  } else {
    lines.push('  • Open Claude Code in that folder and say: "Set up my app."');
    lines.push(`      cd ${result.appPath} && claude "Set up my app."`);
  }

  lines.push(
    '',
    'Report mode is built in — if something looks wrong, press Option+Shift+R',
    '(Alt+Shift+R on Windows), click it, and tell Claude what is off.',
    '',
  );
  return lines;
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
export const runSessionOne = async (deps: SessionOneDeps = defaultDeps()): Promise<SessionOneResult> => {
  const appPath = resolveFirstAppPath(deps);
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
        claudeOpened: false,
      };
      return {
        ...failed,
        lines: [
          '',
          `Session #1: ${appPath} already exists and is not a VybeKiit app.`,
          '  Pick a free folder and run:  npx vybekiit create app --web ~/my-app',
          '  Or set VYBEKIIT_FIRST_APP_DIR and re-run install once.',
          '',
        ],
      };
    }
  } else {
    process.stdout.write(`\nCreating your first web app at ${appPath}…\n`);
    const code = await deps.createApp(['--web', appPath]);
    if (code !== 0) {
      const failed: Omit<SessionOneResult, 'lines'> = {
        appPath: null,
        created: false,
        depsInstalled: false,
        packagesBuilt: false,
        devStarted: false,
        claudeOpened: false,
      };
      return { ...failed, lines: formatSessionOneLines(failed) };
    }
    created = true;
  }

  const pnpm = await deps.resolvePnpm();
  if (pnpm === null) {
    const partial: Omit<SessionOneResult, 'lines'> = {
      appPath,
      created,
      depsInstalled: false,
      packagesBuilt: false,
      devStarted: false,
      claudeOpened: false,
    };
    const claudeOpened = await deps.openClaude(appPath, SESSION_ONE_SEED_PROMPT);
    return {
      ...partial,
      claudeOpened,
      lines: formatSessionOneLines({ ...partial, claudeOpened }),
    };
  }

  const [pnpmBin, ...pnpmPrefix] = pnpm;

  process.stdout.write('\nInstalling dependencies (this can take a few minutes)…\n');
  const install = await deps.runCommand(appPath, pnpmBin, [...pnpmPrefix, 'install']);
  const depsInstalled = install.code === 0;

  let packagesBuilt = false;
  if (depsInstalled) {
    process.stdout.write('\nBuilding kit packages for preview…\n');
    const build = await deps.runCommand(appPath, pnpmBin, [...pnpmPrefix, 'build:packages']);
    packagesBuilt = build.code === 0;
  }

  let devStarted = false;
  if (depsInstalled && packagesBuilt) {
    devStarted = deps.startDetached(appPath, pnpmBin, [...pnpmPrefix, 'dev']);
  }

  const claudeOpened = await deps.openClaude(appPath, SESSION_ONE_SEED_PROMPT);

  const outcome: Omit<SessionOneResult, 'lines'> = {
    appPath,
    created,
    depsInstalled,
    packagesBuilt,
    devStarted,
    claudeOpened,
  };
  return { ...outcome, lines: formatSessionOneLines(outcome) };
};
