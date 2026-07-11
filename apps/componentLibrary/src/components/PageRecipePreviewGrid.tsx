'use client';

import { MobileViewportControls } from '@library/components/MobileViewportControls';
import { PageRecipeFrame } from '@library/components/PageRecipeFrame';
import { useMobileViewportControls } from '@library/hooks/useMobileViewportControls';
import { DESKTOP_VIEWPORT, TABLET_VIEWPORT } from '@library/lib/pageRecipeViewport';
import { cn } from '@/lib/utils';

interface PageRecipePreviewGridProps {
  readonly slug: string;
  readonly title: string;
  readonly className?: string;
}

/**
 * Shared Page recipe preview grid: mobile, tablet, and desktop frames.
 *
 * @param props - Recipe slug, title, and optional layout class.
 * @returns A React element with three device previews.
 * @example
 * const element = <PageRecipePreviewGrid slug="auth" title="Auth page" />;
 */
export const PageRecipePreviewGrid = ({ slug, title, className }: PageRecipePreviewGridProps) => {
  const {
    mobilePresetId,
    setMobilePresetId,
    customMobileViewport,
    selectedPreset,
    mobileViewport,
    handleCustomWidthChange,
    handleCustomHeightChange,
  } = useMobileViewportControls();

  const mobileControls = (
    <MobileViewportControls
      customMobileViewport={customMobileViewport}
      mobilePresetId={mobilePresetId}
      onCustomHeightChange={handleCustomHeightChange}
      onCustomWidthChange={handleCustomWidthChange}
      onPresetChange={setMobilePresetId}
      selectedPreset={selectedPreset}
    />
  );

  return (
    <div className={cn('grid min-w-0 gap-4 md:grid-cols-2 [&>*]:min-w-0', className)}>
      <PageRecipeFrame
        controls={mobileControls}
        device="mobile"
        slug={slug}
        title={title}
        viewport={mobileViewport}
      />
      <PageRecipeFrame device="tablet" slug={slug} title={title} viewport={TABLET_VIEWPORT} />
      <PageRecipeFrame
        className="md:col-span-2"
        device="desktop"
        slug={slug}
        title={title}
        viewport={DESKTOP_VIEWPORT}
      />
    </div>
  );
};
