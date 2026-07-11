import { describe, expect, it } from 'vitest';
import {
  ALL_DISCOVERABILITY_PAGES,
  COMPARE_VS_SLUGS,
  findDiscoverabilityPage,
  ROOT_GEO_SLUGS,
} from '@/data/discoverability/catalog';
import { findGeoPage, GEO_PAGES } from '@/data/discoverability/geoPages';
import { buildLlmsFullDocument } from '@/data/discoverability/llmsFull';
import { QUICK_PICKS } from '@/data/discoverability/quickPick';
import { FAQ } from '@/data/faq';

describe('discoverability catalog', () => {
  it('lists unique paths covering home, compare, wedges, alternatives, and vs pages', () => {
    const paths = ALL_DISCOVERABILITY_PAGES.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toContain('/');
    expect(paths).toContain('/compare');
    expect(paths).toContain('/shipfast-alternative');
    expect(paths).toContain('/vibe-coding-saas');
    expect(paths).toContain('/compare/vybekiit-vs-shipfast');
  });

  it('has GEO long-form content for every non-core catalog path', () => {
    const core = new Set(['/', '/compare', '/brand', '/privacy', '/terms']);
    for (const page of ALL_DISCOVERABILITY_PAGES) {
      if (core.has(page.path)) {
        continue;
      }
      const geo = findGeoPage(page.path);
      expect(geo, `missing geo body for ${page.path}`).toBeDefined();
      expect(geo?.lead.length ?? 0).toBeGreaterThan(80);
    }
  });

  it('keeps root and compare slug lists aligned with geo pages', () => {
    for (const slug of ROOT_GEO_SLUGS) {
      expect(findGeoPage(`/${slug}`)).toBeDefined();
    }
    for (const slug of COMPARE_VS_SLUGS) {
      expect(findGeoPage(`/compare/${slug}`)).toBeDefined();
    }
    expect(GEO_PAGES.length).toBe(ROOT_GEO_SLUGS.length + COMPARE_VS_SLUGS.length);
  });

  it('ships GEO FAQ density and quick picks', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(8);
    expect(FAQ.some((item) => item.question.includes('non-technical'))).toBe(true);
    expect(QUICK_PICKS.some((item) => item.pick.includes('VybeKiit'))).toBe(true);
    expect(findDiscoverabilityPage('/compare')?.priority).toBeGreaterThan(0.9);
  });

  it('builds llms-full with brand facts and page index', () => {
    const doc = buildLlmsFullDocument();
    expect(doc).toContain('VybeKiit');
    expect(doc).toContain('/compare');
    expect(doc).toContain('## FAQ');
    expect(doc).toContain('llms.txt');
  });
});
