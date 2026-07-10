import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type DataProvider, type DbRecord, DbError } from '@vybekiit/db';
import type { OrderEvent } from '@vybekiit/payments';
import { fulfillOrder } from '@/lib/fulfillment';

const mocks = vi.hoisted(() => ({
  resolveDataProvider: vi.fn(),
}));

vi.mock('@vybekiit/db', async (importOriginal: () => Promise<typeof import('@vybekiit/db')>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    resolveDataProvider: mocks.resolveDataProvider,
  };
});

interface CapturedUpsert {
  readonly collection: string;
  readonly record: DbRecord;
  readonly conflictKey: string;
}

const orderEvent: OrderEvent = {
  provider: 'lemon-squeezy',
  eventName: 'order_created',
  orderId: 'order_1',
  customerEmail: null,
  customerName: null,
  githubUsername: null,
  isRefund: false,
};

const unusedRecordEffect = <T extends DbRecord>(message: string): Effect.Effect<T, DbError> =>
  Effect.fail(new DbError({ code: 'not_used', message }));

const makeUpsertProvider = (upsert: NonNullable<DataProvider['upsert']>): DataProvider => ({
  name: 'supabase',
  capabilities: { upsert: true },
  insert: (collection, record) =>
    unusedRecordEffect(`Unexpected insert into ${collection} for ${record.id}.`),
  get: (collection, id) => {
    void collection;
    void id;
    return Effect.succeed(null);
  },
  query: (collection) => {
    void collection;
    return Effect.succeed([]);
  },
  update: (collection, id) => unusedRecordEffect(`Unexpected update for ${id} in ${collection}.`),
  remove: (collection, id) =>
    Effect.fail(
      new DbError({ code: 'not_used', message: `Unexpected remove for ${id} in ${collection}.` }),
    ),
  upsert,
});

describe('fulfillOrder', () => {
  beforeEach(() => {
    mocks.resolveDataProvider.mockReset();
  });

  it('records nullable customer fields without blank fallbacks', async () => {
    let captured: CapturedUpsert | null = null;
    const upsert: NonNullable<DataProvider['upsert']> = (collection, record, conflictKey) => {
      captured = { collection, record, conflictKey };
      return Effect.succeed(record);
    };
    mocks.resolveDataProvider.mockReturnValue(makeUpsertProvider(upsert));

    const result = await fulfillOrder(orderEvent);

    expect(result).toEqual({ ok: true, value: true });
    expect(captured).toEqual({
      collection: 'orders',
      conflictKey: 'order_id',
      record: {
        id: 'order_1',
        order_id: 'order_1',
        email: null,
        github_username: null,
        refunded: false,
      },
    });
  });
});
