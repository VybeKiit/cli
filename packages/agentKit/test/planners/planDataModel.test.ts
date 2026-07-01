import { describe, expect, it } from 'vitest';

import { planDataModel, renderDataModelSummary } from '../../src/planners/planDataModel';

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
    expect(plan.migrations[0]?.sql).toMatch(/references customer\(id\)/);
    expect(plan.buyerSummary).not.toMatch(/primary key|foreign key|schema|migration/i);
    expect(renderDataModelSummary(plan)).toBe(plan.buyerSummary);
  });
});
