import { BookOpen, LifeBuoy, Mail, Search, Send } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Open tickets',
    value: '6',
    detail: '2 waiting on user',
    icon: <LifeBuoy className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Docs matches',
    value: '24',
    detail: 'Search-ready articles',
    icon: <BookOpen className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Response time',
    value: '2h',
    detail: 'Median first reply',
    icon: <Mail className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Escalations',
    value: '1',
    detail: 'High priority',
    icon: <Send className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const supportItems = [
  {
    title: 'Ticket inbox',
    description: 'Open, waiting, solved, and escalated support tickets.',
    badge: 'Tickets',
  },
  {
    title: 'Docs search',
    description: 'Search help articles before creating a ticket.',
    badge: 'Docs',
  },
  {
    title: 'Contact support',
    description: 'Subject, message, attachments, and priority controls.',
    badge: 'Contact',
  },
] as const;

const supportControls = [
  {
    title: 'Attach diagnostics',
    description: 'Include browser, device, and account context.',
    badge: 'Context',
  },
  {
    title: 'Escalate urgent issues',
    description: 'Flag billing, data loss, or outage reports.',
    badge: 'Priority',
  },
  {
    title: 'Show status link',
    description: 'Point users to live incident updates.',
    badge: 'Status',
  },
] as const;

/**
 * Render a source-backed support center page recipe.
 *
 * @returns A help desk page with tickets, docs search, and contact actions.
 * @example
 * const element = <SupportCenterPage />;
 */
export const SupportCenterPage = () => {
  // TODO: Load support tickets and documentation results from the configured support provider.
  // TODO: Send support requests through the configured support action.
  return (
    <DemoQuickWinPage
      active="support"
      badge="Support"
      detailItems={supportControls}
      detailTitle="Support defaults"
      listDescription="Help center surfaces need tickets, docs, contact, and status in one route."
      listItems={supportItems}
      listTitle="Support workspace"
      metrics={metrics}
      primaryAction={{ label: 'Create ticket', icon: <Send className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search docs',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A support center for help docs, ticket status, contact forms, attachments, and incident handoff."
      title="Support center"
      transition="slide"
      variantDescription="Support pages need searchable docs, priority states, and visible response expectations."
      variantItems={supportControls}
      variantTitle="Support component variants"
    />
  );
};
