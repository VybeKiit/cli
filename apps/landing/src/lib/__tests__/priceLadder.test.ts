import { describe, expect, it } from 'vitest';
import {
  formatUsd,
  ladderJumpTable,
  PRICE_LADDER,
  priceCentsAfterSales,
  priceUsdAfterSales,
  savingsPercentOffCeiling,
  snapshotFromSaleCount,
} from '@/lib/priceLadder';

describe('price ladder math', () => {
  it('starts at $29 for the first buyer', () => {
    expect(priceUsdAfterSales(0)).toBe(29);
    expect(priceCentsAfterSales(0)).toBe(2900);
    expect(formatUsd(29)).toBe('$29');
  });

  it('raises ~10% per sale with whole-dollar rounding (compound from start)', () => {
    // 29 * 1.1^n, round half-up to nearest dollar
    expect(priceUsdAfterSales(1)).toBe(32);
    expect(priceUsdAfterSales(2)).toBe(35);
    expect(priceUsdAfterSales(3)).toBe(39);
    expect(priceUsdAfterSales(4)).toBe(42);
    expect(priceUsdAfterSales(5)).toBe(47);
    expect(priceUsdAfterSales(9)).toBe(68);
    expect(priceUsdAfterSales(14)).toBe(110);
  });

  it('caps at the $655 ceiling', () => {
    expect(priceUsdAfterSales(40)).toBe(PRICE_LADDER.ceilingUsd);
    expect(priceUsdAfterSales(100)).toBe(PRICE_LADDER.ceilingUsd);
  });

  it('computes savings percent off the fixed compare-at', () => {
    expect(savingsPercentOffCeiling(29)).toBe(96);
    expect(savingsPercentOffCeiling(655)).toBe(0);
    expect(savingsPercentOffCeiling(0)).toBe(100);
  });

  it('builds a consistent snapshot', () => {
    const snap = snapshotFromSaleCount(0);
    expect(snap.amount).toBe(29);
    expect(snap.display).toBe('$29');
    expect(snap.compareAt).toBe(655);
    expect(snap.nextAmount).toBe(32);
    expect(snap.nextDisplay).toBe('$32');
    expect(snap.isAtCeiling).toBe(false);
    expect(snap.savingsPercent).toBe(96);
  });

  it('jump table first rungs match the public ladder story', () => {
    const table = ladderJumpTable(5);
    expect(table.map((rung) => rung.amount)).toEqual([29, 32, 35, 39, 42]);
  });

  it('reaches ceiling by sale index 33 (0-based buyer #34 at $655)', () => {
    const table = ladderJumpTable(40);
    const firstCeiling = table.find((rung) => rung.amount >= PRICE_LADDER.ceilingUsd);
    expect(firstCeiling?.saleIndex).toBe(33);
    expect(firstCeiling?.amount).toBe(655);
  });
});
