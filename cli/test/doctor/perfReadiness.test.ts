import { describe, expect, it } from 'vitest';
import {
  hasPerfHarnessFiles,
  hasPerfScripts,
  hasWebPerfSkill,
  type PerfReadinessDeps,
  verifyPerfReadiness,
} from '../../src/doctor/perfReadiness';
import type { ProjectSurface } from '../../src/lib/inferProjectSurface';

const SPEED_CHECKS_PREFIX = /→ speed checks/;
const WEB_LAB_OR_FIELD = /Lighthouse|CrUX|speed checks/i;
const MOBILE_PERF = /bundle size|startup/i;
const STATIC_DIST = /staticDistDir/;
const EXTENSION_PERF = /package size|popup/i;

const surface = (template: ProjectSurface['template']): ProjectSurface => ({
  template,
  mobile: template === 'mobile',
  extension: template === 'extension',
});

const depsFromFiles = (files: Readonly<Record<string, string | true>>): PerfReadinessDeps => ({
  exists: (relativePath) => files[relativePath] !== undefined,
  readUtf8: (relativePath) => {
    const value = files[relativePath];
    if (value === undefined || value === true) {
      return null;
    }
    return value;
  },
});

const kitPackage = (scripts: Record<string, string> = {}): string =>
  JSON.stringify({
    dependencies: { '@vybekiit/core': 'workspace:*', next: '15.0.0' },
    scripts,
  });

describe('perf harness helpers', () => {
  it('detects real web-perf skill paths only', () => {
    expect(hasWebPerfSkill(depsFromFiles({ '.agents/skills/web-perf-ci/SKILL.md': true }))).toBe(
      true,
    );
    expect(hasWebPerfSkill(depsFromFiles({ '.agents/skills/web-perf/SKILL.md': true }))).toBe(true);
    expect(hasWebPerfSkill(depsFromFiles({ '.agents/skills/other/SKILL.md': true }))).toBe(false);
  });

  it('detects monorepo harness files that actually exist in-repo', () => {
    expect(hasPerfHarnessFiles(depsFromFiles({ '.github/perf/budgets.json': true }))).toBe(true);
    expect(hasPerfHarnessFiles(depsFromFiles({ 'lighthouserc.json': true }))).toBe(true);
    expect(hasPerfHarnessFiles(depsFromFiles({}))).toBe(false);
  });

  it('detects perf:lab / perf:field package scripts', () => {
    expect(
      hasPerfScripts(
        depsFromFiles({
          'package.json': JSON.stringify({
            scripts: { 'perf:lab': 'npx @lhci/cli autorun' },
          }),
        }),
      ),
    ).toBe(true);
    expect(hasPerfScripts(depsFromFiles({ 'package.json': JSON.stringify({ scripts: {} }) }))).toBe(
      false,
    );
  });
});

describe('verifyPerfReadiness pre-create', () => {
  it('skips non-kit cwd without lines', () => {
    const report = verifyPerfReadiness('/tmp/empty', surface('web'), depsFromFiles({}));
    expect(report.status).toBe('skipped');
    expect(report.ok).toBe(true);
    expect(report.lines).toEqual([]);
  });
});

describe('verifyPerfReadiness ok paths', () => {
  it('reports ok when web skill is discoverable', () => {
    const report = verifyPerfReadiness(
      '/proj',
      surface('web'),
      depsFromFiles({
        'package.json': kitPackage(),
        '.agents/skills/web-perf-ci/SKILL.md': true,
      }),
    );
    expect(report.status).toBe('ok');
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.includes('speed checks'))).toBe(true);
    expect(
      report.lines.some((line) => line.includes('Lighthouse') || line.includes('web-perf')),
    ).toBe(true);
  });

  it('reports ok from harness alone without inventing a skill', () => {
    const report = verifyPerfReadiness(
      '/proj',
      surface('web'),
      depsFromFiles({
        'package.json': kitPackage({ 'perf:lab': 'npx @lhci/cli autorun' }),
        '.github/perf/budgets.json': true,
      }),
    );
    expect(report.status).toBe('ok');
    expect(report.lines.some((line) => line.startsWith('✓ speed checks'))).toBe(true);
    expect(report.lines.some((line) => line.toLowerCase().includes('skill is discoverable'))).toBe(
      false,
    );
  });

  it('uses mobile-specific ok messaging for bundle and startup', () => {
    const ready = verifyPerfReadiness(
      '/proj',
      surface('mobile'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: { expo: '53.0.0', '@vybekiit/core': 'workspace:*' },
        }),
        '.agents/skills/web-perf-ci/SKILL.md': true,
      }),
    );
    expect(ready.status).toBe('ok');
    expect(ready.lines[0]).toMatch(MOBILE_PERF);
  });
});

describe('verifyPerfReadiness warn paths', () => {
  it('warns with Lighthouse/CrUX next action for web when nothing is present', () => {
    const report = verifyPerfReadiness(
      '/proj',
      surface('web'),
      depsFromFiles({ 'package.json': kitPackage() }),
    );
    expect(report.status).toBe('warn');
    expect(report.ok).toBe(true);
    expect(report.lines[0]).toMatch(SPEED_CHECKS_PREFIX);
    expect(report.lines[0]).toMatch(WEB_LAB_OR_FIELD);
  });

  it('uses mobile-specific messaging without staticDistDir', () => {
    const missing = verifyPerfReadiness(
      '/proj',
      surface('mobile'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: { expo: '53.0.0', '@vybekiit/core': 'workspace:*' },
        }),
      }),
    );
    expect(missing.status).toBe('warn');
    expect(missing.lines[0]).toMatch(MOBILE_PERF);
    expect(missing.lines[0]).not.toMatch(STATIC_DIST);
  });

  it('uses extension-specific messaging for package size and popup', () => {
    const report = verifyPerfReadiness(
      '/proj',
      surface('extension'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: { '@vybekiit/core': 'workspace:*' },
        }),
        'platform-skills.manifest.json': '{}',
      }),
    );
    expect(report.status).toBe('warn');
    expect(report.lines[0]).toMatch(EXTENSION_PERF);
  });
});
