import { Activity, HeartPulse, MonitorCheck, RefreshCw, Signal } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Uptime',
    value: '99.99%',
    detail: '30-day window',
    icon: <MonitorCheck className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Queues',
    value: '3',
    detail: 'All draining',
    icon: <Activity className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Cron jobs',
    value: '12',
    detail: '1 delayed',
    icon: <RefreshCw className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Errors',
    value: '0.04%',
    detail: 'Below threshold',
    icon: <HeartPulse className="h-5 w-5" />,
    tone: 'rose',
  },
] as const;

const healthItems = [
  {
    title: 'Service status',
    description: 'API, database, storage, email, and worker health.',
    badge: 'Services',
  },
  {
    title: 'Queue depth',
    description: 'Background job backlog and retry states.',
    badge: 'Queues',
  },
  {
    title: 'Scheduled jobs',
    description: 'Cron health, last run, next run, and failure count.',
    badge: 'Cron',
  },
] as const;

const healthControls = [
  {
    title: 'Incident threshold',
    description: 'Define when warnings become visible incidents.',
    badge: 'Threshold',
  },
  {
    title: 'Retry failed jobs',
    description: 'Run safe retries for failed background work.',
    badge: 'Retry',
  },
  {
    title: 'Notify maintainers',
    description: 'Send alerts through the configured notification provider.',
    badge: 'Notify',
  },
] as const;

/**
 * Render a source-backed system health page recipe.
 *
 * @returns A system health page for services, queues, jobs, and errors.
 * @example
 * const element = <SystemHealthPage />;
 */
export const SystemHealthPage = () => {
  // TODO: Load service health, queue depth, and job status from the configured observability source.
  // TODO: Send health actions through the configured operations actions.
  return (
    <DemoQuickWinPage
      active="admin"
      badge="Health"
      detailItems={healthControls}
      detailTitle="Operations controls"
      listDescription="A maintainer-facing page for services, queues, cron jobs, and error rates."
      listItems={healthItems}
      listTitle="System health"
      metrics={metrics}
      primaryAction={{ label: 'Refresh health', icon: <RefreshCw className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View incidents',
        icon: <Signal className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A system health dashboard for services, background queues, scheduled jobs, uptime, and error rates."
      title="System health"
      transition="fade"
      variantDescription="Health pages need dense service status, queue states, and clear incident thresholds."
      variantItems={healthControls}
      variantTitle="System health variants"
    />
  );
};
