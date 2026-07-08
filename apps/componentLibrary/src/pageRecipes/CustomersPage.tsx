import { Building2, Download, Search, User, Users } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Customers',
    value: '842',
    detail: '+38 this month',
    icon: <Users className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Accounts',
    value: '126',
    detail: 'B2B workspaces',
    icon: <Building2 className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Owners',
    value: '12',
    detail: 'Sales-assigned',
    icon: <User className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Exports',
    value: 'CSV',
    detail: 'CRM ready',
    icon: <Download className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const customerItems = [
  {
    title: 'Customer table',
    description: 'Name, company, plan, owner, health, and lifecycle stage.',
    badge: 'Table',
  },
  {
    title: 'Saved segments',
    description: 'Trial, active, at-risk, enterprise, and churned views.',
    badge: 'Segments',
  },
  {
    title: 'Account owners',
    description: 'Assign sales, support, or success owner per customer.',
    badge: 'Owners',
  },
] as const;

const customerControls = [
  {
    title: 'Health score',
    description: 'Show usage, billing, support, and login signals.',
    badge: 'Health',
  },
  {
    title: 'Bulk export',
    description: 'Export selected customers to CSV or CRM.',
    badge: 'Export',
  },
  {
    title: 'Lifecycle stage',
    description: 'Track lead, trial, active, and expansion states.',
    badge: 'Stage',
  },
] as const;

/**
 * Render a source-backed customers page recipe.
 *
 * @returns A customer list and segmentation page.
 * @example
 * const element = <CustomersPage />;
 */
export const CustomersPage = () => {
  // TODO: Load customer records and segments from the configured CRM source.
  // TODO: Save customer owner and segment changes through CRM actions.
  return (
    <DemoQuickWinPage
      active="customers"
      badge="Customers"
      detailItems={customerControls}
      detailTitle="Customer controls"
      listDescription="A CRM-style customer index that works for SaaS, ecommerce, and service apps."
      listItems={customerItems}
      listTitle="Customer database"
      metrics={metrics}
      primaryAction={{ label: 'Export customers', icon: <Download className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search customers',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A customer management route with segmentation, account ownership, status badges, and CRM export states."
      title="Customers"
      transition="fade"
      variantDescription="Customer pages need segmentation, owner assignment, and health-state scanning."
      variantItems={customerControls}
      variantTitle="Customer component variants"
    />
  );
};
