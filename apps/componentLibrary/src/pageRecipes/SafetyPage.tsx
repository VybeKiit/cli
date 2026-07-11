'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { Kpi } from '@vybekiit/ui/kpi';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Play,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from './shared/DemoPlugInPanel';
import { DemoRecipeFrame } from './shared/DemoRecipeFrame';

type CheckStatus = 'pass' | 'fail' | 'warn' | 'pending';

/** One safety / doctor check row. */
type SafetyCheck = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly status: CheckStatus;
  readonly acknowledged: boolean;
};

/** One incident row from error tracking. */
type Incident = {
  readonly id: string;
  readonly title: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly when: string;
};

const INITIAL_CHECKS: readonly SafetyCheck[] = [
  {
    id: 'chk_auth',
    label: 'Sign-in protected',
    detail: 'Private routes require a session cookie.',
    status: 'pass',
    acknowledged: true,
  },
  {
    id: 'chk_secrets',
    label: 'Secrets hidden',
    detail: 'No provider keys in client bundles.',
    status: 'pass',
    acknowledged: true,
  },
  {
    id: 'chk_errors',
    label: 'Error alerts connected',
    detail: 'Unhandled exceptions route to the tracker.',
    status: 'warn',
    acknowledged: false,
  },
  {
    id: 'chk_rls',
    label: 'Row-level policies',
    detail: 'Tenant tables enforce owner/org scoping.',
    status: 'fail',
    acknowledged: false,
  },
  {
    id: 'chk_webhooks',
    label: 'Webhook signatures',
    detail: 'Payment webhooks verify HMAC before write.',
    status: 'pass',
    acknowledged: true,
  },
];

const INITIAL_INCIDENTS: readonly Incident[] = [
  {
    id: 'inc_01',
    title: 'Checkout timeout spike',
    severity: 'high',
    when: '2h ago',
  },
  {
    id: 'inc_02',
    title: 'Slow query on customers list',
    severity: 'medium',
    when: 'Yesterday',
  },
  {
    id: 'inc_03',
    title: 'Email bounce rate up 2%',
    severity: 'low',
    when: '3d ago',
  },
];

const STATUS_META: Record<
  CheckStatus,
  { readonly label: string; readonly className: string; readonly icon: ReactNode }
> = {
  pass: {
    label: 'Pass',
    className: 'text-emerald-600',
    icon: <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-600" />,
  },
  fail: {
    label: 'Fail',
    className: 'text-red-600',
    icon: <XCircle aria-hidden="true" className="h-4 w-4 text-red-600" />,
  },
  warn: {
    label: 'Warn',
    className: 'text-amber-600',
    icon: <AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-600" />,
  },
  pending: {
    label: 'Pending',
    className: 'text-muted-foreground',
    icon: <Circle aria-hidden="true" className="h-4 w-4 text-muted-foreground" />,
  },
};

/**
 * Interactive safety doctor: run checks, acknowledge warnings, filter incidents.
 * Plug-in panel maps onto audit_log + error tracking.
 *
 * @returns The safety recipe element.
 * @example
 * const element = <SafetyPage />;
 */
