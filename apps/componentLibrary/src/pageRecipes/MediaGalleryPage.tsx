import { Download, Eye, Image, Plus, Search } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Assets',
    value: '128',
    detail: 'Images and files',
    icon: <Image className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Storage',
    value: '2.4GB',
    detail: '68% used',
    icon: <Download className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Uploads',
    value: '14',
    detail: 'This week',
    icon: <Plus className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Needs alt',
    value: '9',
    detail: 'Accessibility',
    icon: <Eye className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const mediaItems = [
  {
    title: 'Asset grid',
    description: 'Image cards, file cards, preview, tags, and metadata.',
    badge: 'Grid',
  },
  {
    title: 'Upload queue',
    description: 'Progress, retry, validation, and file-type states.',
    badge: 'Upload',
  },
  {
    title: 'Preview panel',
    description: 'Selected media preview, dimensions, and usage info.',
    badge: 'Preview',
  },
] as const;

const mediaControls = [
  {
    title: 'Generate thumbnails',
    description: 'Show optimized previews and fallback states.',
    badge: 'Thumbs',
  },
  {
    title: 'Tag assets',
    description: 'Organize media by product, campaign, or page.',
    badge: 'Tags',
  },
  {
    title: 'Check accessibility',
    description: 'Surface missing alt text and oversized assets.',
    badge: 'A11y',
  },
] as const;

/**
 * Render a source-backed media gallery page recipe.
 *
 * @returns A media asset gallery and upload page.
 * @example
 * const element = <MediaGalleryPage />;
 */
export const MediaGalleryPage = () => {
  // TODO: Load media assets and metadata from the configured asset source.
  // TODO: Save media uploads and metadata changes through asset actions.
  return (
    <DemoQuickWinPage
      active="files"
      badge="Media"
      detailItems={mediaControls}
      detailTitle="Media controls"
      listDescription="A visual file-management route for galleries, uploads, previews, and metadata."
      listItems={mediaItems}
      listTitle="Media gallery"
      metrics={metrics}
      primaryAction={{ label: 'Upload media', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search media',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A media gallery with asset cards, upload queue, preview panel, tags, thumbnails, and accessibility checks."
      title="Media gallery"
      transition="slide"
      variantDescription="Media pages need visual cards, metadata density, and upload progress states."
      variantItems={mediaControls}
      variantTitle="Media component variants"
    />
  );
};
