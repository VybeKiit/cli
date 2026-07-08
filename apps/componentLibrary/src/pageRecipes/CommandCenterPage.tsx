import { Command, Eye, Plus, Search, Zap } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Commands',
    value: '42',
    detail: 'Searchable actions',
    icon: <Command className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Recent',
    value: '8',
    detail: 'Fast access',
    icon: <Search className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Automations',
    value: '5',
    detail: 'One-click flows',
    icon: <Zap className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Pinned',
    value: '6',
    detail: 'User shortcuts',
    icon: <Eye className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const commandItems = [
  {
    title: 'Command palette',
    description: 'Search actions, pages, records, and help articles.',
    badge: 'Search',
  },
  {
    title: 'Action launcher',
    description: 'Create tasks, invite users, add products, and open support.',
    badge: 'Actions',
  },
  {
    title: 'Recent commands',
    description: 'Last-used actions and keyboard-friendly shortcuts.',
    badge: 'Recent',
  },
] as const;

const commandControls = [
  {
    title: 'Pin commands',
    description: 'Promote common actions to the top of the palette.',
    badge: 'Pin',
  },
  {
    title: 'Scope search',
    description: 'Search across records, pages, docs, and actions.',
    badge: 'Scope',
  },
  {
    title: 'Keyboard labels',
    description: 'Show shortcuts without relying on visible help text.',
    badge: 'Keys',
  },
] as const;

/**
 * Render a source-backed command center page recipe.
 *
 * @returns A command palette and action launcher page.
 * @example
 * const element = <CommandCenterPage />;
 */
export const CommandCenterPage = () => {
  // TODO: Load command definitions and recent actions from the configured command source.
  // TODO: Execute selected commands through audited command actions.
  return (
    <DemoQuickWinPage
      active="dashboard"
      badge="Command"
      detailItems={commandControls}
      detailTitle="Command controls"
      listDescription="A command surface for power users, operators, and vibe-coder workflows."
      listItems={commandItems}
      listTitle="Command center"
      metrics={metrics}
      primaryAction={{ label: 'Run command', icon: <Zap className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search actions',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A command center page with search, action launcher, keyboard-style commands, and recent shortcuts."
      title="Command center"
      transition="scale"
      variantDescription="Command surfaces need fast scanning, search states, and clear action grouping."
      variantItems={commandControls}
      variantTitle="Command component variants"
    />
  );
};
