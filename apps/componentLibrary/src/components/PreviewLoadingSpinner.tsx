import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** Unified loading state for preview iframes and embed shells. */
export function PreviewLoadingSpinner({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <Spinner
      aria-label="Loading preview"
      className={cn('text-muted-foreground', size === 'sm' ? 'size-4' : 'size-6', className)}
    />
  );
}

export function PreviewLoadingOverlay({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <div
      className={cn('flex items-center justify-center bg-muted/40', className)}
      aria-live="polite"
    >
      <PreviewLoadingSpinner size={size} />
    </div>
  );
}
