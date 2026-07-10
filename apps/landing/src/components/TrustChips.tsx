'use client';

import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { MobileIcon, ShieldCheckIcon, WebAppIcon } from '@/components/ui/CustomIcons';
import { PRICE } from '@/data/site';
import { cn } from '@/lib/utils';

const MARK_CLASS = 'hero-trust-mark size-4 shrink-0';

interface TrustChipsProps {
  readonly className?: string;
  /** When false, skip digit roll (static refund days). Default true. */
  readonly animate?: boolean;
}

/**
 * Shared trust strip used on hero, checkout, and success paths.
 * Lemon Squeezy, shimmering refund shield, and platform marks
 * (icon immediately before each of Web / Mobile / Extension).
 *
 * @param props - Layout className and optional animate flag.
 * @returns The rendered trust chips list.
 * @example
 * <TrustChips />
 */
export const TrustChips = ({ className, animate = true }: TrustChipsProps) => (
  <ul
    aria-label="Trust promises"
    className={cn(
      'flex flex-wrap items-center gap-x-3 gap-y-2.5 text-muted-foreground text-sm',
      className,
    )}
  >
    <li className="hero-trust-chip flex items-center gap-1.5">
      <LogoMarkIcon className={MARK_CLASS} slug="lemonsqueezy" />
      <span>Lemon Squeezy · Merchant of Record</span>
    </li>
    <li aria-hidden={true} className="text-foreground/30">
      ·
    </li>
    <li className="hero-trust-chip flex items-center gap-1.5">
      <span className="hero-trust-shimmer inline-flex shrink-0 rounded-sm text-emerald-600">
        <ShieldCheckIcon className={MARK_CLASS} />
      </span>
      <span>
        {animate ? <AnimatedNumber value={String(PRICE.refundDays)} /> : PRICE.refundDays}
        -day refund
      </span>
    </li>
    <li aria-hidden={true} className="text-foreground/30">
      ·
    </li>
    <li className="hero-trust-chip flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="inline-flex items-center gap-1">
        <WebAppIcon className={`${MARK_CLASS} text-foreground/70`} />
        <span>Web</span>
      </span>
      <span aria-hidden={true} className="text-foreground/30">
        ·
      </span>
      <span className="inline-flex items-center gap-1">
        <MobileIcon className={`${MARK_CLASS} text-foreground/70`} />
        <span>Mobile</span>
      </span>
      <span aria-hidden={true} className="text-foreground/30">
        ·
      </span>
      <span className="inline-flex items-center gap-1">
        <LogoMarkIcon className={MARK_CLASS} slug="googlechrome" />
        <span>Extension</span>
      </span>
    </li>
  </ul>
);
