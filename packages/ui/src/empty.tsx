import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from './utils';

const emptyVariants = cva(
  'flex min-w-0 flex-col items-center justify-center text-balance text-center',
  {
    variants: {
      variant: {
        default: 'gap-3 px-4 py-16',
        dashed:
          'min-h-64 gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-muted-foreground text-sm',
        compact:
          'gap-1.5 rounded-lg border border-dashed border-border px-3 py-8 text-muted-foreground text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: '[&_svg:not([class*="size-"])]:size-8',
        icon: 'size-14 rounded-full bg-muted [&_svg:not([class*="size-"])]:size-7',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Empty-state root — centered placeholder when a list, filter, or preview has nothing to show.
 *
 * Prefer this over hand-rolled dashed panels. Use `variant="dashed"` for bordered empties and
 * `variant="compact"` for tight in-card / column placeholders.
 *
 * @param props - Root props; `variant` selects layout density.
 * @returns The empty-state container.
 * @example
 * <Empty variant="dashed">
 *   <EmptyHeader>
 *     <EmptyTitle>No results</EmptyTitle>
 *     <EmptyDescription>Try a different filter.</EmptyDescription>
 *   </EmptyHeader>
 * </Empty>
 */
const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof emptyVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(emptyVariants({ variant }), className)}
    data-slot="empty"
    data-variant={variant ?? 'default'}
    {...props}
  />
));
Empty.displayName = 'Empty';

/**
 * Groups icon, title, and description inside an empty state.
 *
 * @param props - Header props.
 * @returns The empty-state header.
 * @example
 * <EmptyHeader><EmptyTitle>No notes yet</EmptyTitle></EmptyHeader>
 */
const EmptyHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex max-w-md flex-col items-center text-center', className)}
      data-slot="empty-header"
      {...props}
    />
  ),
);
EmptyHeader.displayName = 'EmptyHeader';

/**
 * Optional media (icon or illustration) above the empty title.
 *
 * @param props - Media props; `variant="icon"` wraps children in a muted circle.
 * @returns The empty-state media slot.
 * @example
 * <EmptyMedia variant="icon"><Search /></EmptyMedia>
 */
const EmptyMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof emptyMediaVariants>
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(emptyMediaVariants({ variant }), className)}
    data-slot="empty-media"
    data-variant={variant}
    {...props}
  />
));
EmptyMedia.displayName = 'EmptyMedia';

/**
 * Primary empty-state heading.
 *
 * @param props - Title props.
 * @returns The empty-state title.
 * @example
 * <EmptyTitle>No matches</EmptyTitle>
 */
const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('font-semibold text-foreground text-lg', className)}
      data-slot="empty-title"
      {...props}
    />
  ),
);
EmptyTitle.displayName = 'EmptyTitle';

/**
 * Supporting copy under the empty title.
 *
 * @param props - Description props.
 * @returns The empty-state description.
 * @example
 * <EmptyDescription>Nothing matches this filter.</EmptyDescription>
 */
const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'max-w-md text-muted-foreground text-sm [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4 [[data-slot=empty-title]+&]:mt-1',
      className,
    )}
    data-slot="empty-description"
    {...props}
  />
));
EmptyDescription.displayName = 'EmptyDescription';

/**
 * Actions or extra content below the empty header (buttons, links).
 *
 * @param props - Content props.
 * @returns The empty-state content slot.
 * @example
 * <EmptyContent><Button variant="outline">Clear filters</Button></EmptyContent>
 */
const EmptyContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex w-full min-w-0 max-w-sm flex-col items-center gap-3 text-balance text-sm [[data-slot=empty-header]+&]:mt-1',
        className,
      )}
      data-slot="empty-content"
      {...props}
    />
  ),
);
EmptyContent.displayName = 'EmptyContent';

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  emptyMediaVariants,
  emptyVariants,
};
