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
import { useLivePricing } from '@/components/LivePricingProvider';
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
import { fillTemplate } from '@/i18n/fillTemplate';
import { useLandingLocale } from '@/i18n/LocaleProvider';
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
 * Dialog body always re-reads locale when open so language switches apply immediately.
 *
 * @returns Localized checkout dialog content.
 */
const CheckoutDialogBody = () => {
  const { messages, locale, dir } = useLandingLocale();
  const { pricing: live } = useLivePricing();
  const checkout = messages.checkout;
  const refundBullet = fillTemplate(checkout.bulletRefund, { days: PRICE.refundDays });

  return (
    <DialogContent
      key={locale}
      className="max-h-[min(90vh,780px)] gap-0 overflow-y-auto overflow-x-hidden p-0 sm:max-w-md"
      dir={dir}
      lang={locale}
    >
      <div className="flex flex-col gap-5 p-6 pt-7">
        <DialogHeader className="space-y-2 pe-6 text-start">
          <DialogTitle className="text-2xl tracking-tight">
            <span className="inline-flex flex-wrap items-baseline gap-x-2">
              <span>{checkout.titlePrefix}</span>
              <span className="tabular-nums" dir="ltr">
                · <AnimatedNumber value={live.display} />
              </span>
            </span>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-start">
            {checkout.description}
          </DialogDescription>
        </DialogHeader>
      </div>
      <CheckoutTrustMarquees />
      <div className="flex flex-col gap-5 p-6 pt-5">
        <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
          {(
            [
              { id: 'full', text: checkout.bulletFull },
              { id: 'once', text: checkout.bulletOnce },
              { id: 'refund', text: refundBullet },
            ] as const
          ).map((bullet) => (
            <li key={bullet.id} className="flex items-start gap-2 text-start">
              <span
                aria-hidden={true}
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-600"
              />
              <span className="min-w-0 flex-1">{bullet.text}</span>
            </li>
          ))}
        </ul>
        <CheckoutForm />
        <TrustChips animate={false} className="justify-center" />
      </div>
    </DialogContent>
  );
};

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
  const { pricing: live } = useLivePricing();

  const openCheckout = useCallback(
    (location = 'dialog') => {
      trackClient(AnalyticsEvent.checkoutPageViewed, {
        price_usd: live.amount,
        sale_count: live.saleCount,
        surface: 'dialog',
        location,
      });
      setOpen(true);
    },
    [live.amount, live.saleCount],
  );

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
        {open ? <CheckoutDialogBody /> : null}
      </Dialog>
    </CheckoutDialogContext.Provider>
  );
};
