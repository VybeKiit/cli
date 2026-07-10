'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Activity, Bell, CheckCircle2, CircleAlert, Loader2, MonitorCheck } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

/** One public service row. */
type Service = {
  readonly id: string;
  readonly name: string;
  readonly status: ServiceStatus;
  readonly uptime: string;
  readonly latency: string;
};

/** One incident on the public timeline. */
type Incident = {
  readonly id: string;
  readonly title: string;
  readonly status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  readonly severity: 'minor' | 'major';
  readonly updatedAt: string;
  readonly summary: string;
};

const SERVICE_META: Record<
  ServiceStatus,
  { readonly label: string; readonly className: string; readonly dot: string }
> = {
  operational: {
    label: 'Operational',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
    dot: 'bg-emerald-500',
  },
  degraded: {
    label: 'Degraded',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
    dot: 'bg-amber-500',
  },
  outage: {
    label: 'Outage',
    className: 'border-red-500/40 bg-red-500/10 text-red-600',
    dot: 'bg-red-500',
  },
};

const INITIAL_SERVICES: readonly Service[] = [
  {
    id: 'svc_api',
    name: 'API',
    status: 'operational',
    uptime: '99.99%',
    latency: '82ms',
  },
  {
    id: 'svc_auth',
    name: 'Auth',
    status: 'operational',
    uptime: '99.98%',
    latency: '64ms',
  },
  {
    id: 'svc_db',
    name: 'Database',
    status: 'operational',
    uptime: '99.99%',
    latency: '12ms',
  },
  {
    id: 'svc_storage',
    name: 'Storage',
    status: 'degraded',
    uptime: '99.90%',
    latency: '210ms',
  },
  {
    id: 'svc_email',
    name: 'Email',
    status: 'operational',
    uptime: '99.95%',
    latency: '—',
  },
  {
    id: 'svc_jobs',
    name: 'Background jobs',
    status: 'operational',
    uptime: '99.97%',
    latency: '—',
  },
];

