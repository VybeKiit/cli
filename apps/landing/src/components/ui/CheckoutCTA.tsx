'use client';

import { CartIcon } from '@/components/ui/CustomIcons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCallback, useState, type ReactNode } from 'react';

interface CheckoutCTAProps {
  readonly href?: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly size?: 'hero' | 'pricing';
}

/** Checkout link with cart fly animation on click (RTL-aware). */
export function CheckoutCTA({
  href = '/checkout',
  children,
  className,
  size = 'hero',
}: CheckoutCTAProps) {
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
      <CartIcon
        className={cn('checkout-cta-cart shrink-0', size === 'pricing' ? 'h-6 w-6' : 'h-5 w-5')}
      />
    </Link>
  );
}
