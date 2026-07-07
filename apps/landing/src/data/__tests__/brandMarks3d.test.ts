import { describe, expect, it } from 'vitest';
import { HERO_STACK_MARKS } from '@/data/brandMarks3d';
import { PRODUCT_STACK_MARKS } from '@/data/landing';

// /brand-marks-3d/figma.webp -> match
const THREE_D_MARK_SRC_PATTERN = /^\/brand-marks-3d\/.+\.webp$/;
// /brand-marks/nextdotjs.webp -> match
const TWO_D_MARK_SRC_PATTERN = /^\/brand-marks\/.+\.webp$/;

describe('hero stack marks manifest', () => {
  it('lists all product-stack slugs with valid orbit fields and tier-aware src', () => {
    const productSlugs = new Set(PRODUCT_STACK_MARKS.map((m) => m.slug));
    const manifestSlugs = HERO_STACK_MARKS.map((m) => m.slug);
    const manifestSlugSet = new Set(manifestSlugs);

    expect(new Set(manifestSlugs).size).toBe(manifestSlugs.length);
    for (const slug of productSlugs) {
      expect(manifestSlugSet.has(slug), slug).toBe(true);
    }

    for (const entry of HERO_STACK_MARKS) {
      expect(entry.tier === '3d' || entry.tier === '2d').toBe(true);

      if (entry.tier === '3d') {
        expect(entry.src).toMatch(THREE_D_MARK_SRC_PATTERN);
      } else {
        expect(entry.src).toMatch(TWO_D_MARK_SRC_PATTERN);
      }

      expect(entry.x).toBeGreaterThanOrEqual(0);
      expect(entry.x).toBeLessThanOrEqual(1);
      expect(entry.y).toBeGreaterThanOrEqual(0);
      expect(entry.y).toBeLessThanOrEqual(1);
      expect(entry.scale).toBeGreaterThan(0);
      expect(entry).not.toHaveProperty('spinSpeed');
    }
  });
});
