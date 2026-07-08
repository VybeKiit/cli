import { CreditCard, Download, Receipt, RefreshCw, Search } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'MRR',
    value: '$18k',
    detail: '+8% this month',
    icon: <CreditCard className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Failed payments',
    value: '7',
    detail: 'Retry queue',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Invoices',
    value: '124',
    detail: 'This cycle',
    icon: <Receipt className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Credits',
    value: '3',
    detail: 'Manual review',
    icon: <Download className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const billingItems = [
  {
    title: 'Subscriptions',
    description: 'Plan, status, renewal, cancellation, and trial columns.',
    badge: 'Subs',
  },
  {
    title: 'Failed payment queue',
    description: 'Retry status, dunning stage, and customer contact.',
    badge: 'Risk',
  },
  {
    title: 'Manual credits',
    description: 'Credits, refunds, invoice notes, and account overrides.',
    badge: 'Credits',
  },
] as const;

const billingControls = [
  {
    title: 'Retry payments',
    description: 'Trigger provider-safe retries without duplicate charges.',
    badge: 'Retry',
  },
  {
    title: 'Download invoices',
    description: 'Expose invoice PDFs and CSV exports.',
    badge: 'Export',
  },
  {
    title: 'Plan override',
    description: 'Make manual plan changes explicit and auditable.',
    badge: 'Override',
  },
] as const;

/**
 * Render a source-backed billing admin page recipe.
 *
 * @returns An admin billing page for subscriptions, invoices, and failed payments.
 * @example
 * const element = <BillingAdminPage />;
 */
export const BillingAdminPage = () => {
  // TODO: Load subscriptions, invoices, and failed payments from the configured payments provider.
  // TODO: Save billing admin actions through audited payment actions.
  return (
    <DemoQuickWinPage
      active="admin"
      badge="Admin billing"
      detailItems={billingControls}
      detailTitle="Billing controls"
      listDescription="Admin payment operations for subscription health, invoices, and manual review."
      listItems={billingItems}
      listTitle="Billing operations"
      metrics={metrics}
      primaryAction={{ label: 'Retry payments', icon: <RefreshCw className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search invoices',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="An admin billing page for failed payments, subscriptions, invoices, credits, refunds, and plan overrides."
      title="Billing admin"
      transition="scale"
      variantDescription="Billing admin pages need risk queues, invoice actions, and provider-safe retry states."
      variantItems={billingControls}
      variantTitle="Billing admin variants"
    />
  );
};
