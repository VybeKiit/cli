import { describe, expect, it, vi } from 'vitest';

const sqlMock = vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>>(
  async () => [],
);

vi.mock('@neondatabase/serverless', () => ({
  neon: () => sqlMock,
}));

import { createNeonDataProvider } from '../src/providers/neon/index';

describe('neon data provider', () => {
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

    const provider = createNeonDataProvider({
      DATABASE_URL: 'postgresql://user:pass@localhost/neondb',
    });

    const inserted = await provider.insert('users', { id: 'a1', email: 'a@test.com' });
    expect(inserted.ok).toBe(true);

    const fetched = await provider.get<{ id: string; email: string }>('users', 'a1');
    expect(fetched.ok).toBe(true);
    if (fetched.ok) {
      expect(fetched.value?.email).toBe('a@test.com');
    }
  });
});
