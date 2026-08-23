import { describe, expect, it, vi } from 'vitest';
import {
  canOpenDesktopBrowser,
  claudeTerminalCommand,
  DEFAULT_FIRST_APP_DIR_NAME,
  firstAppPath,
  formatSessionOneLines,
  repairProjectBuildRoots,
  runSessionOne,
  SESSION_ONE_SEED_PROMPT,
  type SessionOneDeps,
  sessionOneWelcomeUrl,
  shouldSkipSessionOne,
} from '../../src/global/runSessionOne';

const baseDeps = (overrides: Partial<SessionOneDeps> = {}): SessionOneDeps => ({
  createApp: vi.fn(async () => 0),
  pathExists: vi.fn(async () => false),
  isEmptyDir: vi.fn(async () => true),
  runCommand: vi.fn(async () => ({ code: 0 })),
  startDetached: vi.fn(() => true),
  openClaude: vi.fn(async () => true),
  waitForPreview: vi.fn(async () => true),
  openBrowser: vi.fn(async () => true),
  prepareProjectTools: vi.fn(async () => true),
  writeSetupEnvironment: vi.fn(() => undefined),
  pnpmCommand: vi.fn(async () => ['pnpm'] as const),
  homeDir: () => '/Users/me',
  env: {},
  platform: 'darwin',
  ...overrides,
});

const DEFAULT_WELCOME_URL = sessionOneWelcomeUrl({
  data: 'supabase',
  googleSignIn: false,
  hosting: 'cloudflare',
});

describe('shouldSkipSessionOne', () => {
  it('skips on flags and env', () => {
    expect(shouldSkipSessionOne(['--skip-session-one'], {})).toBe(true);
    expect(shouldSkipSessionOne(['--skip-first-app'], {})).toBe(true);
    expect(shouldSkipSessionOne([], { VYBEKIIT_SKIP_SESSION_ONE: '1' })).toBe(true);
    expect(shouldSkipSessionOne([], {})).toBe(false);
  });
});

describe('firstAppPath', () => {
  it('defaults to ~/vybekiit-app', () => {
    expect(firstAppPath({ homeDir: () => '/Users/me', env: {} })).toBe(
      `/Users/me/${DEFAULT_FIRST_APP_DIR_NAME}`,
    );
  });

  it('honours absolute and relative VYBEKIIT_FIRST_APP_DIR', () => {
    expect(
      firstAppPath({
        homeDir: () => '/Users/me',
        env: { VYBEKIIT_FIRST_APP_DIR: '/tmp/app' },
      }),
    ).toBe('/tmp/app');
    expect(
      firstAppPath({
        homeDir: () => '/Users/me',
        env: { VYBEKIIT_FIRST_APP_DIR: 'projects/shop' },
      }),
    ).toBe('/Users/me/projects/shop');
  });
});

describe('canOpenDesktopBrowser', () => {
  it('keeps browser opening enabled on desktop macOS and Windows', () => {
    expect(canOpenDesktopBrowser('darwin', {})).toBe(true);
    expect(canOpenDesktopBrowser('win32', {})).toBe(true);
  });

  it('does not claim it can open a browser in a headless Linux container', () => {
    expect(canOpenDesktopBrowser('linux', {})).toBe(false);
    expect(canOpenDesktopBrowser('linux', { CI: 'true', DISPLAY: ':99' })).toBe(false);
  });

  it('allows Linux desktops and WSL to use their browser bridges', () => {
    expect(canOpenDesktopBrowser('linux', { DISPLAY: ':0' })).toBe(true);
    expect(canOpenDesktopBrowser('linux', { WAYLAND_DISPLAY: 'wayland-0' })).toBe(true);
    expect(canOpenDesktopBrowser('linux', { WSL_DISTRO_NAME: 'Ubuntu' })).toBe(true);
  });
});

describe('claudeTerminalCommand', () => {
  it('keeps the macOS Terminal tab open after Claude finishes', () => {
    const command = claudeTerminalCommand('/Users/me/vybekiit-app', SESSION_ONE_SEED_PROMPT);

    expect(command).toContain('claude "Set up my app."');
    expect(command).toContain('exec "${SHELL:-/bin/zsh}" -l');
  });
});

