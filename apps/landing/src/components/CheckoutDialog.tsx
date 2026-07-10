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
import { CheckoutForm } from '@/components/CheckoutForm';
import { CheckoutTrustMarquees } from '@/components/landing/CheckoutTrustMarquees';
import { TrustChips } from '@/components/TrustChips';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PRICE } from '@/data/site';
import { trackClient } from '@/lib/analyticsClient';
import { AnalyticsEvent } from '@/lib/analyticsEvents';

interface CheckoutDialogContextValue {
  readonly open: boolean;
  readonly openCheckout: (location?: string) => void;
  readonly closeCheckout: () => void;
}

const CheckoutDialogContext = createContext<CheckoutDialogContextValue | null>(null);

/**
 * Opens the in-page checkout dialog (no full-page navigation).
 *
 * @returns Checkout dialog controls.
 * @example
 * const { openCheckout } = useCheckoutDialog();
 * openCheckout('hero_primary');
 */
export const useCheckoutDialog = (): CheckoutDialogContextValue => {
  const value = useContext(CheckoutDialogContext);
  if (value === null) {
    throw new Error('useCheckoutDialog must be used inside CheckoutDialogProvider');
  }
  return value;
};

interface CheckoutDialogProviderProps {
  readonly children: ReactNode;
}

/**
 * Provides the shared checkout dialog for every marketing CTA.
 * Also opens when the URL has `?checkout=1` (deep link / cancel retry).
 *
 * @param props - Provider children.
 * @returns Provider + dialog portal.
 * @example
 * <CheckoutDialogProvider><SiteHeader /></CheckoutDialogProvider>
 */
export const CheckoutDialogProvider = ({ children }: CheckoutDialogProviderProps) => {
  const [open, setOpen] = useState(false);

  const openCheckout = useCallback((location = 'dialog') => {
    trackClient(AnalyticsEvent.checkoutPageViewed, {
      price_usd: PRICE.amount,
      surface: 'dialog',
      location,
    });
    setOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === '1') {
      openCheckout('query');
      params.delete('checkout');
      const next = params.toString();
      const path = `${window.location.pathname}${next === '' ? '' : `?${next}`}${window.location.hash}`;
      window.history.replaceState(null, '', path);
    }
  }, [openCheckout]);

  const value = useMemo(
    () => ({ open, openCheckout, closeCheckout }),
    [open, openCheckout, closeCheckout],
  );

  return (
    <CheckoutDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
        }}
      >
        <DialogContent className="max-h-[min(90vh,780px)] gap-0 overflow-y-auto overflow-x-hidden p-0 sm:max-w-md">
          <div className="flex flex-col gap-5 p-6 pt-7">
            <DialogHeader className="space-y-2 pe-6 text-start">
              <DialogTitle className="text-2xl tracking-tight">
                Get VybeKiit · <AnimatedNumber value={PRICE.display} />
              </DialogTitle>
              <DialogDescription className="text-base leading-relaxed">
                Enter the GitHub account we should invite, then continue to secure payment. Access
                lands the moment payment clears.
              </DialogDescription>
            </DialogHeader>
          </div>
          <CheckoutTrustMarquees />
          <div className="flex flex-col gap-5 p-6 pt-5">
            <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <span
                  aria-hidden={true}
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600"
                />
                Full kit: AI operator + web + mobile + browser extension
              </li>
              <li className="flex items-start gap-2">
                <span
                  aria-hidden={true}
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600"
                />
                One-time price, not a subscription
              </li>
              <li className="flex items-start gap-2">
                <span
                  aria-hidden={true}
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600"
                />
                {PRICE.refundDays}-day money-back guarantee
              </li>
            </ul>
            <CheckoutForm />
            <TrustChips animate={false} className="justify-center" />
          </div>
        </DialogContent>
      </Dialog>
    </CheckoutDialogContext.Provider>
  );
};
