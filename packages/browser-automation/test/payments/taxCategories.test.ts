import { describe, expect, it } from 'vitest';

import {
  LS_DEFAULT_TAX_CATEGORY,
  LS_TAX_CATEGORY_OPTIONS,
} from '../../src/domains/payments/ls/selectors/taxCategories';

describe('LS_TAX_CATEGORY_OPTIONS', () => {
  it('lists 12 unique Lemon Squeezy tax categories', () => {
    expect(LS_TAX_CATEGORY_OPTIONS).toHaveLength(12);
    expect(new Set(LS_TAX_CATEGORY_OPTIONS).size).toBe(12);
  });

  it('defaults to SaaS personal use', () => {
    expect(LS_DEFAULT_TAX_CATEGORY).toBe('Software as a service (SaaS) - personal use');
  });
});