const INITIAL_INCIDENTS: readonly Incident[] = [
  {
    id: 'inc_01',
    title: 'Elevated storage latency in us-west',
    status: 'monitoring',
    severity: 'minor',
    updatedAt: '45m ago',
    summary: 'Object storage reads are slower than usual. Uploads still succeed.',
  },
  {
    id: 'inc_02',
    title: 'Checkout webhook delay',
    status: 'resolved',
    severity: 'minor',
    updatedAt: 'Jul 3',
    summary: 'Lemon Squeezy deliveries were delayed ~12 minutes. All events caught up.',
  },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A production-shaped public status page: overall banner from service rollup, service list,
 * incident timeline, and email subscribe. Fully interactive with local state; includes a demo
 * toggle to simulate an outage for empty/incident states.
 *
 * @returns The status recipe element.
 * @example
 * const element = <StatusPage />;
 */
export const StatusPage = () => {
  // TODO: Load public service status and incidents from the configured status source.
  // TODO: Publish incident updates and subscriber emails through the status notification action.
  const emailId = useId();
  const emailErrorId = useId();

  const [services, setServices] = useState<readonly Service[]>(INITIAL_SERVICES);
  const [incidents, setIncidents] = useState<readonly Incident[]>(INITIAL_INCIDENTS);
  const [filter, setFilter] = useState<'all' | 'active'>('all');
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email);

  const overall = useMemo((): ServiceStatus => {
    if (services.some((s) => s.status === 'outage')) {
      return 'outage';
    }
    if (services.some((s) => s.status === 'degraded')) {
      return 'degraded';
    }
    return 'operational';
  }, [services]);

  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status !== 'resolved'),
    [incidents],
  );

  const visibleIncidents = filter === 'active' ? activeIncidents : incidents;

  let overallLabel = 'Major outage';
  if (overall === 'operational') {
    overallLabel = 'All systems operational';
  } else if (overall === 'degraded') {
    overallLabel = 'Partial degradation';
  }

  const simulateOutage = () => {
    setServices((current) =>
      current.map((svc) =>
        svc.id === 'svc_api' ? { ...svc, status: 'outage' as const, latency: 'timeout' } : svc,
      ),
    );
    setIncidents((current) => [
      {
        id: `inc_${Date.now()}`,
        title: 'API elevated error rate',
        status: 'investigating',
        severity: 'major',
        updatedAt: 'Just now',
        summary: 'Demo incident — investigating 5xx spike on /api/* routes.',
      },
      ...current,
    ]);
    setFilter('active');
    setNotice('Simulated API outage and opened an incident.');
  };

  const resolveAll = () => {
    setServices(INITIAL_SERVICES);
    setIncidents((current) =>
      current.map((inc) =>
        inc.status === 'resolved'
          ? inc
          : { ...inc, status: 'resolved' as const, updatedAt: 'Just now' },
      ),
    );
    setNotice('All services restored (demo).');
  };

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailValid) {
      return;
    }
    setSubscribing(true);
    globalThis.setTimeout(() => {
      setSubscribing(false);
      setSubscribed(true);
      setNotice(`Subscribed ${email} to status alerts.`);
    }, 700);
  };

  return (
    <Frame>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Public · Status
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Service status</h1>
          <p className="max-w-xl text-muted-foreground">
            Live health for API, auth, data, and jobs. Subscribe for incident alerts, or simulate an
            outage to see the degraded banner.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 text-sm">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
            {notice}
          </div>
        ) : null}

        <Card
          className={cn(
            'mb-6',
            overall === 'operational' && 'border-emerald-500/30',
            overall === 'degraded' && 'border-amber-500/40',
            overall === 'outage' && 'border-red-500/40',
          )}
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  overall === 'operational' && 'bg-emerald-500/10 text-emerald-600',
                  overall === 'degraded' && 'bg-amber-500/10 text-amber-600',
                  overall === 'outage' && 'bg-red-500/10 text-red-600',
                )}
              >
                {overall === 'operational' ? (
                  <MonitorCheck aria-hidden="true" className="h-6 w-6" />
                ) : (
                  <CircleAlert aria-hidden="true" className="h-6 w-6" />
                )}
              </span>
              <div>
                <p className="font-semibold text-lg">{overallLabel}</p>
                <p className="text-muted-foreground text-sm">
                  {activeIncidents.length === 0
                    ? 'No active incidents'
                    : `${activeIncidents.length} active incident(s)`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={simulateOutage} size="sm" type="button" variant="outline">
                Simulate outage
              </Button>
              {overall === 'operational' ? null : (
                <Button onClick={resolveAll} size="sm" type="button">
                  Resolve all
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="mb-6 space-y-3">
          <h2 className="font-semibold text-lg">Services</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {services.map((svc) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  key={svc.id}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn('h-2.5 w-2.5 rounded-full', SERVICE_META[svc.status].dot)}
                    />
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-muted-foreground text-xs">
                        Uptime {svc.uptime}
                        {svc.latency === '—' ? '' : ` · p50 ${svc.latency}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn('font-normal', SERVICE_META[svc.status].className)}
                    variant="outline"
                  >
                    {SERVICE_META[svc.status].label}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-lg">Incidents</h2>
            <div className="flex gap-1 rounded-lg border bg-muted p-1">
              <button
                aria-pressed={filter === 'all'}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium text-sm',
                  filter === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setFilter('all')}
                type="button"
              >
                All
              </button>
              <button
                aria-pressed={filter === 'active'}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium text-sm',
                  filter === 'active' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
                onClick={() => setFilter('active')}
                type="button"
              >
                Active
              </button>
            </div>
          </div>
          {visibleIncidents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center px-4 py-12 text-center">
                <Activity aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                <h3 className="mt-3 font-semibold">No active incidents</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Use Simulate outage to open a demo incident.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {visibleIncidents.map((inc) => (
                <li key={inc.id}>
                  <Card>
                    <CardContent className="space-y-2 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            'font-normal',
                            inc.severity === 'major'
                              ? 'border-red-500/40 bg-red-500/10 text-red-600'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-600',
                          )}
                          variant="outline"
                        >
                          {inc.severity === 'major' ? 'Major' : 'Minor'}
                        </Badge>
                        <Badge variant="secondary" className="font-normal capitalize">
                          {inc.status}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{inc.updatedAt}</span>
                      </div>
                      <p className="font-medium">{inc.title}</p>
                      <p className="text-muted-foreground text-sm">{inc.summary}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell aria-hidden="true" className="h-4 w-4" /> Subscribe to updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscribed ? (
              <p className="text-muted-foreground text-sm">
                You will get email when incidents open or resolve.
              </p>
            ) : (
              <form
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                noValidate={true}
                onSubmit={subscribe}
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={emailId}>Email</Label>
                  <Input
                    aria-describedby={emailTouched && !emailValid ? emailErrorId : undefined}
                    aria-invalid={emailTouched && !emailValid}
                    autoComplete="email"
                    id={emailId}
                    onBlur={() => setEmailTouched(true)}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                  {emailTouched && !emailValid ? (
                    <p className="text-destructive text-sm" id={emailErrorId}>
                      Enter a valid email address.
                    </p>
                  ) : null}
                </div>
                <Button disabled={subscribing} type="submit">
                  {subscribing ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bell aria-hidden="true" className="h-4 w-4" />
                  )}
                  Subscribe
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — overall status rolls up from services, and
              simulate/resolve update the incident list. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Derive service health from probes or <code>job_runs</code> / queue depth; never
                expose internal hostnames.
              </li>
              <li>
                Store incidents in a public-safe table; <code>GET /api/status</code> returns
                services + active incidents only.
              </li>
              <li>
                Subscribe stores emails; on status change, send via <code>@vybekiit/email</code> and
                log to <code>notifications_log</code>.
              </li>
              <li>
                Keep a separate admin tool for posting incident updates — this page is read-only for
                visitors.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="scale" title="Status motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
