import { Spinner } from '@vybekiit/ui/spinner';
import { cn } from '@/lib/utils';

/**
 * Render the preview loading spinner component.
 *
 * @param props - Optional className and size.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewLoadingSpinner size="sm" />;
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
