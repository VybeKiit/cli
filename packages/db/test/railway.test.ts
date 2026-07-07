import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const sqlMock = vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>>(
  () => Promise.resolve([]),
);

vi.mock('@neondatabase/serverless', () => ({
  neon: () => sqlMock,
}));

import { createRailwayDataProvider } from '@vybekiit/db/providers/railway';

const run = Effect.runPromise;

describe('railway data provider', () => {
  it('inserts and reads a record', async () => {
    sqlMock.mockImplementation((strings: TemplateStringsArray, ..._values: unknown[]) => {
      const query = strings.join('');
      if (query.includes('INSERT')) {
        return Promise.resolve([]);
      }
      if (query.includes('SELECT') && query.includes('LIMIT')) {
        return Promise.resolve([{ id: 'a1', payload: { email: 'a@test.com' } }]);
      }
      if (query.includes('SELECT')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const provider = createRailwayDataProvider({
      DATABASE_URL: 'postgresql://localhost/railway',
    });

    await run(provider.insert('users', { id: 'a1', email: 'a@test.com' }));

    const fetched = await run(provider.get<{ id: string; email: string }>('users', 'a1'));
    expect(fetched?.email).toBe('a@test.com');
  });
});
