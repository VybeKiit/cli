import { describe, expect, it } from 'vitest';
import {
  inferCategory,
  inferTags,
  isPortable,
  passesRegistryFilter,
  resolveTargetPath,
  shouldSkipMirrorFile,
} from './sync-ui-registries.mjs';

describe('sync-ui-registries', () => {
  it('filters bundui pro items', () => {
    expect(passesRegistryFilter({ meta: { isPro: true } }, 'free')).toBe(false);
    expect(passesRegistryFilter({ meta: { isPro: false } }, 'free')).toBe(true);
  });

  it('resolves magicui paths into namespace', () => {
    const target = resolveTargetPath(
      '/tmp/web',
      'magicui',
      { path: 'registry/magicui/marquee.tsx' },
      'marquee',
    );
    expect(target).toContain('src/components/magicui/marquee.tsx');
  });

  it('prefers bundui file.target over page.tsx leaf', () => {
    const target = resolveTargetPath(
      '/tmp/web',
      'bundui',
      {
        path: 'examples/components/alert/default/page.tsx',
        target: 'components/alert-default.tsx',
      },
      'alert-default',
    );
    expect(target).toContain('src/components/bundui/alert-default.tsx');
    expect(target).not.toContain('page.tsx');
  });

  it('skips story and demo artifacts', () => {
    expect(shouldSkipMirrorFile('components/foo.story.tsx', 'foo')).toBe(true);
    expect(shouldSkipMirrorFile('components/foo.tsx', 'foo')).toBe(false);
  });

  it('marks motion deps as not portable', () => {
    expect(isPortable(['motion'])).toBe(false);
    expect(isPortable(['lucide-react'])).toBe(true);
  });

  it('infers hero category', () => {
    expect(inferCategory('hero-parallax', { title: 'Hero Parallax' })).toBe('hero');
  });

  it('adds tag hints from name', () => {
    const tags = inferTags('pricing-table', {}, ['shadcn']);
    expect(tags).toContain('pricing');
    expect(tags).toContain('shadcn');
  });
});
