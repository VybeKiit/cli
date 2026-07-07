import { Spinner } from '@vybekiit/ui/spinner';
import { cn } from '@/lib/utils';

/**
 * Render the preview loading spinner component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewLoadingSpinner {...props} />;
 */
export const PreviewLoadingSpinner = ({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'sm';
}) => (
  <Spinner
    aria-label="Loading preview"
    className={cn('text-muted-foreground', size === 'sm' ? 'size-4' : 'size-6', className)}
  />
);

/**
 * Render the preview loading overlay component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewLoadingOverlay {...props} />;
 */
export const PreviewLoadingOverlay = ({
  className,
  size = 'default',
}: {
  className?: string;
  size?: 'default' | 'sm';
}) => (
  <div className={cn('flex items-center justify-center bg-muted/40', className)} aria-live="polite">
    <PreviewLoadingSpinner size={size} />
  </div>
);
