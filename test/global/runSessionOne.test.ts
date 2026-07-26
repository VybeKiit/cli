import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FIRST_APP_DIR_NAME,
  formatSessionOneLines,
  resolveFirstAppPath,
  runSessionOne,
  SESSION_ONE_SEED_PROMPT,
  shouldSkipSessionOne,
  type SessionOneDeps,
} from '../../src/global/runSessionOne';

const baseDeps = (overrides: Partial<SessionOneDeps> = {}): SessionOneDeps => ({
  createApp: vi.fn(async () => 0),
  pathExists: vi.fn(async () => false),
  isEmptyDir: vi.fn(async () => true),
  runCommand: vi.fn(async () => ({ code: 0 })),
  startDetached: vi.fn(() => true),
  openClaude: vi.fn(async () => true),
  resolvePnpm: vi.fn(async () => ['pnpm'] as const),
  homeDir: () => '/Users/me',
  env: {},
  platform: 'darwin',
  ...overrides,
});

describe('shouldSkipSessionOne', () => {
  it('skips on flags and env', () => {
    expect(shouldSkipSessionOne(['--skip-session-one'], {})).toBe(true);
    expect(shouldSkipSessionOne(['--skip-first-app'], {})).toBe(true);
    expect(shouldSkipSessionOne([], { VYBEKIIT_SKIP_SESSION_ONE: '1' })).toBe(true);
    expect(shouldSkipSessionOne([], {})).toBe(false);
  });
});

describe('resolveFirstAppPath', () => {
  it('defaults to ~/vybekiit-app', () => {
    expect(resolveFirstAppPath({ homeDir: () => '/Users/me', env: {} })).toBe(
      `/Users/me/${DEFAULT_FIRST_APP_DIR_NAME}`,
    );
  });

  it('honours absolute and relative VYBEKIIT_FIRST_APP_DIR', () => {
    expect(
      resolveFirstAppPath({
        homeDir: () => '/Users/me',
        env: { VYBEKIIT_FIRST_APP_DIR: '/tmp/app' },
      }),
    ).toBe('/tmp/app');
    expect(
      resolveFirstAppPath({
        homeDir: () => '/Users/me',
        env: { VYBEKIIT_FIRST_APP_DIR: 'projects/shop' },
      }),
    ).toBe('/Users/me/projects/shop');
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
    }).join('\n');

    expect(text).toContain('/Users/me/vybekiit-app');
    expect(text).toContain(SESSION_ONE_SEED_PROMPT);
    expect(text).toContain('Option+Shift+R');
    expect(text).toContain('localhost:3000');
  });

  it('prints manual Claude command when open failed', () => {
    const text = formatSessionOneLines({
      appPath: '/Users/me/vybekiit-app',
      created: true,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: false,
      claudeOpened: false,
    }).join('\n');

    expect(text).toContain('cd /Users/me/vybekiit-app && claude "Set up my app."');
  });
});

describe('runSessionOne', () => {
  it('creates the web app, installs, builds, starts dev, opens Claude', async () => {
    const deps = baseDeps();
    const result = await runSessionOne(deps);

    expect(deps.createApp).toHaveBeenCalledWith(['--web', '/Users/me/vybekiit-app']);
    expect(deps.runCommand).toHaveBeenCalledWith('/Users/me/vybekiit-app', 'pnpm', ['install']);
    expect(deps.runCommand).toHaveBeenCalledWith('/Users/me/vybekiit-app', 'pnpm', [
      'build:packages',
    ]);
    expect(deps.startDetached).toHaveBeenCalledWith('/Users/me/vybekiit-app', 'pnpm', ['dev']);
    expect(deps.openClaude).toHaveBeenCalledWith(
      '/Users/me/vybekiit-app',
      SESSION_ONE_SEED_PROMPT,
    );
    expect(result).toMatchObject({
      appPath: '/Users/me/vybekiit-app',
      created: true,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: true,
      claudeOpened: true,
    });
  });

  it('reuses an existing kit workspace without re-scaffolding', async () => {
    const deps = baseDeps({
      pathExists: vi.fn(async (path: string) => {
        if (path === '/Users/me/vybekiit-app') return true;
        if (path === '/Users/me/vybekiit-app/templates/web') return true;
        return false;
      }),
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
      resolvePnpm: vi.fn(async () => null),
    });

    const result = await runSessionOne(deps);
    expect(result.created).toBe(true);
    expect(result.depsInstalled).toBe(false);
    expect(deps.openClaude).toHaveBeenCalled();
    expect(result.appPath).toBe('/Users/me/vybekiit-app');
  });
});
