import { Activity, Bell, HeartPulse, MonitorCheck, Signal } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Overall',
    value: 'Operational',
    detail: 'All systems normal',
    icon: <MonitorCheck className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Incidents',
    value: '0',
    detail: 'Current',
    icon: <Signal className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Latency',
    value: '82ms',
    detail: 'API median',
    icon: <Activity className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Subscribers',
    value: '918',
    detail: 'Status alerts',
    icon: <Bell className="h-5 w-5" />,
    tone: 'slate',
  },
] as const;

const statusItems = [
  {
    title: 'Service list',
    description: 'API, auth, database, storage, email, and jobs.',
    badge: 'Services',
  },
  {
    title: 'Incident timeline',
    description: 'Current incidents, historical updates, and resolution notes.',
    badge: 'Incidents',
  },
  {
    title: 'Subscribe controls',
    description: 'Email, RSS, webhook, and in-app status notifications.',
    badge: 'Subscribe',
  },
] as const;

const statusControls = [
  {
    title: 'Post update',
    description: 'Publish incident updates with timestamp and severity.',
    badge: 'Update',
  },
  {
    title: 'Notify subscribers',
    description: 'Send incident updates through configured channels.',
    badge: 'Notify',
  },
  {
    title: 'Show uptime',
    description: 'Expose rolling uptime without leaking internal details.',
    badge: 'Uptime',
  },
] as const;

/**
 * Render a source-backed status page recipe.
 *
 * @returns A public service status and incident page.
 * @example
 * const element = <StatusPage />;
 */
export const StatusPage = () => {
  // TODO: Load public service status and incidents from the configured status source.
  // TODO: Publish incident updates through the configured status action.
  return (
    <DemoQuickWinPage
      active="status"
      badge="Status"
      detailItems={statusControls}
      detailTitle="Incident controls"
      eyebrow="Public"
      listDescription="A public trust page for operational status, incident updates, and subscribers."
      listItems={statusItems}
      listTitle="Service status"
      metrics={metrics}
      primaryAction={{ label: 'Subscribe', icon: <Bell className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View incidents',
        icon: <HeartPulse className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A public status page with service health, incidents, uptime, subscriptions, and update publishing states."
      title="Service status"
      transition="scale"
      variantDescription="Status pages need public clarity, operational confidence, and incident history."
      variantItems={statusControls}
      variantTitle="Status component variants"
    />
  );
};
