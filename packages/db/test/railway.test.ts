import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';

const sqlMock = vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>>(
  async () => [],
);

vi.mock('@neondatabase/serverless', () => ({
  neon: () => sqlMock,
}));

import { createRailwayDataProvider } from '../src/providers/railway';

const run = Effect.runPromise;

describe('railway data provider', () => {
  it('inserts and reads a record', async () => {
    sqlMock.mockImplementation(async (strings: TemplateStringsArray, ..._values: unknown[]) => {
      const query = strings.join('');
      if (query.includes('INSERT')) return [];
      if (query.includes('SELECT') && query.includes('LIMIT')) {
        return [{ id: 'a1', payload: { email: 'a@test.com' } }];
      }
      if (query.includes('SELECT')) return [];
      return [];
    });

    const provider = createRailwayDataProvider({
      DATABASE_URL: 'postgresql://user:pass@localhost/railway',
    });

    await run(provider.insert('users', { id: 'a1', email: 'a@test.com' }));

    const fetched = await run(provider.get<{ id: string; email: string }>('users', 'a1'));
    expect(fetched?.email).toBe('a@test.com');
  });
});
