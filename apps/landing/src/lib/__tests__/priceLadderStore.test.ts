import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyPaidSaleToLadder,
  getPriceLadderSnapshot,
  resetMemoryPriceLadderForTests,
  resetPriceLadder,
} from '@/lib/priceLadderStore';

describe('price ladder store (memory / test mode)', () => {
  beforeEach(() => {
    resetMemoryPriceLadderForTests();
  });

  it('starts at first-buyer price', async () => {
    const snap = await getPriceLadderSnapshot();
    expect(snap.amount).toBe(29);
    expect(snap.saleCount).toBe(0);
    expect(snap.nextAmount).toBe(32);
  });

  it('bumps after each unique paid order', async () => {
    const first = await applyPaidSaleToLadder('ord_1');
    expect(first.bumped).toBe(true);
    expect(first.paidAmount).toBe(29);
    expect(first.snapshot.amount).toBe(32);
    expect(first.snapshot.saleCount).toBe(1);

    const second = await applyPaidSaleToLadder('ord_2');
    expect(second.bumped).toBe(true);
    expect(second.paidAmount).toBe(32);
    expect(second.snapshot.amount).toBe(35);
  });

  it('is idempotent on the same order id', async () => {
    await applyPaidSaleToLadder('ord_dup');
    const again = await applyPaidSaleToLadder('ord_dup');
    expect(again.bumped).toBe(false);
    expect(again.snapshot.saleCount).toBe(1);
    expect(again.snapshot.amount).toBe(32);
  });

  it('reset restores $29', async () => {
    await applyPaidSaleToLadder('a');
    await applyPaidSaleToLadder('b');
    const snap = await resetPriceLadder();
    expect(snap.amount).toBe(29);
    expect(snap.saleCount).toBe(0);

    const after = await applyPaidSaleToLadder('c');
    expect(after.paidAmount).toBe(29);
    expect(after.snapshot.amount).toBe(32);
  });

  it('walks several e2e rungs in sequence', async () => {
    const expectedPaid = [29, 32, 35, 39, 42];
    for (let i = 0; i < expectedPaid.length; i++) {
      const result = await applyPaidSaleToLadder(`e2e_${i}`);
      expect(result.bumped).toBe(true);
      expect(result.paidAmount).toBe(expectedPaid[i]);
    }
    const snap = await getPriceLadderSnapshot();
    expect(snap.amount).toBe(47);
    expect(snap.saleCount).toBe(5);
  });
});
