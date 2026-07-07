import { planDataModel, renderDataModelSummary } from '@vybekiit/agent-kit/planners/planDataModel';
import { describe, expect, it } from 'vitest';

// "references customer(id)" -> true
const CUSTOMER_REFERENCE_PATTERN = /references customer\(id\)/;

// "primary key" -> true, "remember customers" -> false
const INTERNAL_DB_JARGON_PATTERN = /primary key|foreign key|schema|migration/i;

describe('planDataModel', () => {
  it('produces FK internally for customers + orders without PK jargon in summary', () => {
    const plan = planDataModel(
      [
        {
          name: 'customer',
          fields: [
            { name: 'name', type: 'string' },
            { name: 'email', type: 'string' },
          ],
        },
        {
          name: 'order',
          fields: [
            { name: 'total', type: 'number' },
            { name: 'placed_at', type: 'date' },
          ],
          relatesTo: [{ entity: 'customer', cardinality: 'one' }],
        },
      ],
      'supabase',
    );

    expect(plan.relations).toHaveLength(1);
    expect(plan.relations[0]?.foreignKey).toBe('customer_id');
    expect(plan.migrations[0]?.sql).toMatch(CUSTOMER_REFERENCE_PATTERN);
    expect(plan.buyerSummary).not.toMatch(INTERNAL_DB_JARGON_PATTERN);
    expect(renderDataModelSummary(plan)).toBe(plan.buyerSummary);
  });
});
