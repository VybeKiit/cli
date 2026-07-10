import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ScaffoldError } from '../src/lib/scaffold';
import { scaffoldKitWorkspace } from '../src/lib/scaffoldKitWorkspace';

/**
 * Write a minimal package.json for a fake kit package.
 *
 * @param dir - Package directory.
 * @param body - Package manifest object.
 * @returns Promise that resolves after write.
 */
const writePkg = async (dir: string, body: Record<string, unknown>): Promise<void> => {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'package.json'), `${JSON.stringify(body, null, 2)}\n`);
};

/**
 * Build a minimal fake kit tree for scaffoldKitWorkspace unit tests.
 *
 * @param kitRoot - Empty directory that becomes the fake monorepo/kit root.
 * @returns Promise that resolves after the fixture is written.
 */
const writeFakeKit = async (kitRoot: string): Promise<void> => {
  const coreDir = join(kitRoot, 'packages', 'core');
  const authDir = join(kitRoot, 'packages', 'auth');
  const webDir = join(kitRoot, 'templates', 'web');
  await writePkg(coreDir, { name: '@vybekiit/core', version: '0.0.0', private: true });
  await writeFile(join(coreDir, 'index.ts'), 'export const core = true;\n');
  // Skip dirs must not be copied into the buyer kit.
  await mkdir(join(coreDir, 'node_modules', 'left-pad'), { recursive: true });
  await writePkg(authDir, {
    name: '@vybekiit/auth',
    version: '0.0.0',
    private: true,
    dependencies: { '@vybekiit/core': 'workspace:*' },
  });
  await mkdir(join(webDir, 'src'), { recursive: true });
  await writePkg(webDir, {
    name: 'my-vybekiit-app',
    version: '0.1.0',
    private: true,
    dependencies: {
      '@vybekiit/auth': 'workspace:*',
      '@vybekiit/core': 'workspace:*',
    },
  });
  await writeFile(
    join(webDir, 'src', 'page.tsx'),
    'export default function Page() { return null; }\n',
  );
  await writeFile(
    join(kitRoot, 'pnpm-workspace.yaml'),
    [
      'packages:',
      '  - "packages/*"',
      '  - "templates/web"',
      '',
      'catalog:',
      '  effect: 3.21.4',
      '',
    ].join('\n'),
  );
  await writePkg(kitRoot, {
    name: 'vybekiit',
    private: true,
    packageManager: 'pnpm@10.33.2',
  });
};

describe('scaffoldKitWorkspace happy path', () => {
  it('writes a kit workspace with packages, surface, and workspace:* preserved', async () => {
    const kitRoot = await mkdtemp(join(tmpdir(), 'vybekiit-kit-src-'));
    const destParent = await mkdtemp(join(tmpdir(), 'vybekiit-kit-dest-'));
    const emptyDest = join(destParent, 'app');
    await writeFakeKit(kitRoot);

    const result = await scaffoldKitWorkspace({
      template: 'web',
      kitRoot,
      dest: emptyDest,
    });

    expect(result.dest).toBe(emptyDest);

    const rootPkg = JSON.parse(await readFile(join(emptyDest, 'package.json'), 'utf8')) as {
      readonly private?: boolean;
    };
    expect(rootPkg.private).toBe(true);

    const workspaceYaml = await readFile(join(emptyDest, 'pnpm-workspace.yaml'), 'utf8');
    expect(workspaceYaml).toContain('packages/*');
    expect(workspaceYaml).toContain('templates/web');

    const surfacePkgRaw = await readFile(
      join(emptyDest, 'templates', 'web', 'package.json'),
      'utf8',
    );
    const surfacePkg = JSON.parse(surfacePkgRaw) as {
      readonly dependencies?: Record<string, string>;
    };
    expect(surfacePkg.dependencies?.['@vybekiit/auth']).toBe('workspace:*');
    expect(surfacePkg.dependencies?.['@vybekiit/core']).toBe('workspace:*');

    await expect(
      readFile(join(emptyDest, 'packages', 'core', 'package.json'), 'utf8'),
    ).resolves.toBeDefined();
    await expect(
      readFile(join(emptyDest, 'packages', 'auth', 'package.json'), 'utf8'),
    ).resolves.toBeDefined();
    await expect(
      readFile(join(emptyDest, 'packages', 'core', 'node_modules', 'left-pad', 'x'), 'utf8'),
    ).rejects.toThrow();
  });
});

describe('scaffoldKitWorkspace failures', () => {
  it('refuses a non-empty destination', async () => {
    const kitRoot = await mkdtemp(join(tmpdir(), 'vybekiit-kit-src-'));
    const dest = await mkdtemp(join(tmpdir(), 'vybekiit-kit-dest-'));
    await writeFakeKit(kitRoot);
    await writeFile(join(dest, 'already.txt'), 'nope\n');

    await expect(scaffoldKitWorkspace({ template: 'web', kitRoot, dest })).rejects.toBeInstanceOf(
      ScaffoldError,
    );
  });

  it('errors when the surface template is missing from the kit', async () => {
    const kitRoot = await mkdtemp(join(tmpdir(), 'vybekiit-kit-src-'));
    const destParent = await mkdtemp(join(tmpdir(), 'vybekiit-kit-dest-'));
    const dest = join(destParent, 'app');
    await mkdir(join(kitRoot, 'packages'), { recursive: true });
    await writePkg(kitRoot, { name: 'vybekiit', private: true });

    await expect(scaffoldKitWorkspace({ template: 'web', kitRoot, dest })).rejects.toBeInstanceOf(
      ScaffoldError,
    );
  });
});
