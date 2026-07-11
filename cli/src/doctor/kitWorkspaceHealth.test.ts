import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyKitWorkspaceHealth } from './kitWorkspaceHealth';

describe('verifyKitWorkspaceHealth', () => {
  it('passes when packages/ is absent', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vk-kit-health-'));
    const report = verifyKitWorkspaceHealth(cwd);
    expect(report.ok).toBe(true);
    expect(report.lines).toEqual([]);
  });

  it('fails when a package expects dist but dist is missing', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vk-kit-health-'));
    const pkgDir = join(cwd, 'packages', 'core');
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({
        name: '@vybekiit/core',
        main: './dist/index.cjs',
        module: './dist/index.js',
      }),
    );

    const report = verifyKitWorkspaceHealth(cwd);
    expect(report.ok).toBe(false);
    expect(report.lines.some((line) => line.includes('@vybekiit/core'))).toBe(true);
    expect(report.lines.some((line) => line.includes('pnpm build:packages'))).toBe(true);
  });

  it('passes when dist is present', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vk-kit-health-'));
    const pkgDir = join(cwd, 'packages', 'core');
    mkdirSync(join(pkgDir, 'dist'), { recursive: true });
    writeFileSync(
      join(pkgDir, 'package.json'),
      JSON.stringify({
        name: '@vybekiit/core',
        main: './dist/index.cjs',
      }),
    );
    writeFileSync(join(cwd, 'tsconfig.base.json'), '{}\n');
    mkdirSync(join(cwd, 'scripts', 'lib'), { recursive: true });
    writeFileSync(join(cwd, 'scripts', 'lib', 'tsupWorkspaceAliases.mjs'), 'export {};\n');

    const report = verifyKitWorkspaceHealth(cwd);
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.startsWith('✓ Kit packages'))).toBe(true);
  });
});
