import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative w-full rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      destructive: 'border-destructive/50 text-destructive',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/**
 * Render a themed alert container.
 *
 * @param props - HTML div props plus alert variant.
 * @returns Alert container for status and error messages.
 * @example
 * <Alert variant="destructive">Problem</Alert>
 */
export const Alert = ({ className, variant, ...props }: AlertProps) => (
  <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);

/**
 * Render alert body text.
 *
 * @param props - HTML paragraph props for the body text.
 * @returns The themed alert description.
 * @example
 * <AlertDescription>Try again.</AlertDescription>
 */
export const AlertDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
);
