import { describe, expect, it } from 'vitest';
import { mapOrderEventToLedgerRow, splitCustomerName } from './orderLedger';
import type { OrderEvent } from './types';

const baseEvent = (overrides: Partial<OrderEvent> = {}): OrderEvent => ({
  provider: 'lemon-squeezy',
  eventName: 'order_created',
  orderId: 'ord_1',
  customerEmail: 'a@example.com',
  customerName: 'Ada Lovelace',
  githubUsername: 'ada',
  isRefund: false,
  ...overrides,
});

describe('splitCustomerName', () => {
  it('splits first and last', () => {
    expect(splitCustomerName('Ada Lovelace')).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
    });
  });

  it('handles mononyms and empty', () => {
    expect(splitCustomerName('Prince')).toEqual({ firstName: 'Prince', lastName: null });
    expect(splitCustomerName(null)).toEqual({ firstName: null, lastName: null });
  });
});

describe('mapOrderEventToLedgerRow', () => {
  it('maps OrderEvent fields and name split', () => {
    expect(mapOrderEventToLedgerRow(baseEvent())).toEqual({
      orderId: 'ord_1',
      email: 'a@example.com',
      customerName: 'Ada Lovelace',
      firstName: 'Ada',
      lastName: 'Lovelace',
      githubUsername: 'ada',
      refunded: false,
    });
  });

  it('maps refunds', () => {
    expect(mapOrderEventToLedgerRow(baseEvent({ isRefund: true })).refunded).toBe(true);
  });
});
