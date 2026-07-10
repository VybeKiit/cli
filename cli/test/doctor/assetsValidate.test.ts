import { describe, expect, it } from 'vitest';
import {
  type AssetsValidateDeps,
  assetDirForTemplate,
  isKitProject,
  verifyAssetsPipeline,
} from '../../src/doctor/assetsValidate';
import type { ProjectSurface } from '../../src/lib/inferProjectSurface';

const surface = (template: ProjectSurface['template']): ProjectSurface => ({
  template,
  mobile: template === 'mobile',
  extension: template === 'extension',
});

const depsFromFiles = (files: Readonly<Record<string, string | true>>): AssetsValidateDeps => ({
  exists: (relativePath) => files[relativePath] !== undefined,
  readUtf8: (relativePath) => {
    const value = files[relativePath];
    if (value === undefined || value === true) {
      return null;
    }
    return value;
  },
});

const webPackage = JSON.stringify({
  name: 'my-app',
  dependencies: {
    next: '15.0.0',
    '@vybekiit/assets': 'workspace:*',
    '@vybekiit/core': 'workspace:*',
  },
  scripts: {
    prebuild: 'tsx scripts/optimizeAssets.ts',
    build: 'next build',
  },
});

describe('isKitProject', () => {
  it('is false for empty pre-create cwd', () => {
    expect(isKitProject(depsFromFiles({}))).toBe(false);
  });

  it('is true when platform-skills.manifest.json exists', () => {
    expect(isKitProject(depsFromFiles({ 'platform-skills.manifest.json': '{}' }))).toBe(true);
  });

  it('is true when package.json lists @vybekiit/*', () => {
    expect(
      isKitProject(
        depsFromFiles({
          'package.json': JSON.stringify({
            dependencies: { '@vybekiit/core': 'workspace:*' },
          }),
        }),
      ),
    ).toBe(true);
  });
});

describe('assetDirForTemplate', () => {
  it('maps web/spa/extension to public and mobile to assets', () => {
    expect(assetDirForTemplate('web')).toBe('public');
    expect(assetDirForTemplate('spa')).toBe('public');
    expect(assetDirForTemplate('extension')).toBe('public');
    expect(assetDirForTemplate('mobile')).toBe('assets');
    expect(assetDirForTemplate('backend')).toBeNull();
  });
});

describe('verifyAssetsPipeline pre-create', () => {
  it('skips non-kit cwd without lines', () => {
    const report = verifyAssetsPipeline('/tmp/empty', surface('web'), depsFromFiles({}));
    expect(report.status).toBe('skipped');
    expect(report.ok).toBe(true);
    expect(report.lines).toEqual([]);
  });
});

describe('verifyAssetsPipeline web and extension ok', () => {
  it('reports ok when web kit has assets package, optimize script, and public/', () => {
    const report = verifyAssetsPipeline(
      '/proj',
      surface('web'),
      depsFromFiles({
        'package.json': webPackage,
        'scripts/optimizeAssets.ts': true,
        public: true,
      }),
    );
    expect(report.status).toBe('ok');
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.startsWith('✓ pictures pipeline'))).toBe(true);
    expect(report.lines.some((line) => line.includes('CDN for chrome-extension'))).toBe(false);
  });

  it('notes extension build-time only with no CDN promise', () => {
    const report = verifyAssetsPipeline(
      '/proj',
      surface('extension'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: {
            '@vybekiit/assets': 'workspace:*',
            '@vybekiit/core': 'workspace:*',
          },
          scripts: { prebuild: 'tsx scripts/optimizeAssets.mts' },
        }),
        'scripts/optimizeAssets.mts': true,
        public: true,
      }),
    );
    expect(report.status).toBe('ok');
    expect(report.lines.some((line) => line.includes('no CDN for chrome-extension://'))).toBe(true);
  });
});

describe('verifyAssetsPipeline mobile and backend ok', () => {
  it('accepts mobile assets/ dir with prestart optimize', () => {
    const report = verifyAssetsPipeline(
      '/proj',
      surface('mobile'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: { expo: '53.0.0', '@vybekiit/assets': 'workspace:*' },
          scripts: { prestart: 'tsx scripts/optimizeAssets.mts' },
        }),
        'scripts/optimizeAssets.mts': true,
        assets: true,
      }),
    );
    expect(report.status).toBe('ok');
    expect(report.lines.some((line) => line.includes('assets/'))).toBe(true);
  });

  it('ok for backend when only @vybekiit/assets is present', () => {
    const report = verifyAssetsPipeline(
      '/proj',
      surface('backend'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: { express: '4.0.0', '@vybekiit/assets': 'workspace:*' },
        }),
      }),
    );
    expect(report.status).toBe('ok');
    expect(report.lines.some((line) => line.includes('upload delivery'))).toBe(true);
  });
});

describe('verifyAssetsPipeline warn paths', () => {
  it('warns when kit has assets package but no optimize hook', () => {
    const report = verifyAssetsPipeline(
      '/proj',
      surface('spa'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: {
            vite: '6.0.0',
            '@tanstack/react-router': '1.0.0',
            '@vybekiit/assets': 'workspace:*',
          },
          scripts: { build: 'vite build' },
        }),
        public: true,
      }),
    );
    expect(report.status).toBe('warn');
    expect(report.ok).toBe(true);
    expect(report.lines.some((line) => line.startsWith('→ pictures pipeline'))).toBe(true);
    expect(report.lines.some((line) => line.includes('optimize'))).toBe(true);
  });

  it('warns when neither assets package nor optimize scripts exist', () => {
    const report = verifyAssetsPipeline(
      '/proj',
      surface('web'),
      depsFromFiles({
        'package.json': JSON.stringify({
          dependencies: { next: '15.0.0', '@vybekiit/core': 'workspace:*' },
          scripts: { build: 'next build' },
        }),
        public: true,
      }),
    );
    expect(report.status).toBe('warn');
    expect(report.ok).toBe(true);
    expect(report.lines[0]).toContain('@vybekiit/assets');
  });
});
