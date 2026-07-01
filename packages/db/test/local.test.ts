import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { createLocalDataProvider } from '../src/providers/local';

interface Order {
  readonly id: string;
  email: string;
  paid?: boolean;
}

const run = Effect.runPromise;

describe('createLocalDataProvider', () => {
  it('reports its provider name', () => {
    expect(createLocalDataProvider().name).toBe('local');
  });

  it('insert keeps an explicit id and stores the record', async () => {
    const provider = createLocalDataProvider();
    const value = await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));
    expect(value).toEqual({ id: 'o1', email: 'a@b.c' });
  });

  it('insert generates a uuid when the id is empty', async () => {
    const provider = createLocalDataProvider();
    const value = await run(provider.insert<Order>('orders', { id: '', email: 'a@b.c' }));
    expect(value.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('get returns a previously inserted record', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));
    const value = await run(provider.get<Order>('orders', 'o1'));
    expect(value).toEqual({ id: 'o1', email: 'a@b.c' });
  });

  it('get returns null when no record matches', async () => {
    const value = await run(createLocalDataProvider().get<Order>('orders', 'missing'));
    expect(value).toBeNull();
  });

  it('query matches on exact equality across every listed field (AND)', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c', paid: true }));
    await run(provider.insert<Order>('orders', { id: 'o2', email: 'a@b.c', paid: false }));
    await run(provider.insert<Order>('orders', { id: 'o3', email: 'x@y.z', paid: true }));

    const value = await run(provider.query<Order>('orders', { email: 'a@b.c', paid: true }));
    expect(value).toEqual([{ id: 'o1', email: 'a@b.c', paid: true }]);
  });

  it('query with an empty filter returns every record in the collection', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));
    await run(provider.insert<Order>('orders', { id: 'o2', email: 'x@y.z' }));
    const value = await run(provider.query<Order>('orders', {}));
    expect(value).toHaveLength(2);
  });

  it('query on an untouched collection returns an empty array', async () => {
    const value = await run(createLocalDataProvider().query<Order>('orders', { email: 'a@b.c' }));
    expect(value).toEqual([]);
  });

  it('update patches fields and returns the merged record', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));
    const value = await run(provider.update<Order>('orders', 'o1', { email: 'new@b.c' }));
    expect(value).toEqual({ id: 'o1', email: 'new@b.c' });
  });

  it('update persists so a later get reflects the patch', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));
    await run(provider.update<Order>('orders', 'o1', { email: 'new@b.c' }));
    const value = await run(provider.get<Order>('orders', 'o1'));
    expect(value?.email).toBe('new@b.c');
  });

  it('update fails with not_found for an unknown id', async () => {
    const error = await run(
      Effect.flip(createLocalDataProvider().update<Order>('orders', 'gone', { email: 'x@y.z' })),
    );
    expect(error.code).toBe('not_found');
  });

  it('remove deletes the record and returns true', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));

    const removed = await run(provider.remove('orders', 'o1'));
    expect(removed).toBe(true);

    const after = await run(provider.get<Order>('orders', 'o1'));
    expect(after).toBeNull();
  });

  it('remove fails with not_found for an unknown id', async () => {
    const error = await run(Effect.flip(createLocalDataProvider().remove('orders', 'gone')));
    expect(error.code).toBe('not_found');
  });

  it('isolates collections and starts empty per instance', async () => {
    const provider = createLocalDataProvider();
    await run(provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' }));
    const others = await run(provider.query<Order>('invoices', {}));
    expect(others).toEqual([]);
  });
});
