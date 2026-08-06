import { describe, expect, it, vi } from 'vitest';
import {
  type CreateUiLibraryDeps,
  DEFAULT_UI_LIBRARY_DIR_NAME,
  formatCreateUiLibraryLines,
  isUiLibraryCreateArgs,
  parseCreateUiLibraryArgs,
  runCreateUiLibrary,
  UI_LIBRARY_GALLERY_URL,
  UI_LIBRARY_SEED_PROMPT,
} from '../src/commands/createUiLibrary';

const baseDeps = (overrides: Partial<CreateUiLibraryDeps> = {}): CreateUiLibraryDeps => ({
  createApp: vi.fn(async () => 0),
  pathExists: vi.fn(async () => false),
  isEmptyDir: vi.fn(async () => true),
  runCommand: vi.fn(async () => ({ code: 0 })),
  startDetached: vi.fn(() => true),
  openClaude: vi.fn(async () => true),
  openUrl: vi.fn(async () => true),
  pnpmCommand: vi.fn(async () => ['pnpm'] as const),
  homeDir: () => '/Users/me',
  env: {},
  platform: 'darwin',
  cwd: () => '/Users/me/projects',
  ...overrides,
});

describe('isUiLibraryCreateArgs', () => {
  it('matches create --ui-library and create ui-library', () => {
    expect(isUiLibraryCreateArgs(['--ui-library'])).toBe(true);
    expect(isUiLibraryCreateArgs(['ui-library'])).toBe(true);
    expect(isUiLibraryCreateArgs(['--ui-library', './lib'])).toBe(true);
  });

  it('matches create app --ui-library', () => {
    expect(isUiLibraryCreateArgs(['app', '--ui-library'])).toBe(true);
    expect(isUiLibraryCreateArgs(['app', 'ui-library', '~/x'])).toBe(true);
  });

  it('rejects normal create app surfaces', () => {
    expect(isUiLibraryCreateArgs(['app', '--web'])).toBe(false);
    expect(isUiLibraryCreateArgs(['app'])).toBe(false);
    expect(isUiLibraryCreateArgs([])).toBe(false);
  });
});

describe('parseCreateUiLibraryArgs', () => {
  it('defaults to ~/vybekiit-ui-library', () => {
    const deps = baseDeps();
    expect(parseCreateUiLibraryArgs(['--ui-library'], deps)).toEqual({
      destPath: `/Users/me/${DEFAULT_UI_LIBRARY_DIR_NAME}`,
      openGallery: true,
      skipClaude: false,
      skipDev: false,
    });
  });

  it('honours explicit directory and flags', () => {
    const deps = baseDeps();
    expect(
      parseCreateUiLibraryArgs(
        ['app', '--ui-library', './my-ui', '--no-gallery', '--skip-claude', '--skip-dev'],
        deps,
      ),
    ).toEqual({
      destPath: '/Users/me/projects/my-ui',
      openGallery: false,
      skipClaude: true,
      skipDev: true,
    });
  });

  it('honours VYBEKIIT_UI_LIBRARY_DIR', () => {
    const deps = baseDeps({ env: { VYBEKIIT_UI_LIBRARY_DIR: '/tmp/ui-kit' } });
    expect(parseCreateUiLibraryArgs(['--ui-library'], deps).destPath).toBe('/tmp/ui-kit');
  });
});

describe('runCreateUiLibrary', () => {
  it('scaffolds web kit, installs, opens gallery + Claude', async () => {
    const deps = baseDeps();
    const result = await runCreateUiLibrary(['--ui-library'], deps);

    expect(result.exitCode).toBe(0);
    expect(result.created).toBe(true);
    expect(result.appPath).toBe(`/Users/me/${DEFAULT_UI_LIBRARY_DIR_NAME}`);
    expect(deps.createApp).toHaveBeenCalledWith([
      '--web',
      `/Users/me/${DEFAULT_UI_LIBRARY_DIR_NAME}`,
    ]);
    expect(deps.runCommand).toHaveBeenCalledWith(
      `/Users/me/${DEFAULT_UI_LIBRARY_DIR_NAME}`,
      'pnpm',
      ['install'],
    );
    expect(deps.startDetached).toHaveBeenCalled();
    expect(deps.openUrl).toHaveBeenCalledWith(UI_LIBRARY_GALLERY_URL);
    expect(deps.openClaude).toHaveBeenCalledWith(
      `/Users/me/${DEFAULT_UI_LIBRARY_DIR_NAME}`,
      UI_LIBRARY_SEED_PROMPT,
    );
    expect(result.lines.join('\n')).toContain(UI_LIBRARY_GALLERY_URL);
  });

  it('reuses an existing kit workspace without re-create', async () => {
    const appPath = `/Users/me/${DEFAULT_UI_LIBRARY_DIR_NAME}`;
    const deps = baseDeps({
      pathExists: vi.fn(async (path: string) => path === appPath || path.includes('templates/web')),
      isEmptyDir: vi.fn(async () => false),
    });

    const result = await runCreateUiLibrary(['--ui-library', '--skip-dev'], deps);
    expect(result.created).toBe(false);
    expect(deps.createApp).not.toHaveBeenCalled();
    expect(result.exitCode).toBe(0);
  });

  it('refuses a non-kit existing directory', async () => {
    const deps = baseDeps({
      pathExists: vi.fn(async (path: string) => path === '/Users/me/projects/static-site'),
      isEmptyDir: vi.fn(async () => false),
      cwd: () => '/Users/me/projects',
    });

    const result = await runCreateUiLibrary(['--ui-library', './static-site'], deps);
    expect(result.exitCode).toBe(1);
    expect(result.appPath).toBeNull();
    expect(deps.createApp).not.toHaveBeenCalled();
    expect(result.lines.join('\n')).toContain('not a VybeKiit kit workspace');
  });

  it('fails closed when create app fails', async () => {
    const deps = baseDeps({ createApp: vi.fn(async () => 1) });
    const result = await runCreateUiLibrary(['--ui-library'], deps);
    expect(result.exitCode).toBe(1);
    expect(result.appPath).toBeNull();
  });
});

describe('formatCreateUiLibraryLines', () => {
  it('mentions report mode and gallery on success', () => {
    const lines = formatCreateUiLibraryLines({
      appPath: '/tmp/kit',
      created: true,
      depsInstalled: true,
      packagesBuilt: true,
      devStarted: true,
      galleryOpened: true,
      claudeOpened: true,
    });
    expect(lines.join('\n')).toContain('Report mode');
    expect(lines.join('\n')).toContain(UI_LIBRARY_GALLERY_URL);
  });
});
