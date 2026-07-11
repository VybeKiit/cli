import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from './utils';

const iconBoxVariants = cva(
  'inline-flex shrink-0 items-center justify-center bg-muted text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"]):not([class*="h-"]):not([class*="w-"])]:size-4',
  {
    variants: {
      size: {
        sm: 'size-7',
        default: 'size-9',
        md: 'size-10',
        lg: 'size-16',
      },
      shape: {
        rounded: 'rounded-md',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'default',
      shape: 'rounded',
    },
  },
);

/**
 * Muted square/circle that centers an icon or initials — list rows, KPI tiles, avatars without photos.
 *
 * Prefer this over hand-rolled `h-9 w-9 … bg-muted` wrappers in first-party UI.
 *
 * @param props - Size, shape, and children (usually an icon).
 * @returns The icon container.
 * @example
 * <IconBox><Users className="h-4 w-4" /></IconBox>
 * <IconBox shape="circle" size="sm">JS</IconBox>
 */
const IconBox = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof iconBoxVariants>
>(({ className, size, shape, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(iconBoxVariants({ size, shape }), className)}
    data-slot="icon-box"
    {...props}
  />
));
IconBox.displayName = 'IconBox';

export { IconBox, iconBoxVariants };
