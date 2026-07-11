import { describe, expect, it } from 'vitest';
import { runDocFallback, searchTechIds } from './techSearch.js';

describe('searchTechIds', () => {
  it('finds stripe', () => {
    const page = searchTechIds('stripe');
    expect(page.items.some((item) => item.id === 'stripe')).toBe(true);
  });
});

describe('runDocFallback', () => {
  it('returns a found plan for known tech', () => {
    const plan = runDocFallback('twilio');
    expect(plan.found).toBe(true);
    expect(plan.docsUrl).toContain('twilio');
    expect(plan.builderMessage.length).toBeGreaterThan(0);
  });

  it('returns not found for unknown tech', () => {
    const plan = runDocFallback('not-a-real-provider-xyz');
    expect(plan.found).toBe(false);
  });
});
