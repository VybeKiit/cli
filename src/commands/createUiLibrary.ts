import { spawn } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import open from 'open';
import { openClaudeWithSeed, type SessionOneDeps } from '../global/runSessionOne';
import { runCreateApp } from './createApp';

/** Default folder under home for the UI-library kit workspace. */
export const DEFAULT_UI_LIBRARY_DIR_NAME = 'vybekiit-ui-library';

/** Public component gallery (browse). Local kit files power MCP pull/use. */
export const UI_LIBRARY_GALLERY_URL = 'https://ui.vybekiit.com';

/**
 * Seed prompt for Claude after `create --ui-library`.
 * Points the agent at the local kit catalog + report mode, not a random folder.
 */
export const UI_LIBRARY_SEED_PROMPT = `I opened my VybeKiit UI library workspace.

Work ONLY in this folder (the kit workspace). Do not claim the UI library is missing.

1. Confirm packages/ui (@vybekiit/ui) and templates/web/.vybekiit/agent/ui-catalog-index.json exist.
2. Use the vybekiit MCP UI tools (list_ui_sources, search, get_component, suggest_ui_blend).
3. Tell me how many sources/components the catalog has, then help me pick and use components.
4. Report mode is built in — Option+Shift+R (Alt+Shift+R on Windows) for point-and-fix.

Speak plain language. One step at a time.`;

/** Parsed inputs for the UI-library create path. */
export type CreateUiLibraryInputs = {
  readonly destPath: string;
  readonly openGallery: boolean;
  readonly skipClaude: boolean;
  readonly skipDev: boolean;
};

/** Outcome of {@link runCreateUiLibrary}. */
export type CreateUiLibraryResult = {
  readonly exitCode: number;
  readonly appPath: string | null;
  readonly created: boolean;
  readonly depsInstalled: boolean;
  readonly packagesBuilt: boolean;
  readonly devStarted: boolean;
  readonly galleryOpened: boolean;
  readonly claudeOpened: boolean;
  readonly lines: readonly string[];
};

/** Injectable seams for tests. */
export type CreateUiLibraryDeps = {
  readonly createApp: (args: readonly string[]) => Promise<number>;
  readonly pathExists: (path: string) => Promise<boolean>;
  readonly isEmptyDir: (path: string) => Promise<boolean>;
  readonly runCommand: SessionOneDeps['runCommand'];
  readonly startDetached: SessionOneDeps['startDetached'];
  readonly openClaude: (appPath: string, prompt: string) => Promise<boolean>;
  readonly openUrl: (url: string) => Promise<boolean>;
  readonly pnpmCommand: SessionOneDeps['pnpmCommand'];
  readonly homeDir: () => string;
  readonly env: NodeJS.ProcessEnv;
  readonly platform: NodeJS.Platform;
  readonly cwd: () => string;
};

/**
 * True when argv (after `create`) requests the UI-library path.
 *
 * Accepts:
 * - `--ui-library` / `ui-library` as the first token (subcommand form)
 * - `app --ui-library` / `app ui-library`
 *
 * @param args - Args after the `create` verb (includes subcommand when present).
 * @example
 * isUiLibraryCreateArgs(['--ui-library']); // true
 * isUiLibraryCreateArgs(['app', '--web']); // false
 */
export const isUiLibraryCreateArgs = (args: readonly string[]): boolean => {
  if (args.length === 0) {
    return false;
  }
  const first = args[0];
  if (first === '--ui-library' || first === 'ui-library') {
    return true;
  }
  if (first === 'app') {
    return args.includes('--ui-library') || args.includes('ui-library');
  }
  return false;
};

/**
 * Parse destination + flags for `create --ui-library`.
 *
 * @param args - Args after the `create` verb.
 * @param deps - Home/env/cwd for default path resolution.
 * @returns Parsed inputs.
 * @example
 * parseCreateUiLibraryArgs(['--ui-library', './lib'], deps);
 */
