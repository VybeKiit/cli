import { Activity, Bell, Home, Plus, TrendingUp } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Today',
    value: '18',
    detail: 'Actionable items',
    icon: <Home className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Growth',
    value: '+12%',
    detail: 'Weekly activity',
    icon: <TrendingUp className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Alerts',
    value: '4',
    detail: 'Needs review',
    icon: <Bell className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Activity',
    value: 'Live',
    detail: 'Updated now',
    icon: <Activity className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const dashboardItems = [
  {
    title: 'Overview cards',
    description: 'Today, growth, alerts, and next-step panels.',
    badge: 'Overview',
  },
  {
    title: 'Recent activity',
    description: 'Latest signups, orders, updates, and admin events.',
    badge: 'Activity',
  },
  {
    title: 'Recommended actions',
    description: 'The one or two actions that move the app forward.',
    badge: 'Actions',
  },
] as const;

const dashboardControls = [
  {
    title: 'Pin widgets',
    description: 'Allow users to pin the panels they care about.',
    badge: 'Widgets',
  },
  {
    title: 'Dismiss alerts',
    description: 'Let users clean up action items once handled.',
    badge: 'Alerts',
  },
  {
    title: 'Refresh data',
    description: 'Show a visible refresh state for dashboard cards.',
    badge: 'Refresh',
  },
] as const;

/**
 * Render a source-backed dashboard home page recipe.
 *
 * @returns A generic signed-in dashboard home page.
 * @example
 * const element = <DashboardHomePage />;
 */
export const DashboardHomePage = () => {
  // TODO: Load dashboard widgets and activity from the configured app data sources.
  // TODO: Save dashboard widget preferences through client state actions.
  return (
    <DemoQuickWinPage
      active="dashboard"
      badge="Dashboard"
      detailItems={dashboardControls}
      detailTitle="Dashboard controls"
      listDescription="A better generic dashboard home than analytics-only, ready for every SaaS template."
      listItems={dashboardItems}
      listTitle="Dashboard home"
      metrics={metrics}
      primaryAction={{ label: 'Add widget', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View activity',
        icon: <Activity className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A signed-in dashboard home with overview cards, recent activity, alerts, and recommended next actions."
      title="Dashboard home"
      transition="fade"
      variantDescription="Dashboard homes need clear priorities, recent activity, and fast action entry points."
      variantItems={dashboardControls}
      variantTitle="Dashboard component variants"
    />
  );
};
