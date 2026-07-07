'use client';

import Link from 'next/link';
import { type ReactNode, useCallback, useState } from 'react';
import { CartIcon, LockIcon } from '@/components/ui/CustomIcons';
import { cn } from '@/lib/utils';

interface CheckoutCTAProps {
  readonly href?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly size?: 'hero' | 'pricing';
  /** Trailing glyph — the cart flies on click; the lock is a static trust cue. */
  readonly icon?: 'cart' | 'lock';
}

/**
 * Checkout link with cart fly animation on click (RTL-aware).
 *
 * @param props - Component props.
 * @returns The rendered CheckoutCTA element.
 * @example
 * ```tsx
 * <CheckoutCTA />
 * ```
 */

export const CheckoutCTA = ({
  href = '/checkout',
  children,
  className,
  size = 'hero',
  icon = 'cart',
}: CheckoutCTAProps) => {
  const [proceeding, setProceeding] = useState(false);

  const handleClick = useCallback(() => {
    setProceeding(true);
  }, []);

  return (
    <Link
      className={cn(
        size === 'pricing' ? 'pricing-button' : 'hero-cta',
        'checkout-cta',
        proceeding && 'checkout-cta--proceed',
        className,
      )}
      href={href}
      onClick={handleClick}
    >
      <span className="checkout-cta-label">{children}</span>
      {icon === 'lock' ? (
        <LockIcon className="ms-1 h-5 w-5 shrink-0" />
      ) : (
        <CartIcon
          className={cn('checkout-cta-cart shrink-0', size === 'pricing' ? 'h-6 w-6' : 'h-5 w-5')}
        />
      )}
    </Link>
  );
};
