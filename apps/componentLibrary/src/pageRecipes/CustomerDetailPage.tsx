import { CreditCard, FileClock, LifeBuoy, Plus, User } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Health',
    value: '82',
    detail: 'Expansion ready',
    icon: <User className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Invoices',
    value: '14',
    detail: 'All paid',
    icon: <CreditCard className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Tickets',
    value: '2',
    detail: 'One waiting',
    icon: <LifeBuoy className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Timeline',
    value: '38',
    detail: 'Recent events',
    icon: <FileClock className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const detailItems = [
  {
    title: 'Customer timeline',
    description: 'Notes, logins, payments, tickets, and plan changes.',
    badge: 'Timeline',
  },
  {
    title: 'Account notes',
    description: 'Pinned internal notes and next actions.',
    badge: 'Notes',
  },
  {
    title: 'Related records',
    description: 'Invoices, files, support tickets, and opportunities.',
    badge: 'Records',
  },
] as const;

const detailControls = [
  { title: 'Add note', description: 'Capture sales, support, or success context.', badge: 'Note' },
  {
    title: 'Escalate support',
    description: 'Turn customer context into a support follow-up.',
    badge: 'Support',
  },
  {
    title: 'Update owner',
    description: 'Assign an account owner with audit trail.',
    badge: 'Owner',
  },
] as const;

/**
 * Render a source-backed customer detail page recipe.
 *
 * @returns A customer profile page with timeline, notes, and related records.
 * @example
 * const element = <CustomerDetailPage />;
 */
export const CustomerDetailPage = () => {
  // TODO: Load customer timeline, notes, invoices, and support records from the configured CRM source.
  // TODO: Save customer notes and owner changes through CRM actions.
  return (
    <DemoQuickWinPage
      active="customers"
      badge="Customer"
      detailItems={detailControls}
      detailTitle="Customer actions"
      listDescription="A detail view that unifies account context, support, billing, and activity."
      listItems={detailItems}
      listTitle="Customer profile"
      metrics={metrics}
      primaryAction={{ label: 'Add note', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Open support',
        icon: <LifeBuoy className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A customer detail page with timeline, notes, invoices, support tickets, files, and owner controls."
      title="Customer detail"
      transition="scale"
      variantDescription="Customer detail pages need timeline density, cross-domain records, and clear account actions."
      variantItems={detailControls}
      variantTitle="Customer detail variants"
    />
  );
};
