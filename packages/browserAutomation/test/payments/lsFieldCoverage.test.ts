import { describe, expect, it } from 'vitest';

import { LS_FIELD_FALLBACKS } from '../../src/domains/payments/ls/dashboard/fieldFallbacks';
import { LS_DRAFT_FIELDS } from '../../src/domains/payments/ls/selectors/fields';
import { LS_PRODUCT_FIELD_HINTS } from '../../src/domains/payments/ls/selectors/hints';

describe('LS draft field coverage', () => {
  it('every product editor field has a runtime fallback and probe hint', () => {
    const hinted = new Set(LS_PRODUCT_FIELD_HINTS.map((h) => h.fieldKey));
    for (const key of LS_DRAFT_FIELDS) {
      if (key.startsWith('dashboard.')) continue;
      expect(LS_FIELD_FALLBACKS[key], `${key} fallback`).toBeDefined();
      expect(hinted.has(key), `${key} hint`).toBe(true);
    }
  });
});
