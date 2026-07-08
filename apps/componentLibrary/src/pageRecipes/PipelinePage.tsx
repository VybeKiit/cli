import { Columns3, Filter, Plus, RefreshCw, Users } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Deals',
    value: '37',
    detail: 'Across stages',
    icon: <Columns3 className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Value',
    value: '$82k',
    detail: 'Open pipeline',
    icon: <Users className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Stalled',
    value: '6',
    detail: 'Needs action',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Stages',
    value: '5',
    detail: 'Lead to won',
    icon: <Filter className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const pipelineItems = [
  {
    title: 'Kanban board',
    description: 'Lead, qualified, proposal, won, and lost columns.',
    badge: 'Board',
  },
  {
    title: 'Opportunity cards',
    description: 'Company, value, owner, next step, and due date.',
    badge: 'Cards',
  },
  {
    title: 'Stage filters',
    description: 'Owner, priority, expected close, and source filters.',
    badge: 'Filters',
  },
] as const;

const pipelineControls = [
  { title: 'Move deal', description: 'Drag or action-move cards between stages.', badge: 'Move' },
  {
    title: 'Set next step',
    description: 'Attach a task or meeting to each opportunity.',
    badge: 'Next',
  },
  {
    title: 'Mark lost reason',
    description: 'Capture reason codes before closing a deal.',
    badge: 'Reason',
  },
] as const;

/**
 * Render a source-backed pipeline page recipe.
 *
 * @returns A CRM pipeline board page.
 * @example
 * const element = <PipelinePage />;
 */
export const PipelinePage = () => {
  // TODO: Load pipeline stages and opportunities from the configured CRM source.
  // TODO: Save opportunity stage changes through CRM actions.
  return (
    <DemoQuickWinPage
      active="pipeline"
      badge="Pipeline"
      detailItems={pipelineControls}
      detailTitle="Pipeline controls"
      listDescription="A generic CRM kanban workflow for leads, sales, recruiting, or project stages."
      listItems={pipelineItems}
      listTitle="Pipeline board"
      metrics={metrics}
      primaryAction={{ label: 'Add deal', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Filter board',
        icon: <Filter className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A pipeline board with stage columns, opportunity cards, owners, values, due dates, and next steps."
      title="Pipeline"
      transition="slide"
      variantDescription="Pipeline pages need column scanning, card density, and action-ready deal states."
      variantItems={pipelineControls}
      variantTitle="Pipeline component variants"
    />
  );
};
