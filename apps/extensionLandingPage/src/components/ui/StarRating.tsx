import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface StarRatingProps {
  /** Number of filled stars to render (defaults to a full 5). */
  readonly count?: number;
  /** Extra classes on the star row wrapper. */
  readonly className?: string;
  /** Extra classes on each star glyph (color / size). */
  readonly starClassName?: string;
}

/**
 * Small row of filled rating stars, used in the hero rating line and store-rating stat tiles.
 *
 * @param props - Star count and optional wrapper / glyph classes.
 * @returns A row of filled star icons.
 * @example
 * <StarRating className="text-amber-400" />
 */
export const StarRating = ({ count = 5, className, starClassName }: StarRatingProps) => (
  <span aria-hidden="true" className={cn('inline-flex items-center gap-0.5', className)}>
    {Array.from({ length: count }, (_, index) => (
      <Star className={cn('h-4 w-4 fill-current', starClassName)} key={index} />
    ))}
  </span>
);
