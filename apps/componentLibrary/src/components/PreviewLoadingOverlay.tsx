import { PreviewLoadingSpinner } from '@library/components/PreviewLoadingSpinner';
import { cn } from '@/lib/utils';

/**
 * Render a full-area loading overlay for gallery previews.
 *
 * @param props - Optional className and spinner size.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewLoadingOverlay className="min-h-screen" />;
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
