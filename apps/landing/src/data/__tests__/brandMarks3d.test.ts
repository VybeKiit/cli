import { describe, expect, it } from 'vitest';
import { HERO_STACK_MARKS } from '@/data/brandMarks3d';
import { PRODUCT_STACK_MARKS } from '@/data/landing';

describe('hero stack marks manifest', () => {
  it('lists all product-stack slugs with valid orbit fields and tier-aware src', () => {
    const productSlugs = new Set(PRODUCT_STACK_MARKS.map((m) => m.slug));
    const manifestSlugs = HERO_STACK_MARKS.map((m) => m.slug);

    expect(manifestSlugs.length).toBe(PRODUCT_STACK_MARKS.length);
    expect(new Set(manifestSlugs).size).toBe(manifestSlugs.length);

    for (const entry of HERO_STACK_MARKS) {
      expect(productSlugs.has(entry.slug)).toBe(true);
      expect(entry.tier === '3d' || entry.tier === '2d').toBe(true);

      if (entry.tier === '3d') {
        expect(entry.src).toMatch(/^\/brand-marks-3d\/.+\.webp$/);
      } else {
        expect(entry.src).toMatch(/^\/brand-marks\/.+\.webp$/);
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
