import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

interface StarRatingProps {
  /** Number of filled stars (0–`total`). */
  readonly filled: number;
  /** Total stars to render. */
  readonly total?: number;
  /** Extra classes on the row wrapper. */
  readonly className?: string;
}

/**
 * Row of star icons with the first `filled` stars in the accent color.
 *
 * No kit star-rating primitive exists, so this small first-party leaf composes
 * lucide `Star` icons and the `text-primary` token.
 *
 * @param props - Filled count, total stars, and wrapper classes.
 * @returns The rendered star row.
 * @example
 * <StarRating filled={5} />
 */
export const StarRating = ({ filled, total = 5, className }: StarRatingProps) => (
  <div
    aria-label={`${filled} out of ${total} stars`}
    className={cn('flex items-center gap-0.5', className)}
    role="img"
  >
    {Array.from({ length: total }, (_, index) => {
      const isFilled = index < filled;
      return (
        <Star
          aria-hidden="true"
          className={cn(
            'h-4 w-4',
            isFilled ? 'fill-primary text-primary' : 'fill-muted text-muted-foreground/40',
          )}
          key={index}
        />
      );
    })}
  </div>
);
