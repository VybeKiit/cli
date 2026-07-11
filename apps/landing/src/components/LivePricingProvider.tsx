'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PRICE, PRICE_VALUE_STACK } from '@/data/site';
import type { PriceLadderSnapshot } from '@/lib/priceLadder';
import { snapshotFromSaleCount } from '@/lib/priceLadder';

const fallbackSnapshot = (): PriceLadderSnapshot => snapshotFromSaleCount(0);

type LivePricingContextValue = {
  /** Current ladder snapshot (SSR fallback until fetch resolves). */
  readonly pricing: PriceLadderSnapshot;
  /** True once `/api/pricing` has resolved at least once. */
  readonly ready: boolean;
  /** Re-fetch live pricing (e.g. after a test-mode simulate). */
  readonly refresh: () => Promise<void>;
};

const LivePricingContext = createContext<LivePricingContextValue | null>(null);

/**
 * Loads the live rising-price ladder once and shares it with CTAs / pricing UI.
 *
 * @param props - Provider children.
 * @returns Context provider.
 * @example
 * <LivePricingProvider><Pricing /></LivePricingProvider>
 */
export const LivePricingProvider = ({ children }: { readonly children: ReactNode }) => {
  const [pricing, setPricing] = useState<PriceLadderSnapshot>(fallbackSnapshot);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/pricing', { cache: 'no-store' });
      if (!res.ok) {
        return;
      }
      const body = (await res.json()) as PriceLadderSnapshot;
      if (typeof body.amount === 'number' && typeof body.display === 'string') {
        setPricing({
          amount: body.amount,
          amountCents: body.amountCents ?? body.amount * 100,
          display: body.display,
          compareAt: body.compareAt ?? PRICE_VALUE_STACK.compareAtUsd,
          compareAtDisplay: body.compareAtDisplay ?? PRICE_VALUE_STACK.compareAtDisplay,
          savingsPercent: body.savingsPercent ?? PRICE_VALUE_STACK.savingsPercent,
          saleCount: body.saleCount ?? 0,
          nextAmount: body.nextAmount ?? body.amount,
          nextDisplay: body.nextDisplay ?? body.display,
          isAtCeiling: body.isAtCeiling ?? false,
        });
      }
    } catch {
      // Keep last known / fallback — never block marketing chrome.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      pricing,
      ready,
      refresh,
    }),
    [pricing, ready, refresh],
  );

  return <LivePricingContext.Provider value={value}>{children}</LivePricingContext.Provider>;
};

/**
 * Read the live ladder price (falls back to first-buyer constants outside the provider).
 *
 * @returns Live pricing context value.
 * @example
 * const { pricing } = useLivePricing();
 */
export const useLivePricing = (): LivePricingContextValue => {
  const ctx = useContext(LivePricingContext);
  if (ctx !== null) {
    return ctx;
  }

  return {
    pricing: {
      amount: PRICE.amount,
      amountCents: PRICE.amount * 100,
      display: PRICE.display,
      compareAt: PRICE_VALUE_STACK.compareAtUsd,
      compareAtDisplay: PRICE_VALUE_STACK.compareAtDisplay,
      savingsPercent: PRICE_VALUE_STACK.savingsPercent,
      saleCount: 0,
      nextAmount: PRICE.amount,
      nextDisplay: PRICE.display,
      isAtCeiling: false,
    },
    ready: false,
    refresh: async () => undefined,
  };
};
