import { beforeEach, describe, expect, it } from 'vitest';
import { resetMemoryPriceLadderForTests } from '@/lib/priceLadderStore';
import { GET, POST } from '../route';

describe('POST /api/dev/price-ladder (test mode e2e)', () => {
  beforeEach(() => {
    resetMemoryPriceLadderForTests();
  });

  it('returns status at $29', async () => {
    const res = await POST(
      new Request('http://localhost/api/dev/price-ladder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      snapshot: { amount: number; saleCount: number; nextAmount: number };
    };
    expect(body.snapshot.amount).toBe(29);
    expect(body.snapshot.saleCount).toBe(0);
    expect(body.snapshot.nextAmount).toBe(32);
  });

  it('simulates sales and climbs the ladder', async () => {
    const sale = async (orderId: string) => {
      const res = await POST(
        new Request('http://localhost/api/dev/price-ladder', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'simulate-sale', orderId }),
        }),
      );
      expect(res.status).toBe(200);
      return res.json() as Promise<{
        bumped: boolean;
        paidAmount: number | null;
        snapshot: { amount: number; saleCount: number };
      }>;
    };

    const a = await sale('e2e-1');
    expect(a.bumped).toBe(true);
    expect(a.paidAmount).toBe(29);
    expect(a.snapshot.amount).toBe(32);

    const b = await sale('e2e-2');
    expect(b.paidAmount).toBe(32);
    expect(b.snapshot.amount).toBe(35);

    const dup = await sale('e2e-1');
    expect(dup.bumped).toBe(false);
    expect(dup.snapshot.saleCount).toBe(2);
  });

  it('resets to the first rung', async () => {
    await POST(
      new Request('http://localhost/api/dev/price-ladder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'simulate-sale', orderId: 'x' }),
      }),
    );
    const res = await POST(
      new Request('http://localhost/api/dev/price-ladder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      }),
    );
    const body = (await res.json()) as { snapshot: { amount: number; saleCount: number } };
    expect(body.snapshot.amount).toBe(29);
    expect(body.snapshot.saleCount).toBe(0);
  });

  it('returns jump table for the first rungs', async () => {
    const res = await POST(
      new Request('http://localhost/api/dev/price-ladder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'jumps', steps: 4 }),
      }),
    );
    const body = (await res.json()) as {
      jumps: readonly { saleIndex: number; amount: number }[];
    };
    expect(body.jumps.map((j) => j.amount)).toEqual([29, 32, 35, 39]); // steps: 4
  });

  it('GET status works in test mode', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { snapshot: { display: string } };
    expect(body.snapshot.display).toBe('$29');
  });
});
