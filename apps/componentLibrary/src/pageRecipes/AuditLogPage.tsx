import { Activity, Download, FileClock, Filter, ShieldCheck } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Events',
    value: '342',
    detail: 'Last 24 hours',
    icon: <FileClock className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'High risk',
    value: '5',
    detail: 'Needs review',
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: 'amber',
  },
  {
    label: 'Actors',
    value: '28',
    detail: 'Humans and jobs',
    icon: <Activity className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Exports',
    value: 'CSV',
    detail: 'Compliance ready',
    icon: <Download className="h-5 w-5" />,
    tone: 'emerald',
  },
] as const;

const auditItems = [
  {
    title: 'Actor and target',
    description: 'Who did what, to which resource, and when.',
    badge: 'Trace',
  },
  {
    title: 'Severity filters',
    description: 'Info, warning, critical, billing, and access events.',
    badge: 'Filter',
  },
  {
    title: 'Export trail',
    description: 'Download filtered events for compliance review.',
    badge: 'Export',
  },
] as const;

const auditControls = [
  {
    title: 'Retention policy',
    description: 'Show how long admin events remain available.',
    badge: 'Policy',
  },
  {
    title: 'Sensitive event flag',
    description: 'Highlight destructive or privileged actions.',
    badge: 'Risk',
  },
  {
    title: 'Search metadata',
    description: 'Filter by actor, organization, resource, or event type.',
    badge: 'Search',
  },
] as const;

/**
 * Render a source-backed audit log page recipe.
 *
 * @returns A filterable audit trail page for admin and security events.
 * @example
 * const element = <AuditLogPage />;
 */
export const AuditLogPage = () => {
  // TODO: Load audit events from the configured audit log source.
  // TODO: Export audit events through the configured compliance action.
  return (
    <DemoQuickWinPage
      active="admin"
      badge="Audit"
      detailItems={auditControls}
      detailTitle="Audit controls"
      listDescription="A compliance-ready event view for admin actions and system changes."
      listItems={auditItems}
      listTitle="Audit log"
      metrics={metrics}
      primaryAction={{ label: 'Export log', icon: <Download className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Filter events',
        icon: <Filter className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A filterable audit log with actor, target, severity, search, export, and retention controls."
      title="Audit log"
      transition="fade"
      variantDescription="Audit pages need scan-friendly event rows, severity filters, and export clarity."
      variantItems={auditControls}
      variantTitle="Audit component variants"
    />
  );
};
