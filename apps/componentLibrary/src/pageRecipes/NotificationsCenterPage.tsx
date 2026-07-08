import { Bell, Eye, Mail, RefreshCw, Save } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Unread',
    value: '12',
    detail: 'Across all channels',
    icon: <Bell className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Email',
    value: 'On',
    detail: 'Digest enabled',
    icon: <Mail className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Mentions',
    value: '3',
    detail: 'Needs attention',
    icon: <Eye className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Sync',
    value: 'Live',
    detail: 'Updated now',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const notificationItems = [
  {
    title: 'Product activity',
    description: 'Mentions, comments, assignments, and workspace updates.',
    badge: 'Feed',
  },
  {
    title: 'Billing notices',
    description: 'Invoices, failed payments, credits, and renewal reminders.',
    badge: 'Billing',
  },
  {
    title: 'Security alerts',
    description: 'New device sign-in and permission-change notifications.',
    badge: 'Security',
  },
] as const;

const channelItems = [
  {
    title: 'Email digest',
    description: 'Bundle lower-priority updates into daily summaries.',
    badge: 'Email',
  },
  {
    title: 'Push alerts',
    description: 'Immediate mobile alerts for urgent events.',
    badge: 'Push',
  },
  {
    title: 'In-app inbox',
    description: 'Keep a complete notification history in the app.',
    badge: 'Inbox',
  },
] as const;

/**
 * Render a source-backed notifications center page recipe.
 *
 * @returns A notification feed and channel preference page.
 * @example
 * const element = <NotificationsCenterPage />;
 */
export const NotificationsCenterPage = () => {
  // TODO: Load notifications from the active notification source.
  // TODO: Save notification preferences through the notifications feature.
  return (
    <DemoQuickWinPage
      active="notifications"
      badge="Notifications"
      detailItems={channelItems}
      detailTitle="Channel controls"
      listDescription="Feed, unread, and preference states for every average SaaS."
      listItems={notificationItems}
      listTitle="Notification inbox"
      metrics={metrics}
      primaryAction={{ label: 'Save preferences', icon: <Save className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Mark all read',
        icon: <Eye className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A notification center with unread states, channel preferences, and security or billing alert categories."
      title="Notifications"
      transition="fade"
      variantDescription="Notification pages need inbox density, unread badges, and channel controls."
      variantItems={channelItems}
      variantTitle="Notification component variants"
    />
  );
};
