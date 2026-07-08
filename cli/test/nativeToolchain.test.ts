import { describe, expect, it } from 'vitest';
import { mergeDoctorTools, selectNativeTools } from '../src/doctor/nativeToolchain';
import { selectToolchain } from '../src/doctor/toolchain';
import type { ProjectSurface } from '../src/lib/inferProjectSurface';

const surface = (
  template: ProjectSurface['template'],
  overrides: Partial<ProjectSurface> = {},
): ProjectSurface => ({
  template,
  mobile: template === 'mobile',
  extension: template === 'extension',
  ...overrides,
});

describe('selectNativeTools', () => {
  it('adds Docker for backend templates', () => {
    expect(selectNativeTools(surface('backend'), 'darwin').map((t) => t.name)).toEqual(['docker']);
  });

  it('adds Watchman + CocoaPods on macOS for mobile', () => {
    expect(selectNativeTools(surface('mobile'), 'darwin').map((t) => t.name)).toEqual([
      'watchman',
      'pod',
    ]);
  });

  it('adds Watchman only on Windows/Linux for mobile (no CocoaPods)', () => {
    expect(selectNativeTools(surface('mobile'), 'win32').map((t) => t.name)).toEqual(['watchman']);
    expect(selectNativeTools(surface('mobile'), 'linux').map((t) => t.name)).toEqual(['watchman']);
  });

  it('returns no native tools for web, spa, or extension', () => {
    expect(selectNativeTools(surface('web'), 'darwin')).toEqual([]);
    expect(selectNativeTools(surface('spa'), 'darwin')).toEqual([]);
    expect(selectNativeTools(surface('extension'), 'darwin')).toEqual([]);
  });
});

describe('mergeDoctorTools', () => {
  it('dedupes provider and native tools by name', () => {
    const provider = selectToolchain({}, { mobile: true });
    const native = selectNativeTools(surface('mobile'), 'darwin');
    const names = mergeDoctorTools(provider, native).map((t) => t.name);
    expect(names).toContain('gh');
    expect(names).toContain('eas');
    expect(names).toContain('watchman');
    expect(names).toContain('pod');
    expect(new Set(names).size).toBe(names.length);
  });
});