describe('repairProjectBuildRoots', () => {
  it('restores missing buyer build roots from the current kit', async () => {
    const repairFromKit = vi.fn(async () => undefined);
    const pathExists = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    const readText = vi.fn(async (path: string) =>
      path.endsWith('tsconfig.base.json') ? '"@vybekiit/client-state"' : '"setup.title"',
    );
    const locateKit = vi.fn(async () => ({ kitRoot: '/tmp/current-kit' }));

    await expect(
      repairProjectBuildRoots('/Users/me/vybekiit-app', {
        locateKit,
        pathExists,
        readText,
        repairFromKit,
      }),
    ).resolves.toBe(true);

    expect(repairFromKit).toHaveBeenCalledOnce();
    expect(readText).toHaveBeenCalledTimes(2);
  });

  it('restores stale buyer build roots from the current kit and cleans up the source', async () => {
    const cleanup = vi.fn(async () => undefined);
    const repairFromKit = vi.fn(async () => undefined);
    const pathExists = vi.fn(async () => true);
    let tsconfigReads = 0;
    const readText = vi.fn((path: string) => {
      if (path.endsWith('messages/en.json')) {
        return Promise.resolve('"setup.title"');
      }
      tsconfigReads += 1;
      const tsconfigText =
        tsconfigReads === 1
          ? JSON.stringify({ compilerOptions: { paths: {} } })
          : '"@vybekiit/client-state"';
      return Promise.resolve(tsconfigText);
    });
    const locateKit = vi.fn(async () => ({ kitRoot: '/tmp/current-kit', cleanup }));

    await expect(
      repairProjectBuildRoots('/Users/me/vybekiit-app', {
        locateKit,
        pathExists,
        readText,
        repairFromKit,
      }),
    ).resolves.toBe(true);

    expect(locateKit).toHaveBeenCalledOnce();
    expect(repairFromKit).toHaveBeenCalledWith('/tmp/current-kit', '/Users/me/vybekiit-app');
    expect(pathExists).toHaveBeenCalledWith(
      '/Users/me/vybekiit-app/scripts/lib/tsupWorkspaceAliases.mjs',
    );
    expect(pathExists).toHaveBeenCalledWith('/Users/me/vybekiit-app/tsup.base.ts');
    expect(pathExists).toHaveBeenCalledWith(
      '/Users/me/vybekiit-app/templates/web/app/[locale]/setup/page.tsx',
    );
    expect(readText).toHaveBeenCalledWith('/Users/me/vybekiit-app/tsconfig.base.json');
    expect(readText).toHaveBeenCalledWith('/Users/me/vybekiit-app/templates/web/messages/en.json');
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('restores a missing welcome route even when buyer build roots are current', async () => {
    const repairFromKit = vi.fn(async () => undefined);
    const pathExists = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    const readText = vi.fn(async (path: string) =>
      path.endsWith('tsconfig.base.json') ? '"@vybekiit/client-state"' : '"setup.title"',
    );

    await expect(
      repairProjectBuildRoots('/Users/me/vybekiit-app', {
        locateKit: vi.fn(async () => ({ kitRoot: '/tmp/current-kit' })),
        pathExists,
        readText,
        repairFromKit,
      }),
    ).resolves.toBe(true);

    expect(repairFromKit).toHaveBeenCalledWith('/tmp/current-kit', '/Users/me/vybekiit-app');
    expect(readText).toHaveBeenCalledTimes(2);
  });

  it('does not download the kit when all buyer build roots are already present', async () => {
    const locateKit = vi.fn();
    const pathExists = vi.fn(async () => true);
    const readText = vi.fn(async (path: string) =>
      path.endsWith('tsconfig.base.json') ? '"@vybekiit/client-state"' : '"setup.title"',
    );

    await expect(
      repairProjectBuildRoots('/Users/me/vybekiit-app', {
        locateKit,
        pathExists,
        readText,
        repairFromKit: vi.fn(),
      }),
    ).resolves.toBe(true);

    expect(pathExists).toHaveBeenCalledTimes(3);
    expect(readText).toHaveBeenCalledTimes(2);
    expect(locateKit).not.toHaveBeenCalled();
  });
});

describe('formatSessionOneLines', () => {
  it('mentions report mode and the seed prompt on success', () => {
    const text = formatSessionOneLines({
      appPath: '/Users/me/vybekiit-app',
      created: true,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: true,
      claudeOpened: true,
      projectToolsReady: true,
      previewReady: true,
      browserOpened: true,
    }).join('\n');

    expect(text).toContain('/Users/me/vybekiit-app');
    expect(text).toContain(SESSION_ONE_SEED_PROMPT);
    expect(text).toContain('Option+Shift+R');
    expect(text).toContain('localhost:3000');
    expect(text).toContain('@vybekiit/ui');
    expect(text).toContain('UI catalog');
    expect(text).toContain('project skills');
    expect(text).toContain('browser automation');
  });

  it('hands the ready app to whichever coding agent the buyer uses', () => {
    const text = formatSessionOneLines({
      appPath: '/Users/me/vybekiit-app',
      created: true,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: false,
      claudeOpened: false,
      projectToolsReady: false,
      previewReady: false,
      browserOpened: false,
    }).join('\n');

    expect(text).toContain('Open that folder in your coding agent');
    expect(text).toContain('/Users/me/vybekiit-app');
    expect(text).not.toContain('&& claude');
    expect(text).toContain('npx vybekiit setup');
    expect(text).not.toContain('@latest setup');
  });

  it('prints the verified URL when a headless environment cannot open a browser', () => {
    const text = formatSessionOneLines({
      appPath: '/Users/me/vybekiit-app',
      created: false,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: true,
      claudeOpened: false,
      projectToolsReady: true,
      previewReady: true,
      browserOpened: false,
    }).join('\n');

    expect(text).toContain('Welcome page verified');
    expect(text).toContain('http://localhost:3000/en/setup');
    expect(text).not.toContain('still needs a moment');
  });
});

describe('runSessionOne', () => {
  it('creates the web app, installs, builds, opens Claude, then opens a verified welcome page', async () => {
    const deps = baseDeps();
    const result = await runSessionOne(deps, {
      data: 'supabase',
      googleSignIn: false,
      hosting: 'cloudflare',
    });

    expect(deps.createApp).toHaveBeenCalledWith(['--web', '/Users/me/vybekiit-app']);
    expect(deps.runCommand).toHaveBeenCalledWith('/Users/me/vybekiit-app', 'pnpm', ['install']);
    expect(deps.runCommand).toHaveBeenCalledWith('/Users/me/vybekiit-app', 'pnpm', [
      'build:packages',
    ]);
    expect(deps.startDetached).toHaveBeenCalledWith('/Users/me/vybekiit-app', 'pnpm', ['dev']);
    expect(deps.openClaude).toHaveBeenCalledWith('/Users/me/vybekiit-app', SESSION_ONE_SEED_PROMPT);
    expect(deps.writeSetupEnvironment).toHaveBeenCalledWith('/Users/me/vybekiit-app', {
      DATA_PROVIDER: 'supabase',
      HOSTING_PROVIDER: 'cloudflare',
      VYBE_ASSISTANT: 'claude',
      VYBE_REPORT_MODE: '1',
    });
    expect(deps.waitForPreview).toHaveBeenCalledWith(DEFAULT_WELCOME_URL);
    expect(deps.openBrowser).toHaveBeenCalledWith(DEFAULT_WELCOME_URL);
    expect(result).toMatchObject({
      appPath: '/Users/me/vybekiit-app',
      created: true,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: true,
      claudeOpened: true,
      projectToolsReady: true,
      previewReady: true,
      browserOpened: true,
    });
  });

  it('does not open a success page when the preview never becomes ready', async () => {
    const deps = baseDeps({ waitForPreview: vi.fn(async () => false) });
    const result = await runSessionOne(deps);

    expect(deps.openBrowser).not.toHaveBeenCalled();
    expect(result.browserOpened).toBe(false);
    expect(result.previewReady).toBe(false);
    expect(result.lines.join('\n')).toContain('preview still needs a moment');
  });

  it('does not open a success page when the project tools cannot be prepared', async () => {
    const deps = baseDeps({ prepareProjectTools: vi.fn(async () => false) });
    const result = await runSessionOne(deps);

    expect(deps.waitForPreview).not.toHaveBeenCalled();
    expect(deps.openBrowser).not.toHaveBeenCalled();
    expect(result.projectToolsReady).toBe(false);
    expect(result.previewReady).toBe(false);
    expect(result.lines.join('\n')).toContain('Project tools still need repair');
  });

  it('reuses an existing kit workspace without re-scaffolding', async () => {
    const deps = baseDeps({
      pathExists: vi.fn((path: string) =>
        Promise.resolve(
          path === '/Users/me/vybekiit-app' || path === '/Users/me/vybekiit-app/templates/web',
        ),
      ),
      isEmptyDir: vi.fn(async () => false),
    });

    const result = await runSessionOne(deps);
    expect(deps.createApp).not.toHaveBeenCalled();
    expect(result.created).toBe(false);
    expect(result.appPath).toBe('/Users/me/vybekiit-app');
  });

  it('refuses a non-empty non-kit directory', async () => {
    const deps = baseDeps({
      pathExists: vi.fn(async (path: string) => path === '/Users/me/vybekiit-app'),
      isEmptyDir: vi.fn(async () => false),
    });

    const result = await runSessionOne(deps);
    expect(deps.createApp).not.toHaveBeenCalled();
    expect(result.appPath).toBeNull();
    expect(result.lines.join('\n')).toContain('already exists');
  });

  it('still opens Claude when pnpm is missing after create', async () => {
    const deps = baseDeps({
      pnpmCommand: vi.fn(async () => null),
    });

    const result = await runSessionOne(deps);
    expect(result.created).toBe(true);
    expect(result.depsInstalled).toBe(false);
    expect(deps.openClaude).toHaveBeenCalled();
    expect(result.appPath).toBe('/Users/me/vybekiit-app');
  });
});
