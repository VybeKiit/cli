import { describe, expect, it } from 'vitest';
import { loadCatalog, searchComponents, suggestBlend } from './catalog.js';

const sampleCatalog = {
  version: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  componentCount: 2,
  sources: { magicui: 1, aceternity: 1 },
  components: [
    {
      source: 'magicui',
      name: 'marquee',
      paths: ['src/components/magicui/marquee.tsx'],
      dependencies: ['motion'],
      tags: ['animated', 'marketing'],
      portable: false,
      category: 'component',
    },
    {
      source: 'aceternity',
      name: 'hero-parallax',
      paths: ['src/components/aceternity/hero-parallax.tsx'],
      dependencies: ['motion'],
      tags: ['hero', 'animated'],
      portable: false,
      category: 'hero',
    },
  ],
};

describe('ui-catalog-mcp catalog', () => {
  it('searches by keyword with slim fields by default', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const page = searchComponents(catalog, 'hero');
    expect(page.items[0]?.name).toBe('hero-parallax');
    expect(page.total).toBe(1);
    expect('paths' in (page.items[0] ?? {})).toBe(false);
    expect(page.items[0]?.score).toBeGreaterThan(0);
  });

  it('returns full fields when requested', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const page = searchComponents(catalog, 'marquee', { fields: 'full' });
    expect(page.items[0]).toMatchObject({
      name: 'marquee',
      paths: ['src/components/magicui/marquee.tsx'],
    });
  });

  it('matches typos via fuzzy scoring', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const page = searchComponents(catalog, 'herro');
    expect(page.items.some((item) => item.name === 'hero-parallax')).toBe(true);
  });

  it('paginates with cursor', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const first = searchComponents(catalog, '', { limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.hasMore).toBe(true);
    expect(first.nextCursor).not.toBeNull();

    const second = searchComponents(
      catalog,
      '',
      first.nextCursor === null || first.nextCursor === undefined
        ? { limit: 1 }
        : { limit: 1, cursor: first.nextCursor },
    );
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.name).not.toBe(first.items[0]?.name);
    expect(second.hasMore).toBe(false);
  });

  it('suggests blend for hero intent', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const suggestions = suggestBlend(catalog, 'animated hero landing');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.source === 'aceternity')).toBe(true);
  });
});
