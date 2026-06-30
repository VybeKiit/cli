import { BUILDER_TOOL_MARKS, PRODUCT_STACK_MARKS } from '@/data/landing';
import { VIBE_HINTS } from '@/data/vibe-hints';
import { describe, expect, it } from 'vitest';

function allBrandMarkSlugs(): string[] {
  const slugs = new Set<string>();
  for (const mark of BUILDER_TOOL_MARKS) {
    slugs.add(mark.slug);
  }
  for (const mark of PRODUCT_STACK_MARKS) {
    slugs.add(mark.slug);
  }
  return [...slugs].sort();
}

describe('VIBE_HINTS', () => {
  it('defines a non-empty hint for every builder-tool and product-stack slug', () => {
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
});
