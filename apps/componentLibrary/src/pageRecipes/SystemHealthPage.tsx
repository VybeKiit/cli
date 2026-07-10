'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent } from '@vybekiit/ui/card';
import { Skeleton } from '@vybekiit/ui/skeleton';
import { Activity, HeartPulse, Loader2, RefreshCw, RotateCcw, Server } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type HealthStatus = 'healthy' | 'degraded' | 'down';
type JobStatus = 'ok' | 'delayed' | 'failed';
type LoadState = 'loading' | 'ready' | 'error';

/** One monitored service. */
type ServiceHealth = {
  readonly id: string;
  readonly name: string;
  readonly status: HealthStatus;
  readonly latencyMs: number;
  readonly errorRate: string;
};

/** One background queue. */
type Queue = {
  readonly id: string;
  readonly name: string;
  readonly depth: number;
  readonly status: HealthStatus;
};

/** One scheduled / worker job (mirrors job_runs). */
type JobRun = {
  readonly id: string;
  readonly name: string;
  readonly status: JobStatus;
  readonly lastRun: string;
  readonly nextRun: string;
};

const HEALTH_META: Record<HealthStatus, { readonly label: string; readonly className: string }> = {
  healthy: {
    label: 'Healthy',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  degraded: {
    label: 'Degraded',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  down: {
    label: 'Down',
    className: 'border-red-500/40 bg-red-500/10 text-red-600',
  },
};

const JOB_META: Record<JobStatus, { readonly label: string; readonly className: string }> = {
  ok: {
    label: 'OK',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  delayed: {
    label: 'Delayed',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-600',
  },
  failed: {
    label: 'Failed',
    className: 'border-red-500/40 bg-red-500/10 text-red-600',
  },
};

const INITIAL_SERVICES: readonly ServiceHealth[] = [
  { id: 'api', name: 'API', status: 'healthy', latencyMs: 82, errorRate: '0.02%' },
  { id: 'db', name: 'Database', status: 'healthy', latencyMs: 11, errorRate: '0.00%' },
  { id: 'storage', name: 'Object storage', status: 'degraded', latencyMs: 240, errorRate: '0.08%' },
  { id: 'email', name: 'Email provider', status: 'healthy', latencyMs: 180, errorRate: '0.01%' },
  { id: 'auth', name: 'Auth', status: 'healthy', latencyMs: 54, errorRate: '0.00%' },
];

const INITIAL_QUEUES: readonly Queue[] = [
  { id: 'q_webhooks', name: 'Webhooks', depth: 3, status: 'healthy' },
  { id: 'q_email', name: 'Email', depth: 12, status: 'healthy' },
  { id: 'q_search', name: 'Search index', depth: 48, status: 'degraded' },
];

const INITIAL_JOBS: readonly JobRun[] = [
  {
    id: 'job_01',
    name: 'webhook-retry',
    status: 'ok',
    lastRun: '4m ago',
    nextRun: 'in 6m',
  },
  {
    id: 'job_02',
    name: 'nightly-backup',
    status: 'ok',
    lastRun: '6h ago',
    nextRun: 'in 18h',
  },
  {
    id: 'job_03',
    name: 'search-reindex',
    status: 'delayed',
    lastRun: '2h ago',
    nextRun: 'overdue',
  },
  {
    id: 'job_04',
    name: 'invoice-sync',
    status: 'failed',
    lastRun: '1h ago',
    nextRun: 'manual',
  },
];

const LOAD_MS = 750;

/**
 * A production-shaped system health console: service statuses, queue depths, job_runs-style cron
 * list with retry, loading skeleton, and forced error/retry. Fully interactive with local state.
 *
 * @returns The system health recipe element.
 * @example
 * const element = <SystemHealthPage />;
 */
export const SystemHealthPage = () => {
  // TODO: Load service health, queue depth, and job status from job_runs + observability probes.
  // TODO: Retry failed jobs via POST /api/admin/jobs/:id/retry and log the action.
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [services, setServices] = useState<readonly ServiceHealth[]>(INITIAL_SERVICES);
  const [queues, setQueues] = useState<readonly Queue[]>(INITIAL_QUEUES);
  const [jobs, setJobs] = useState<readonly JobRun[]>(INITIAL_JOBS);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');

  const runLoad = (fail = false) => {
    setLoadState('loading');
    setNotice(null);
    globalThis.setTimeout(() => {
      if (fail) {
        setLoadState('error');
        return;
      }
      setServices(INITIAL_SERVICES);
      setQueues(INITIAL_QUEUES);
      setJobs(INITIAL_JOBS);
      setLoadState('ready');
    }, LOAD_MS);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: simulate the initial fetch once on mount.
  useEffect(() => {
    runLoad();
  }, []);

  const kpis = useMemo(() => {
    const degraded = services.filter((s) => s.status !== 'healthy').length;
    const queueDepth = queues.reduce((sum, q) => sum + q.depth, 0);
    const failedJobs = jobs.filter((j) => j.status === 'failed').length;
    return { degraded, queueDepth, failedJobs, services: services.length };
  }, [services, queues, jobs]);

  const visibleJobs = useMemo(
    () => (statusFilter === 'all' ? jobs : jobs.filter((j) => j.status === statusFilter)),
    [jobs, statusFilter],
  );

  const retryJob = (id: string) => {
    setBusyJobId(id);
    setNotice(null);
    globalThis.setTimeout(() => {
      setJobs((current) =>
        current.map((job) =>
          job.id === id
            ? { ...job, status: 'ok' as const, lastRun: 'Just now', nextRun: 'in 15m' }
            : job,
        ),
      );
      setBusyJobId(null);
      setNotice('Job retried and marked OK.');
    }, 900);
  };

  let healthBody: ReactNode;
  if (loadState === 'error') {
    healthBody = (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center px-4 py-16 text-center">
          <HeartPulse aria-hidden="true" className="h-10 w-10 text-destructive" />
          <h2 className="mt-4 font-semibold text-lg">Could not load health data</h2>
          <p className="mt-1 max-w-sm text-muted-foreground text-sm">
            The observability source timed out. Retry when the probe endpoint is reachable.
          </p>
          <Button className="mt-4" onClick={() => runLoad(false)} type="button">
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  } else if (loadState === 'loading') {
    healthBody = (
      <div className="space-y-4" role="status">
        <span className="sr-only">Loading system health</span>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-20 w-full" key={`kpi-${String(index)}`} />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  } else {
    healthBody = (
      <>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={<Server aria-hidden="true" className="h-4 w-4" />}
            label="Services"
            value={String(kpis.services)}
          />
          <Kpi
            icon={<HeartPulse aria-hidden="true" className="h-4 w-4" />}
            label="Degraded"
            value={String(kpis.degraded)}
            valueClassName={kpis.degraded > 0 ? 'text-amber-600' : undefined}
          />
          <Kpi
            icon={<Activity aria-hidden="true" className="h-4 w-4" />}
            label="Queue depth"
            value={String(kpis.queueDepth)}
          />
          <Kpi
            icon={<RotateCcw aria-hidden="true" className="h-4 w-4" />}
            label="Failed jobs"
            value={String(kpis.failedJobs)}
            valueClassName={kpis.failedJobs > 0 ? 'text-red-600' : undefined}
          />
        </div>

        <section className="mb-6 space-y-3">
          <h2 className="font-semibold text-lg">Services</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((svc) => (
              <Card key={svc.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{svc.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {svc.latencyMs}ms · errors {svc.errorRate}
                    </p>
                  </div>
                  <Badge
                    className={cn('font-normal', HEALTH_META[svc.status].className)}
                    variant="outline"
                  >
                    {HEALTH_META[svc.status].label}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-6 space-y-3">
          <h2 className="font-semibold text-lg">Queues</h2>
          <Card>
            <CardContent className="divide-y p-0">
              {queues.map((queue) => (
                <div className="flex items-center justify-between gap-3 px-4 py-3" key={queue.id}>
                  <div>
                    <p className="font-medium text-sm">{queue.name}</p>
                    <p className="text-muted-foreground text-xs">Depth {queue.depth}</p>
                  </div>
                  <Badge
                    className={cn('font-normal', HEALTH_META[queue.status].className)}
                    variant="outline"
                  >
                    {HEALTH_META[queue.status].label}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-lg">Scheduled jobs</h2>
            <div className="flex flex-wrap gap-1 rounded-lg border bg-muted p-1">
              {(['all', 'ok', 'delayed', 'failed'] as const).map((value) => (
                <button
                  aria-pressed={statusFilter === value}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium text-sm capitalize',
                    statusFilter === value ? 'bg-background shadow-sm' : 'text-muted-foreground',
                  )}
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <Card>
            <CardContent className="p-2 sm:p-3">
              {visibleJobs.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <Activity aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-3 font-semibold">No jobs in this state</h3>
                  <Button
                    className="mt-4"
                    onClick={() => setStatusFilter('all')}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Show all
                  </Button>
                </div>
              ) : (
                <ul className="divide-y">
                  {visibleJobs.map((job) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-3 px-2 py-3"
                      key={job.id}
                    >
                      <div>
                        <p className="font-mono font-medium text-sm">{job.name}</p>
                        <p className="text-muted-foreground text-xs">
                          Last {job.lastRun} · Next {job.nextRun}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn('font-normal', JOB_META[job.status].className)}
                          variant="outline"
                        >
                          {JOB_META[job.status].label}
                        </Badge>
                        {job.status === 'failed' || job.status === 'delayed' ? (
                          <Button
                            disabled={busyJobId === job.id}
                            onClick={() => retryJob(job.id)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {busyJobId === job.id ? (
                              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                            )}
                            Retry
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </>
    );
  }

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Health
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">System health</h1>
            <p className="max-w-xl text-muted-foreground">
              Services, queues, and scheduled jobs for operators. Refresh, force an error, or retry
              a failed job.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={loadState === 'loading'}
              onClick={() => runLoad(true)}
              type="button"
              variant="outline"
            >
              Simulate outage
            </Button>
            <Button disabled={loadState === 'loading'} onClick={() => runLoad(false)} type="button">
              {loadState === 'loading' ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>
        {notice ? (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-emerald-700 text-sm">
            {notice}
          </div>
        ) : null}

        {healthBody}

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — refresh, error, filters, and job retry all work
              offline. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Run <code>vybekiit apply-preset job_runs</code> for <code>job_name</code>,{' '}
                <code>status</code>, <code>started_at</code>, <code>finished_at</code>,{' '}
                <code>error</code>.
              </li>
              <li>
                <code>GET /api/admin/health</code> aggregates probes + recent job_runs + queue
                depths from your worker.
              </li>
              <li>
                Retry maps to <code>POST /api/admin/jobs/:id/retry</code> via{' '}
                <code>@vybekiit/jobs</code> and writes a new job_runs row.
              </li>
              <li>
                Guard this route for operators only; page incidents out to the public Status recipe
                when thresholds trip.
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
    <DemoTransitionStage defaultTransition="fade" title="System health motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

/** One KPI tile. */
const Kpi = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string;
}) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className={cn('font-semibold text-lg tabular-nums', valueClassName)}>{value}</p>
      </div>
    </CardContent>
  </Card>
);
