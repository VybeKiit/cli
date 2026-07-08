import { LS_FIELD_FALLBACKS } from '@vybekiit/browser-automation/domains/payments/ls/dashboard/fieldFallbacks';
import { LS_DRAFT_FIELDS } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import { LS_PRODUCT_FIELD_HINTS } from '@vybekiit/browser-automation/domains/payments/ls/selectors/hints';
import { describe, expect, it } from 'vitest';

describe('LS draft field coverage', () => {
  it('every product editor field has a runtime fallback and probe hint', () => {
    const hinted = new Set(LS_PRODUCT_FIELD_HINTS.map((h) => h.fieldKey));
    for (const key of LS_DRAFT_FIELDS) {
      if (!key.startsWith('dashboard.')) {
        expect(LS_FIELD_FALLBACKS[key], `${key} fallback`).toBeDefined();
        expect(hinted.has(key), `${key} hint`).toBe(true);
      }
    }
  });
});