export const parseCreateUiLibraryArgs = (
  args: readonly string[],
  deps: Pick<CreateUiLibraryDeps, 'homeDir' | 'env' | 'cwd'>,
): CreateUiLibraryInputs => {
  const openGallery = !args.includes('--no-gallery');
  const skipClaude = args.includes('--skip-claude');
  const skipDev = args.includes('--skip-dev');

  const positionals = args.filter((arg) => {
    if (arg.startsWith('-')) {
      return false;
    }
    if (arg === 'app' || arg === 'ui-library') {
      return false;
    }
    return true;
  });

  const explicit = positionals[0];
  if (explicit !== undefined && explicit !== '') {
    const destPath =
      explicit.startsWith('/') || /^[A-Za-z]:[\\/]/.test(explicit)
        ? explicit
        : resolve(deps.cwd(), explicit);
    return { destPath, openGallery, skipClaude, skipDev };
  }

  const override = deps.env.VYBEKIIT_UI_LIBRARY_DIR?.trim();
  if (override !== undefined && override !== '') {
    const destPath =
      override.startsWith('/') || /^[A-Za-z]:[\\/]/.test(override)
        ? override
        : join(deps.homeDir(), override);
    return { destPath, openGallery, skipClaude, skipDev };
  }

  return {
    destPath: join(deps.homeDir(), DEFAULT_UI_LIBRARY_DIR_NAME),
    openGallery,
    skipClaude,
    skipDev,
  };
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
  await new Promise((resolvePromise) => {
    const child = spawn(bin, [...args], {
      cwd,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: process.env,
    });
    child.on('error', () => {
      resolvePromise({ code: 127 });
    });
    child.on('close', (code) => {
      resolvePromise({ code: code ?? 1 });
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

const defaultOpenUrl = async (url: string): Promise<boolean> => {
  try {
    await open(url);
    return true;
  } catch {
    return false;
  }
};

const defaultPnpmCommand = async (): Promise<readonly [string, ...string[]] | null> => {
  const tryBin = async (bin: string, checkArgs: readonly string[]): Promise<boolean> => {
    const result = await defaultRunCommand(process.cwd(), bin, [...checkArgs]);
    return result.code === 0;
  };

  if (await tryBin('pnpm', ['--version'])) {
    return ['pnpm'];
  }
  if (await tryBin('npx', ['-y', 'pnpm@10.33.2', '--version'])) {
    return ['npx', '-y', 'pnpm@10.33.2'];
  }
  return null;
};

const defaultDeps = (): CreateUiLibraryDeps => ({
  createApp: runCreateApp,
  pathExists: defaultPathExists,
  isEmptyDir: defaultIsEmptyDir,
  runCommand: defaultRunCommand,
  startDetached: defaultStartDetached,
  openClaude: (appPath, prompt) => openClaudeWithSeed(appPath, prompt, process.platform),
  openUrl: defaultOpenUrl,
  pnpmCommand: defaultPnpmCommand,
  homeDir: homedir,
  env: process.env,
  platform: process.platform,
  cwd: () => process.cwd(),
});

/**
 * Format buyer-facing outcome lines for `create --ui-library`.
 *
 * @param result - Partial result without lines.
 * @returns Lines to print.
 */
export const formatCreateUiLibraryLines = (
  result: Omit<CreateUiLibraryResult, 'lines' | 'exitCode'> & { readonly exitCode?: number },
): readonly string[] => {
  const lines: string[] = [
    '',
    result.exitCode === 1 ? 'UI library needs attention:' : 'UI library ready:',
  ];
  if (result.appPath === null) {
    lines.push('  • Could not create or open a kit workspace.');
    lines.push('  • Accept the GitHub invite, run:  gh auth login --web');
    lines.push('  • Then:  npx -y vybekiit@latest create --ui-library');
    lines.push('');
    return lines;
  }

  lines.push(`  • Kit workspace: ${result.appPath}`);
  if (result.created) {
    lines.push('  • Created a new web kit with @vybekiit/ui + mirrored components');
  } else {
    lines.push('  • Reused existing kit workspace');
  }
  if (result.depsInstalled) {
    lines.push('  • Dependencies installed');
  } else {
    lines.push('  • Install deps next:  cd that folder && pnpm install');
  }
  if (result.packagesBuilt) {
    lines.push('  • Kit packages built');
  } else if (result.depsInstalled) {
    lines.push('  • Build packages:  pnpm build:packages');
  }
  if (result.devStarted) {
    lines.push('  • Local app preview starting (http://localhost:3000)');
  }
  if (result.galleryOpened) {
    lines.push(`  • UI gallery opened: ${UI_LIBRARY_GALLERY_URL}`);
  } else {
    lines.push(`  • Browse the gallery:  ${UI_LIBRARY_GALLERY_URL}`);
  }
  lines.push('  • Report mode: Option+Shift+R (Alt+Shift+R on Windows)');
  if (result.claudeOpened) {
    lines.push('  • Claude Code opening in the kit folder with UI-library instructions');
  } else {
    lines.push(
      `  • Open Claude in that folder:  cd ${result.appPath} && claude ${JSON.stringify(UI_LIBRARY_SEED_PROMPT.slice(0, 40))}…`,
    );
  }
  lines.push(
    '',
    'Claude must work inside this folder — that is where MCP UI search and @vybekiit/ui live.',
    '',
  );
  return lines;
};

/**
 * Create (or reuse) a web kit workspace, open the UI gallery, start preview + Claude.
 *
 * This is the buyer path for “I want the entire UI library now” after purchase + invite.
 * Global `update` alone never ships component sources; this command does via kit clone.
 *
 * @param args - Args after the `create` verb.
 * @param deps - Injectable seams.
 * @returns Result + exit code (0 on success path, 1 when create fails hard).
 * @example
 * const result = await runCreateUiLibrary(['--ui-library']);
 */
export const runCreateUiLibrary = async (
  args: readonly string[] = [],
  deps: CreateUiLibraryDeps = defaultDeps(),
): Promise<CreateUiLibraryResult> => {
  const inputs = parseCreateUiLibraryArgs(args, deps);
  const appPath = inputs.destPath;

  const exists = await deps.pathExists(appPath);
  const empty = exists ? await deps.isEmptyDir(appPath) : true;

  let created = false;

  if (exists && !empty) {
    const looksLikeKit = await deps.pathExists(join(appPath, 'templates', 'web'));
    if (!looksLikeKit) {
      const failed: Omit<CreateUiLibraryResult, 'lines'> = {
        exitCode: 1,
        appPath: null,
        created: false,
        depsInstalled: false,
        packagesBuilt: false,
        devStarted: false,
        galleryOpened: false,
        claudeOpened: false,
      };
      return {
        ...failed,
        lines: [
          '',
          `${appPath} already exists and is not a VybeKiit kit workspace.`,
          '  Pick a free folder:  npx -y vybekiit@latest create --ui-library ~/my-ui-kit',
          '  Or set VYBEKIIT_UI_LIBRARY_DIR and re-run.',
          '',
        ],
      };
    }
  } else {
    process.stdout.write(`\nCreating UI library kit workspace at ${appPath}…\n`);
    const code = await deps.createApp(['--web', appPath]);
    if (code !== 0) {
      const failed: Omit<CreateUiLibraryResult, 'lines'> = {
        exitCode: 1,
        appPath: null,
        created: false,
        depsInstalled: false,
        packagesBuilt: false,
        devStarted: false,
        galleryOpened: false,
        claudeOpened: false,
      };
      return { ...failed, lines: formatCreateUiLibraryLines(failed) };
    }
    created = true;
  }

  const pnpm = await deps.pnpmCommand();
  let depsInstalled = false;
  let packagesBuilt = false;
  let devStarted = false;

  if (pnpm !== null) {
    const [pnpmBin, ...pnpmPrefix] = pnpm;
    process.stdout.write('\nInstalling dependencies (this can take a few minutes)…\n');
    const install = await deps.runCommand(appPath, pnpmBin, [...pnpmPrefix, 'install']);
    depsInstalled = install.code === 0;

    if (depsInstalled) {
      process.stdout.write('\nBuilding kit packages…\n');
      const build = await deps.runCommand(appPath, pnpmBin, [...pnpmPrefix, 'build:packages']);
      packagesBuilt = build.code === 0;
    }

    if (!inputs.skipDev && depsInstalled && packagesBuilt) {
      devStarted = deps.startDetached(appPath, pnpmBin, [...pnpmPrefix, 'dev']);
    }
  }

  let galleryOpened = false;
  if (inputs.openGallery) {
    process.stdout.write(`\nOpening UI gallery: ${UI_LIBRARY_GALLERY_URL}\n`);
    galleryOpened = await deps.openUrl(UI_LIBRARY_GALLERY_URL);
  }

  let claudeOpened = false;
  if (!inputs.skipClaude) {
    claudeOpened = await deps.openClaude(appPath, UI_LIBRARY_SEED_PROMPT);
  }

  const outcome: Omit<CreateUiLibraryResult, 'lines'> = {
    exitCode: depsInstalled && packagesBuilt ? 0 : 1,
    appPath,
    created,
    depsInstalled,
    packagesBuilt,
    devStarted,
    galleryOpened,
    claudeOpened,
  };
  return { ...outcome, lines: formatCreateUiLibraryLines(outcome) };
};

/**
 * CLI entry: write lines and return exit code.
 *
 * @param args - Args after the `create` verb.
 * @returns Process exit code.
 */
export const runCreateUiLibraryCommand = async (args: readonly string[]): Promise<number> => {
  const result = await runCreateUiLibrary(args);
  for (const line of result.lines) {
    process.stdout.write(`${line}\n`);
  }
  return result.exitCode;
};
