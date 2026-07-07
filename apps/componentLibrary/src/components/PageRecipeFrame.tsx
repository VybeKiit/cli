import { buildPageRecipePreviewSrc } from '@library/lib/theme';
import { cn } from '@/lib/utils';

export type PageRecipeDevice = 'desktop' | 'tablet' | 'mobile';

interface PageRecipeFrameProps {
  readonly slug: string;
  readonly title: string;
  readonly device: PageRecipeDevice;
  readonly className?: string;
}

const DEVICE_LABELS: Record<PageRecipeDevice, string> = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
};

const DEVICE_CLASSES: Record<PageRecipeDevice, string> = {
  desktop: 'aspect-[16/10]',
  tablet: 'aspect-[4/3]',
  mobile: 'aspect-[9/16] max-h-[420px]',
};

/**
 * Render a responsive iframe frame for a Page recipe.
 *
 * @param props - Props passed to this component.
 * @returns A React element containing a labeled Page recipe iframe.
 * @example
 * const element = <PageRecipeFrame slug="auth" title="Auth page" device="desktop" />;
 */
export const PageRecipeFrame = ({ slug, title, device, className }: PageRecipeFrameProps) => {
  const src = buildPageRecipePreviewSrc(slug, { thumb: true });

  return (
    <figure className={cn('min-w-0', className)}>
      <figcaption className="mb-2 text-muted-foreground text-xs">
        {DEVICE_LABELS[device]}
      </figcaption>
      <div
        className={cn(
          'overflow-hidden rounded-lg border bg-background shadow-sm',
          DEVICE_CLASSES[device],
        )}
      >
        <iframe
          className="h-full w-full border-0 bg-background"
          loading="lazy"
          src={src}
          title={`${title} ${DEVICE_LABELS[device]} preview`}
        />
      </div>
    </figure>
  );
};
