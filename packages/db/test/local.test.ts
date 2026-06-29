import { describe, expect, it } from 'vitest';
import { createLocalDataProvider } from '../src/providers/local/index';

interface Order {
  readonly id: string;
  email: string;
  paid?: boolean;
}

describe('createLocalDataProvider', () => {
  it('reports its provider name', () => {
    expect(createLocalDataProvider().name).toBe('local');
  });

  it('insert keeps an explicit id and stores the record', async () => {
    const provider = createLocalDataProvider();
    const result = await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });
    expect(result.ok && result.value).toEqual({ id: 'o1', email: 'a@b.c' });
  });

  it('insert generates a uuid when the id is empty', async () => {
    const provider = createLocalDataProvider();
    const result = await provider.insert<Order>('orders', { id: '', email: 'a@b.c' });
    expect(result.ok && result.value.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('get returns a previously inserted record', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });
    const result = await provider.get<Order>('orders', 'o1');
    expect(result.ok && result.value).toEqual({ id: 'o1', email: 'a@b.c' });
  });

  it('get returns null when no record matches', async () => {
    const result = await createLocalDataProvider().get<Order>('orders', 'missing');
    expect(result.ok && result.value).toBeNull();
  });

  it('query matches on exact equality across every listed field (AND)', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c', paid: true });
    await provider.insert<Order>('orders', { id: 'o2', email: 'a@b.c', paid: false });
    await provider.insert<Order>('orders', { id: 'o3', email: 'x@y.z', paid: true });

    const result = await provider.query<Order>('orders', { email: 'a@b.c', paid: true });
    expect(result.ok && result.value).toEqual([{ id: 'o1', email: 'a@b.c', paid: true }]);
  });

  it('query with an empty filter returns every record in the collection', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });
    await provider.insert<Order>('orders', { id: 'o2', email: 'x@y.z' });
    const result = await provider.query<Order>('orders', {});
    expect(result.ok && result.value).toHaveLength(2);
  });

  it('query on an untouched collection returns an empty array', async () => {
    const result = await createLocalDataProvider().query<Order>('orders', { email: 'a@b.c' });
    expect(result.ok && result.value).toEqual([]);
  });

  it('update patches fields and returns the merged record', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });
    const result = await provider.update<Order>('orders', 'o1', { email: 'new@b.c' });
    expect(result.ok && result.value).toEqual({ id: 'o1', email: 'new@b.c' });
  });

  it('update persists so a later get reflects the patch', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });
    await provider.update<Order>('orders', 'o1', { email: 'new@b.c' });
    const result = await provider.get<Order>('orders', 'o1');
    expect(result.ok && result.value?.email).toBe('new@b.c');
  });

  it('update fails with not_found for an unknown id', async () => {
    const result = await createLocalDataProvider().update<Order>('orders', 'gone', {
      email: 'x@y.z',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not_found');
  });

  it('remove deletes the record and returns true', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });

    const removed = await provider.remove('orders', 'o1');
    expect(removed.ok && removed.value).toBe(true);

    const after = await provider.get<Order>('orders', 'o1');
    expect(after.ok && after.value).toBeNull();
  });

  it('remove fails with not_found for an unknown id', async () => {
    const result = await createLocalDataProvider().remove('orders', 'gone');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not_found');
  });

  it('isolates collections and starts empty per instance', async () => {
    const provider = createLocalDataProvider();
    await provider.insert<Order>('orders', { id: 'o1', email: 'a@b.c' });
    const others = await provider.query<Order>('invoices', {});
    expect(others.ok && others.value).toEqual([]);
  });
});
