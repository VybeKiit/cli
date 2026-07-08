import * as React from 'react';

import { cn } from './utils';

/**
 * Render the Card component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Card component.
 * @example
 * <Card />;
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

/**
 * Render the Card Header component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Card Header component.
 * @example
 * <CardHeader />;
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

/**
 * Render the Card Title component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Card Title component.
 * @example
 * <CardTitle />;
 */
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

/**
 * Render the Card Description component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Card Description component.
 * @example
 * <CardDescription />;
 */
const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

/**
 * Render the Card Content component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Card Content component.
 * @example
 * <CardContent />;
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

/**
 * Render the Card Footer component.
 *
 * @param props - Component props forwarded to the underlying UI primitive.
 * @returns The rendered Card Footer component.
 * @example
 * <CardFooter />;
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
