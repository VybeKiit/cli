import { BookOpen, Eye, Search, Send, UsersRound } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Articles',
    value: '64',
    detail: 'Across collections',
    icon: <BookOpen className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Searches',
    value: '1.8k',
    detail: 'This month',
    icon: <Search className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Helpful',
    value: '91%',
    detail: 'Feedback score',
    icon: <Eye className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Authors',
    value: '5',
    detail: 'Can edit docs',
    icon: <UsersRound className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const docsItems = [
  {
    title: 'Docs sidebar',
    description: 'Collections, articles, anchors, and active section.',
    badge: 'Sidebar',
  },
  {
    title: 'Article view',
    description: 'Title, content blocks, callouts, and feedback controls.',
    badge: 'Article',
  },
  {
    title: 'Search results',
    description: 'Query, empty state, highlighted terms, and popular docs.',
    badge: 'Search',
  },
] as const;

const docsControls = [
  {
    title: 'Collect feedback',
    description: 'Ask whether the article solved the problem.',
    badge: 'Feedback',
  },
  { title: 'Suggest edits', description: 'Let team members propose doc changes.', badge: 'Edits' },
  {
    title: 'Track stale docs',
    description: 'Flag articles that need owner review.',
    badge: 'Review',
  },
] as const;

/**
 * Render a source-backed docs page recipe.
 *
 * @returns A help documentation page with sidebar and article view.
 * @example
 * const element = <DocsPage />;
 */
export const DocsPage = () => {
  // TODO: Load documentation collections and articles from the configured content source.
  // TODO: Save documentation feedback through the configured feedback action.
  return (
    <DemoQuickWinPage
      active="docs"
      badge="Docs"
      detailItems={docsControls}
      detailTitle="Documentation controls"
      listDescription="A help-docs route that can back support, onboarding, and product education."
      listItems={docsItems}
      listTitle="Documentation"
      metrics={metrics}
      primaryAction={{ label: 'Send feedback', icon: <Send className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search docs',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A documentation page with collection sidebar, article view, search results, feedback, and stale-doc checks."
      title="Docs"
      transition="fade"
      variantDescription="Docs pages need navigable sidebars, readable articles, and feedback loops."
      variantItems={docsControls}
      variantTitle="Docs component variants"
    />
  );
};
