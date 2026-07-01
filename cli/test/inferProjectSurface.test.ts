import { describe, expect, it } from 'vitest';
import {
  inferProjectSurfaceSync,
  reportModeEnvKeysForSurface,
  type ProjectSurfaceProbe,
} from '../src/lib/inferProjectSurface';

function probe(files: Record<string, string>): ProjectSurfaceProbe {
  return {
    exists: (path) => path in files,
    readUtf8: (path) => files[path] ?? null,
  };
}

describe('inferProjectSurfaceSync', () => {
  it('detects mobile from expo dependency in package.json', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        'package.json': JSON.stringify({ dependencies: { expo: '1.0.0' } }),
      }),
    );
    expect(surface.template).toBe('mobile');
    expect(surface.mobile).toBe(true);
    expect(surface.extension).toBe(false);
  });

  it('detects mobile from app.json expo key without expo dep', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        'package.json': JSON.stringify({ dependencies: {} }),
        'app.json': JSON.stringify({ expo: { name: 'Demo' } }),
      }),
    );
    expect(surface.template).toBe('mobile');
    expect(surface.mobile).toBe(true);
  });

  it('detects web from next dependency', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        'package.json': JSON.stringify({ dependencies: { next: '15.0.0' } }),
      }),
    );
    expect(surface.template).toBe('web');
    expect(surface.mobile).toBe(false);
  });

  it('detects extension from wxt.config.ts', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        'package.json': JSON.stringify({ dependencies: {} }),
        'wxt.config.ts': 'export default {}',
      }),
    );
    expect(surface.template).toBe('extension');
    expect(surface.extension).toBe(true);
  });

  it('detects extension from publish-extension skill marker', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        '.vybekiit/skills/publish-extension.md': '# publish',
      }),
    );
    expect(surface.template).toBe('extension');
  });

  it('detects backend from express dependency', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        'package.json': JSON.stringify({ dependencies: { express: '4.0.0' } }),
      }),
    );
    expect(surface.template).toBe('backend');
  });

  it('detects backend from src layout when package.json missing', () => {
    const surface = inferProjectSurfaceSync(
      '/tmp',
      probe({
        'src/index.ts': 'export {}',
        'src/app.ts': 'export {}',
      }),
    );
    expect(surface.template).toBe('backend');
  });

  it('defaults to web for empty cwd', () => {
    const surface = inferProjectSurfaceSync('/tmp', probe({}));
    expect(surface.template).toBe('web');
  });
});

describe('reportModeEnvKeysForSurface', () => {
  it('uses mobile env key', () => {
    expect(
      reportModeEnvKeysForSurface({ template: 'mobile', mobile: true, extension: false }, 'claude'),
    ).toEqual({ EXPO_PUBLIC_VYBE_ASSISTANT: 'claude' });
  });

  it('uses extension env key', () => {
    expect(
      reportModeEnvKeysForSurface(
        { template: 'extension', mobile: false, extension: true },
        'codex',
      ),
    ).toEqual({ WXT_PUBLIC_VYBE_ASSISTANT: 'codex' });
  });

  it('uses web env key by default', () => {
    expect(
      reportModeEnvKeysForSurface({ template: 'web', mobile: false, extension: false }, 'claude'),
    ).toEqual({ VYBE_ASSISTANT: 'claude' });
  });
});
