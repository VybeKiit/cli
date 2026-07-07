// biome-ignore-all lint/complexity/noExcessiveLinesPerFunction: Mongo provider contract cases stay grouped for auditability.
import { createMongoDataProvider } from '@vybekiit/db/providers/mongodb';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Per-test handles to the mocked collection methods, so each case can stub a return
 * value or a rejection and then assert the exact driver call the adapter made.
 */
const collectionMethods = {
  insertOne: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  findOneAndUpdate: vi.fn(),
  deleteOne: vi.fn(),
};
const collection = vi.fn(() => collectionMethods);

vi.mock('mongodb', () => ({
  MongoClient: class {
    db() {
      return { collection };
    }
  },
}));

const config = { MONGODB_URI: 'mongodb+srv://x', MONGODB_DB: 'app' };
const run = Effect.runPromise;

type Order = {
  readonly id: string;
  readonly email: string;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createMongoDataProvider', () => {
  it('reports its provider name', () => {
    expect(createMongoDataProvider(config).name).toBe('mongodb');
  });

  it('insert calls insertOne and returns the record', async () => {
    collectionMethods.insertOne.mockResolvedValue({ insertedId: 'x' });
    const provider = createMongoDataProvider(config);
    const order: Order = { id: 'o1', email: 'a@b.c' };

    const value = await run(provider.insert('orders', order));

    expect(collection).toHaveBeenCalledWith('orders');
    expect(collectionMethods.insertOne).toHaveBeenCalledWith({ id: 'o1', email: 'a@b.c' });
    expect(value).toEqual(order);
  });

  it('get fetches by id and projects out Mongo _id', async () => {
    collectionMethods.findOne.mockResolvedValue({ id: 'o1', email: 'a@b.c' });
    const provider = createMongoDataProvider(config);

    const value = await run(provider.get<Order>('orders', 'o1'));

    expect(collectionMethods.findOne).toHaveBeenCalledWith(
      { id: 'o1' },
      { projection: { _id: 0 } },
    );
    expect(value).toEqual({ id: 'o1', email: 'a@b.c' });
    expect(value !== null && '_id' in value).toBe(false);
  });

  it('get returns null when no document matches', async () => {
    collectionMethods.findOne.mockResolvedValue(null);
    const value = await run(createMongoDataProvider(config).get<Order>('orders', 'missing'));
    expect(value).toBeNull();
  });

  it('get maps a driver error to fail("db_get_failed")', async () => {
    collectionMethods.findOne.mockRejectedValue(new Error('connection reset'));
    const error = await run(
      Effect.flip(createMongoDataProvider(config).get<Order>('orders', 'o1')),
    );
    expect(error.code).toBe('db_get_failed');
    expect(error.message).toBe('connection reset');
  });

  it('query runs find(filter).toArray() with the _id projection', async () => {
    const toArray = vi.fn().mockResolvedValue([{ id: 'o1', email: 'a@b.c' }]);
    collectionMethods.find.mockReturnValue({ toArray });
    const provider = createMongoDataProvider(config);

    const value = await run(provider.query<Order>('orders', { email: 'a@b.c' }));

    expect(collectionMethods.find).toHaveBeenCalledWith(
      { email: 'a@b.c' },
      { projection: { _id: 0 } },
    );
    expect(value).toEqual([{ id: 'o1', email: 'a@b.c' }]);
  });

  it('update sets the patch and returns the post-update doc', async () => {
    collectionMethods.findOneAndUpdate.mockResolvedValue({ id: 'o1', email: 'new@b.c' });
    const provider = createMongoDataProvider(config);

    const value = await run(provider.update<Order>('orders', 'o1', { email: 'new@b.c' }));

    expect(collectionMethods.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'o1' },
      { $set: { email: 'new@b.c' } },
      { returnDocument: 'after', projection: { _id: 0 } },
    );
    expect(value).toEqual({ id: 'o1', email: 'new@b.c' });
  });

  it('update fails when no document matches the id', async () => {
    collectionMethods.findOneAndUpdate.mockResolvedValue(null);
    const error = await run(
      Effect.flip(
        createMongoDataProvider(config).update<Order>('orders', 'gone', { email: 'x@y.z' }),
      ),
    );
    expect(error.code).toBe('db_update_failed');
  });

  it('remove deletes by id and returns true', async () => {
    collectionMethods.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const provider = createMongoDataProvider(config);

    const value = await run(provider.remove('orders', 'o1'));

    expect(collectionMethods.deleteOne).toHaveBeenCalledWith({ id: 'o1' });
    expect(value).toBe(true);
  });
});
