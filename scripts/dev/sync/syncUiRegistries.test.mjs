import { describe, expect, it } from 'vitest';
import {
  inferCategory,
  inferTags,
  isPortable,
  passesRegistryFilter,
  resolveTargetPath,
  shouldSkipMirrorFile,
} from './syncUiRegistries.mjs';

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

  it('infers hero category from name', () => {
    expect(inferCategory('hero-parallax', { title: 'Hero Parallax' })).toBe('hero');
  });

  it('infers card from slug before hero tag noise', () => {
    expect(inferCategory('magic-card', { title: 'Magic Card' }, ['hero', 'marketing'])).toBe(
      'card',
    );
  });

  it('infers ai namespace default', () => {
    expect(inferCategory('message', {}, [], 'ai-elements')).toBe('ai');
  });

  it('adds tag hints from name', () => {
    const tags = inferTags('pricing-table', {}, ['shadcn']);
    expect(tags).toContain('pricing');
    expect(tags).toContain('shadcn');
  });

  it('filters ai-elements components and examples', () => {
    expect(
      passesRegistryFilter({ type: 'registry:component', name: 'message' }, 'ai-elements'),
    ).toBe(true);
    expect(
      passesRegistryFilter({ type: 'registry:block', name: 'example-chatbot' }, 'ai-elements'),
    ).toBe(true);
    expect(passesRegistryFilter({ type: 'registry:block', name: 'workflow' }, 'ai-elements')).toBe(
      false,
    );
  });

  it('filters coss style and font artifacts', () => {
    expect(passesRegistryFilter({ type: 'registry:ui', name: 'button' }, 'coss')).toBe(true);
    expect(passesRegistryFilter({ type: 'registry:block', name: 'settings' }, 'coss')).toBe(true);
    expect(passesRegistryFilter({ type: 'registry:style', name: 'theme' }, 'coss')).toBe(false);
  });

  it('resolves coss default ui paths', () => {
    const coss = resolveTargetPath(
      '/tmp/web',
      'coss',
      { path: 'registry/default/ui/button.tsx' },
      'button',
    );
    expect(coss).toContain('src/components/coss/button.tsx');
  });

  it('resolves kibo and ai-elements paths', () => {
    const kibo = resolveTargetPath(
      '/tmp/web',
      'kibo',
      { path: 'index.tsx', target: 'components/kibo-ui/kanban/index.tsx' },
      'kanban',
    );
    expect(kibo).toContain('src/components/kibo/kanban/index.tsx');

    const ai = resolveTargetPath(
      '/tmp/web',
      'ai-elements',
      {
        path: 'registry/default/ai-elements/message.tsx',
        target: 'components/ai-elements/message.tsx.tsx',
      },
      'message',
    );
    expect(ai).toContain('src/components/ai-elements/message.tsx');
  });
});
