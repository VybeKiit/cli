import { describe, expect, it } from 'vitest';
import {
  EXTENDED_SERVICE_NAME_BANS,
  PAYMENTS_VOCABULARY,
  renderPaymentsVocabularyTable,
  renderServiceNameBanList,
} from '../../src/vocabulary/domainVocabulary';

describe('PAYMENTS_VOCABULARY', () => {
  it('includes MoR and tax terms', () => {
    expect(PAYMENTS_VOCABULARY.some((e) => e.jargon.includes('MoR'))).toBe(true);
    expect(PAYMENTS_VOCABULARY.length).toBeGreaterThanOrEqual(5);
  });
});

describe('renderPaymentsVocabularyTable', () => {
  it('renders a markdown table', () => {
    const table = renderPaymentsVocabularyTable();
    expect(table).toContain("Don't say (jargon)");
    expect(table).toContain('recurring charge');
  });
});

describe('renderServiceNameBanList', () => {
  it('merges with existing bans without duplicates', () => {
    const list = renderServiceNameBanList(['Supabase', 'Stripe']);
    expect(list).toContain('**Supabase**');
    expect(list).toContain('**Stripe**');
    expect(list.split('**Stripe**').length).toBe(2);
    expect(EXTENDED_SERVICE_NAME_BANS).toContain('Vercel');
  });
});
