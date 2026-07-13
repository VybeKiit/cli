import { Zap } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  /** Extra classes on the logo tile (e.g. sizing overrides). */
  readonly className?: string;
}

/**
 * The ExtenName brand mark — an indigo rounded-square tile with a bolt glyph.
 * Uses the accent token (`bg-primary`), never a hardcoded hex.
 *
 * @param props - Optional classes for the logo tile.
 * @returns The rendered brand logo tile.
 * @example
 * <BrandLogo />
 */
export const BrandLogo = ({ className }: BrandLogoProps) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground',
      className,
    )}
  >
    <Zap className="h-4 w-4 fill-current" />
  </span>
);
