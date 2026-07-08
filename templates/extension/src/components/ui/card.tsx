import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Render a bordered card surface.
 *
 * @param props - HTML div props for the card.
 * @returns The themed card container.
 * @example
 * <Card><CardContent>Body</CardContent></Card>
 */
export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
    {...props}
  />
);

/**
 * Render the padded card header.
 *
 * @param props - HTML div props for the header.
 * @returns The card header region.
 * @example
 * <CardHeader><CardTitle>Title</CardTitle></CardHeader>
 */
export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

/**
 * Render prominent card title text.
 *
 * @param props - HTML div props for the title.
 * @returns The card title.
 * @example
 * <CardTitle>Dashboard</CardTitle>
 */
export const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
);

/**
 * Render muted card description text.
 *
 * @param props - HTML div props for the description.
 * @returns The card description.
 * @example
 * <CardDescription>Track progress.</CardDescription>
 */
export const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-muted-foreground text-sm', className)} {...props} />
);

/**
 * Render the padded card content region.
 *
 * @param props - HTML div props for the content region.
 * @returns The card body.
 * @example
 * <CardContent>Body</CardContent>
 */
export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);
