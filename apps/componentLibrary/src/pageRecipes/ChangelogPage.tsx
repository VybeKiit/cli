import { Bell, Download, FileClock, Megaphone, Plus } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Releases',
    value: '18',
    detail: 'This quarter',
    icon: <Megaphone className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Drafts',
    value: '3',
    detail: 'Need review',
    icon: <Plus className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Subscribers',
    value: '2.1k',
    detail: 'Product updates',
    icon: <Bell className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Exports',
    value: 'RSS',
    detail: 'Feed ready',
    icon: <Download className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const changelogItems = [
  {
    title: 'Release entries',
    description: 'Feature, fix, improvement, and deprecation posts.',
    badge: 'Entries',
  },
  {
    title: 'Version timeline',
    description: 'Grouped releases with dates, tags, and highlights.',
    badge: 'Timeline',
  },
  {
    title: 'Subscription CTA',
    description: 'Email, RSS, and in-app update subscriptions.',
    badge: 'Subscribe',
  },
] as const;

const changelogControls = [
  {
    title: 'Publish release',
    description: 'Move drafts into public changelog entries.',
    badge: 'Publish',
  },
  {
    title: 'Tag entry type',
    description: 'Mark feature, fix, improvement, or breaking change.',
    badge: 'Tags',
  },
  {
    title: 'Notify subscribers',
    description: 'Send updates only after publish confirmation.',
    badge: 'Notify',
  },
] as const;

/**
 * Render a source-backed changelog page recipe.
 *
 * @returns A product changelog page with release timeline and subscriptions.
 * @example
 * const element = <ChangelogPage />;
 */
export const ChangelogPage = () => {
  // TODO: Load changelog entries from the configured content source.
  // TODO: Publish changelog updates through the configured content action.
  return (
    <DemoQuickWinPage
      active="changelog"
      badge="Changelog"
      detailItems={changelogControls}
      detailTitle="Release controls"
      eyebrow="Public"
      listDescription="A public product updates page for feature launches, fixes, and version notes."
      listItems={changelogItems}
      listTitle="Product changelog"
      metrics={metrics}
      primaryAction={{ label: 'Subscribe', icon: <Bell className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View timeline',
        icon: <FileClock className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A changelog page with release entries, version timeline, category tags, subscriptions, and publish states."
      title="Product changelog"
      transition="slide"
      variantDescription="Changelog pages need readable timelines, release tags, and subscription paths."
      variantItems={changelogControls}
      variantTitle="Changelog component variants"
    />
  );
};
