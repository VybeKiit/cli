'use client';

import type { ComponentProps, ReactNode } from 'react';
import { useCheckoutDialog } from '@/components/CheckoutDialog';
import { Button } from '@/components/ui/button';
import { trackClient } from '@/lib/analyticsClient';
import { AnalyticsEvent, type CtaLocation } from '@/lib/analyticsEvents';
import { cn } from '@/lib/utils';

interface CheckoutOpenButtonProps {
  readonly children: ReactNode;
  readonly location: CtaLocation;
  readonly className?: string;
  readonly size?: ComponentProps<typeof Button>['size'];
  readonly variant?: ComponentProps<typeof Button>['variant'];
  readonly trackLabel?: string;
  /** Extra click work (e.g. close the mobile nav drawer). */
  readonly onClick?: () => void;
}

/**
 * Primary CTA that opens the in-page checkout dialog (no route change).
 *
 * @param props - Button label, funnel location, and optional button styles.
 * @returns Styled button that opens checkout.
 * @example
 * <CheckoutOpenButton location="hero_primary">Get VybeKiit</CheckoutOpenButton>
 */
export const CheckoutOpenButton = ({
  children,
  location,
  className,
  size = 'lg',
  variant = 'default',
  trackLabel,
  onClick,
}: CheckoutOpenButtonProps) => {
  const { openCheckout } = useCheckoutDialog();

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn('rounded-full', className)}
      onClick={() => {
        trackClient(AnalyticsEvent.ctaClicked, {
          location,
          href: '#checkout-dialog',
          surface: 'CheckoutOpenButton',
          ...(trackLabel === undefined ? {} : { label: trackLabel }),
        });
        onClick?.();
        openCheckout(location);
      }}
    >
      {children}
    </Button>
  );
};
