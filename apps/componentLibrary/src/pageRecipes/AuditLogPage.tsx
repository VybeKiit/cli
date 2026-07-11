'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Kpi } from '@vybekiit/ui/kpi';
import { Label } from '@vybekiit/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { Skeleton } from '@vybekiit/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@vybekiit/ui/table';
import {
  Download,
  FileClock,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { type ReactNode, useEffect, useId, useMemo, useState } from 'react';
import { SEARCH_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type Severity = 'info' | 'warning' | 'critical';
type SeverityFilter = 'all' | Severity;
type LoadState = 'loading' | 'ready' | 'error';

/** One audit trail row (mirrors the audit_log preset shape). */
type AuditEvent = {
  readonly id: string;
  readonly actor: string;
  readonly action: string;
  readonly resource: string;
  readonly severity: Severity;
  readonly at: string;
};

const SEVERITY_META: Record<Severity, { readonly label: string; readonly className: string }> = {
  info: {
    label: 'Info',
    className: 'border-border bg-muted text-muted-foreground',
  },
  warning: {
    label: 'Warning',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  critical: {
    label: 'Critical',
    className: 'border-red-500/40 bg-red-500/10 text-red-600',
  },
};

const SEVERITY_FILTERS: readonly { readonly value: SeverityFilter; readonly label: string }[] = [
  { value: 'all', label: 'All severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

const INITIAL_EVENTS: readonly AuditEvent[] = [
  {
    id: 'aud_01',
    actor: 'Maya Chen',
    action: 'role.changed',
    resource: 'user:u_sam',
    severity: 'warning',
    at: '2m ago',
  },
  {
    id: 'aud_02',
    actor: 'system',
    action: 'checkout.fulfilled',
    resource: 'order:VK-4821',
    severity: 'info',
    at: '18m ago',
  },
  {
    id: 'aud_03',
    actor: 'Jordan Lee',
    action: 'api_key.rotated',
    resource: 'key:pk_live_…9f2a',
    severity: 'warning',
    at: '1h ago',
  },
  {
    id: 'aud_04',
    actor: 'Sam Ortiz',
    action: 'session.revoked',
    resource: 'session:ses_04',
    severity: 'info',
    at: '3h ago',
  },
  {
    id: 'aud_05',
    actor: 'unknown',
    action: 'login.failed',
    resource: 'user:u_elena',
    severity: 'critical',
    at: '5h ago',
  },
  {
    id: 'aud_06',
    actor: 'Lee Park',
    action: 'member.suspended',
    resource: 'user:u_noah',
    severity: 'critical',
    at: '1d ago',
  },
  {
    id: 'aud_07',
    actor: 'system',
    action: 'job.retry',
    resource: 'job:webhook-retry',
    severity: 'info',
    at: '1d ago',
  },
  {
    id: 'aud_08',
    actor: 'Maya Chen',
    action: 'permission.updated',
    resource: 'role:editor',
    severity: 'warning',
    at: '2d ago',
  },
];

const LOAD_MS = 700;
const EXPORT_MS = 900;

/**
 * A production-shaped audit log: multi-row table with live search and severity filter, loading
 * skeleton, empty filter state, and CSV export. Fully interactive with local state; plug-in panel
 * maps onto `vybekiit apply-preset audit_log`.
 *
 * @returns The audit log recipe element.
 * @example
 * const element = <AuditLogPage />;
 */
export const AuditLogPage = () => {
  // TODO: Load audit events from the audit_log preset via GET /api/admin/audit-log.
  // TODO: Export filtered audit events as CSV through the compliance export endpoint.
  const searchId = useId();
  const filterId = useId();
  const tableCaptionId = useId();

  const [events] = useState<readonly AuditEvent[]>(INITIAL_EVENTS);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const runLoad = () => {
    setLoadState('loading');
    setNotice(null);
    globalThis.setTimeout(() => setLoadState('ready'), LOAD_MS);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: simulate the initial fetch once on mount.
  useEffect(() => {
    runLoad();
  }, []);

  const visible = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSeverity = severity === 'all' || event.severity === severity;
      const matchesQuery =
        q.length === 0 ||
        event.actor.toLowerCase().includes(q) ||
        event.action.toLowerCase().includes(q) ||
        event.resource.toLowerCase().includes(q);
      return matchesSeverity && matchesQuery;
    });
  }, [events, debouncedQuery, severity]);

  const kpis = useMemo(() => {
    const critical = events.filter((e) => e.severity === 'critical').length;
    const warning = events.filter((e) => e.severity === 'warning').length;
    const actors = new Set(events.map((e) => e.actor)).size;
    return { total: events.length, critical, warning, actors };
  }, [events]);

  const clearFilters = () => {
    setQuery('');
    setSeverity('all');
  };

  const exportCsv = () => {
    setExporting(true);
    setNotice(null);
    globalThis.setTimeout(() => {
      setExporting(false);
      setNotice(`Exported ${visible.length} event(s) to audit-export.csv (demo).`);
    }, EXPORT_MS);
  };

  let trailStatus = 'Loading events…';
  if (loadState === 'ready') {
    trailStatus = `Showing ${visible.length} of ${events.length}`;
  } else if (loadState === 'error') {
    trailStatus = 'Failed to load events';
  }

  let tableBody: ReactNode;
  if (loadState === 'loading') {
    tableBody = (
      <div className="space-y-3" role="status">
        <span className="sr-only">Loading audit events</span>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-12 w-full" key={`sk-${String(index)}`} />
        ))}
      </div>
    );
  } else if (visible.length === 0) {
    tableBody = (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Search aria-hidden="true" className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-semibold text-lg">No events match</h2>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">
          Try a different actor, action, or clear the severity filter.
        </p>
        <Button className="mt-4" onClick={clearFilters} type="button" variant="outline">
          Clear filters
        </Button>
      </div>
    );
  } else {
    tableBody = (
      <div className="overflow-x-auto">
        <Table aria-labelledby={tableCaptionId}>
          <TableHeader>
            <TableRow>
              {(
                [
                  { key: 'when', label: 'When' },
                  { key: 'actor', label: 'Actor' },
                  { key: 'action', label: 'Action' },
                  { key: 'resource', label: 'Resource', className: 'hidden md:table-cell' },
                  { key: 'severity', label: 'Severity' },
                ] as const
              ).map(({ key, label, ...head }) => (
                <TableHead key={key} {...head}>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                  {event.at}
                </TableCell>
                <TableCell className="font-medium">{event.actor}</TableCell>
                <TableCell>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{event.action}</code>
                </TableCell>
                <TableCell className="hidden font-mono text-muted-foreground text-xs md:table-cell">
                  {event.resource}
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn('font-normal', SEVERITY_META[event.severity].className)}
                    variant="outline"
                  >
                    {SEVERITY_META[event.severity].label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <DemoRecipeFrame defaultTransition="fade" title="Audit log motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Audit
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Audit log</h1>
            <p className="max-w-xl text-muted-foreground">
              Who did what, to which resource, and when. Filter by severity or search actor and
              action — try a nonsense query for the empty state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={loadState === 'loading'}
              onClick={runLoad}
              type="button"
              variant="outline"
            >
              {loadState === 'loading' ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              disabled={exporting || loadState !== 'ready' || visible.length === 0}
              onClick={exportCsv}
              type="button"
            >
              {exporting ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Download aria-hidden="true" className="h-4 w-4" />
              )}
              Export CSV
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <Alert className="mb-4" variant="success">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        ) : null}

        <section aria-label="Audit metrics" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(
            [
              {
                key: 'events',
                icon: <FileClock aria-hidden="true" className="h-4 w-4" />,
                label: 'Events',
                value: String(kpis.total),
              },
              {
                key: 'critical',
                icon: <ShieldAlert aria-hidden="true" className="h-4 w-4" />,
                label: 'Critical',
                value: String(kpis.critical),
                valueClassName: kpis.critical > 0 ? 'text-red-600' : undefined,
              },
              {
                key: 'warnings',
                icon: <ShieldCheck aria-hidden="true" className="h-4 w-4" />,
                label: 'Warnings',
                value: String(kpis.warning),
                valueClassName: kpis.warning > 0 ? 'text-amber-600' : undefined,
              },
              {
                key: 'actors',
                icon: <Search aria-hidden="true" className="h-4 w-4" />,
                label: 'Actors',
                value: String(kpis.actors),
              },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </section>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base" id={tableCaptionId}>
                Event trail
              </CardTitle>
              <p aria-live="polite" className="text-muted-foreground text-sm">
                {trailStatus}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-64">
                <Label htmlFor={searchId}>Search</Label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    className="pl-9"
                    id={searchId}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Actor, action, resource…"
                    type="search"
                    value={query}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:w-44">
                <Label htmlFor={filterId}>Severity</Label>
                <Select
                  onValueChange={(value) => setSeverity(value as SeverityFilter)}
                  value={severity}
                >
                  <SelectTrigger id={filterId}>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>{tableBody}</CardContent>
        </Card>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — search and severity filters recompute the table,
            and Export builds a demo CSV. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset audit_log</code> for the append-only{' '}
              <code>audit_log</code> table.
            </li>
            <li>
              <code>GET /api/admin/audit-log?severity=&amp;q=</code> reads rows via{' '}
              <code>@vybekiit/db</code> (
              <code>{'{ actor_id, action, resource_type, resource_id, created_at }'}</code>).
            </li>
            <li>
              Write security-sensitive actions from auth, admin, and payments into this table —
              never update or delete rows.
            </li>
            <li>
              Export streams the filtered set as CSV from an admin-guarded compliance endpoint.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