export const SafetyPage = () => {
  // TODO: Connect checks to the configured safety scanner and audit log.
  // TODO: Connect incident rows to the configured error tracking provider.
  const [checks, setChecks] = useState<readonly SafetyCheck[]>(INITIAL_CHECKS);
  const [incidents] = useState<readonly Incident[]>(INITIAL_INCIDENTS);
  const [severityFilter, setSeverityFilter] = useState<'all' | Incident['severity']>('all');
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const summary = useMemo(() => {
    const fail = checks.filter((check) => check.status === 'fail').length;
    const warn = checks.filter((check) => check.status === 'warn').length;
    const pass = checks.filter((check) => check.status === 'pass').length;
    const next = checks.find(
      (check) => (check.status === 'fail' || check.status === 'warn') && !check.acknowledged,
    );
    return { fail, warn, pass, next };
  }, [checks]);

  const visibleIncidents = useMemo(
    () =>
      severityFilter === 'all'
        ? incidents
        : incidents.filter((incident) => incident.severity === severityFilter),
    [incidents, severityFilter],
  );

  const runChecks = () => {
    setRunning(true);
    setChecks((current) => current.map((check) => ({ ...check, status: 'pending' as const })));
    globalThis.setTimeout(() => {
      setChecks(INITIAL_CHECKS);
      setRunning(false);
      setLastRun('Just now');
      setNotice('Doctor finished. Fix row-level policies next.');
    }, 1100);
  };

  const acknowledge = (id: string) => {
    setChecks((current) =>
      current.map((check) =>
        check.id === id ? { ...check, acknowledged: !check.acknowledged } : check,
      ),
    );
  };

  return (
    <DemoRecipeFrame defaultTransition="scale" title="Safety motion pass">
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Safety
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Ready to ship checklist</h1>
          <p className="max-w-xl text-muted-foreground">
            Run the doctor, acknowledge warnings, and keep the one next fix visible.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          {(
            [
              {
                key: 'pass',
                label: 'Pass',
                value: summary.pass,
                valueClassName: 'text-emerald-600',
              },
              { key: 'warn', label: 'Warn', value: summary.warn, valueClassName: 'text-amber-600' },
              { key: 'fail', label: 'Fail', value: summary.fail, valueClassName: 'text-red-600' },
            ] as const
          ).map(({ key, ...tile }) => (
            <Kpi key={key} {...tile} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base">Doctor checks</CardTitle>
              <Button disabled={running} onClick={runChecks} size="sm" type="button">
                <Play aria-hidden="true" className={cn('h-4 w-4', running && 'animate-pulse')} />
                {running ? 'Running…' : 'Run checks'}
              </Button>
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              <ul aria-label="Safety checks" className="divide-y">
                {checks.map((check) => {
                  const meta = STATUS_META[check.status];
                  return (
                    <li className="flex items-start gap-3 px-2 py-3" key={check.id}>
                      <span className="mt-0.5">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-sm">{check.label}</p>
                          <Badge className={cn('font-normal', meta.className)} variant="outline">
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-muted-foreground text-sm">{check.detail}</p>
                      </div>
                      {(check.status === 'fail' || check.status === 'warn') && (
                        <div className="flex shrink-0 items-center gap-2 text-muted-foreground text-xs">
                          <Checkbox
                            aria-label={`Acknowledge ${check.label}`}
                            checked={check.acknowledged}
                            onCheckedChange={() => acknowledge(check.id)}
                          />
                          <span aria-hidden="true">Ack</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-amber-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert aria-hidden="true" className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Doctor status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {summary.next ? (
                  <>
                    <p className="font-medium">One thing to fix next</p>
                    <p className="text-muted-foreground">{summary.next.label}</p>
                    <p className="text-muted-foreground text-xs">{summary.next.detail}</p>
                  </>
                ) : (
                  <div className="flex items-start gap-2 text-emerald-700">
                    <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4" />
                    <p>All open checks are acknowledged or passing.</p>
                  </div>
                )}
                <p className="text-muted-foreground text-xs">
                  Last run: {lastRun ?? 'Not run this session'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent incidents</CardTitle>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(['all', 'high', 'medium', 'low'] as const).map((value) => (
                    <button
                      aria-pressed={severityFilter === value}
                      className={cn(
                        'rounded-md border px-2 py-1 font-medium text-xs capitalize transition-colors',
                        severityFilter === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      key={value}
                      onClick={() => setSeverityFilter(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-3">
                {visibleIncidents.length === 0 ? (
                  <p className="py-6 text-center text-muted-foreground text-sm">
                    No incidents at this severity.
                  </p>
                ) : (
                  visibleIncidents.map((incident) => (
                    <div className="rounded-lg border p-3" key={incident.id}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{incident.title}</p>
                        <Badge className="font-normal capitalize" variant="outline">
                          {incident.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">{incident.when}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — Run checks, acknowledge, and severity filters
            update live. To make it real:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset audit_log</code> for the audit trail table.
            </li>
            <li>
              Map doctor results from your safety scanner into{' '}
              <code>{'{ id, label, detail, status }'}</code>.
            </li>
            <li>
              Load incident rows from the error tracking provider; keep the severity chips as query
              filters.
            </li>
            <li>Acknowledge writes an audit_log row so the team sees who cleared a warning.</li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
