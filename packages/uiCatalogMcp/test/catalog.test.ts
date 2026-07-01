import { describe, expect, it } from 'vitest';
import { loadCatalog, searchComponents, suggestBlend } from '../src/catalog.js';

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
  it('searches by keyword', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const results = searchComponents(catalog, 'hero');
    expect(results[0]?.name).toBe('hero-parallax');
  });

  it('suggests blend for hero intent', () => {
    const catalog = loadCatalog(JSON.stringify(sampleCatalog));
    const suggestions = suggestBlend(catalog, 'animated hero landing');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.source === 'aceternity')).toBe(true);
  });
});
