import { describe, expect, it } from 'vitest';
import { BUILDER_TOOL_MARKS, PRODUCT_STACK_MARKS } from '@/data/landing';
import { VIBE_HINTS } from '@/data/vibeHints';
import { AI_CODING_AGENTS_STRIP, TECH_TRUST_STRIP } from '@/data/visitorLanding';
import { LANDING_LOCALES } from '@/i18n/locales';
import { vibeHintFor, vibeHintsForLocale } from '@/i18n/vibeHints';
import { arVibeHints } from '@/i18n/vibeHints/ar';
import { heVibeHints } from '@/i18n/vibeHints/he';
import { ruVibeHints } from '@/i18n/vibeHints/ru';

const allBrandMarkSlugs = (): string[] => {
  const slugs = new Set<string>();
  for (const mark of BUILDER_TOOL_MARKS) {
    slugs.add(mark.slug);
  }
  for (const mark of PRODUCT_STACK_MARKS) {
    slugs.add(mark.slug);
  }
  for (const mark of AI_CODING_AGENTS_STRIP.marks) {
    slugs.add(mark.slug);
  }
  for (const mark of TECH_TRUST_STRIP.marks) {
    slugs.add(mark.slug);
  }
  return [...slugs].sort();
};

describe('VIBE_HINTS', () => {
  it('defines a non-empty hint for every builder, stack, and trust-strip slug', () => {
    for (const slug of allBrandMarkSlugs()) {
      const hint = VIBE_HINTS[slug];
      expect(hint, `missing vibe hint for slug "${slug}"`).toBeDefined();
      expect(hint?.trim().length, `empty vibe hint for slug "${slug}"`).toBeGreaterThan(0);
    }
  });

  it('does not define orphan hints without a matching brand mark', () => {
    const known = new Set(allBrandMarkSlugs());
    for (const slug of Object.keys(VIBE_HINTS)) {
      expect(known.has(slug), `orphan vibe hint for slug "${slug}"`).toBe(true);
    }
  });

  it('ships full localized catalogs for he / ru / ar with the same keys as English', () => {
    const enKeys = Object.keys(VIBE_HINTS).sort();
    for (const [locale, catalog] of [
      ['he', heVibeHints],
      ['ru', ruVibeHints],
      ['ar', arVibeHints],
    ] as const) {
      expect(Object.keys(catalog).sort(), `${locale} vibe hint keys`).toEqual(enKeys);
      for (const slug of enKeys) {
        expect(
          catalog[slug]?.trim().length,
          `${locale} empty vibe hint for ${slug}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('resolves locale-specific zed hint (the regression that shipped English in HE)', () => {
    expect(vibeHintFor('he', 'zed')).toMatch(/עורך/);
    expect(vibeHintFor('ru', 'zed')).toMatch(/редактор/i);
    expect(vibeHintFor('ar', 'zed')).toMatch(/محرر/);
    expect(vibeHintFor('en', 'zed')).toMatch(/Fast editor/);
  });

  it('covers every picker locale with a catalog', () => {
    for (const entry of LANDING_LOCALES) {
      const hints = vibeHintsForLocale(entry.id);
      expect(Object.keys(hints).length).toBeGreaterThan(0);
    }
  });
});
