'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { Progress } from '@vybekiit/ui/progress';
import { ArrowRight, CheckCircle2, Circle, Clock, Rocket, Server } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

type ItemStatus = 'todo' | 'doing' | 'done';
type ItemCategory = 'backup' | 'domain' | 'deploy' | 'jobs';

/** One launch readiness item. */
type LaunchItem = {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly category: ItemCategory;
  readonly status: ItemStatus;
};

/** One scheduled job status row. */
type JobRow = {
  readonly id: string;
  readonly name: string;
  readonly schedule: string;
  readonly lastRun: string;
  readonly healthy: boolean;
};

const INITIAL_ITEMS: readonly LaunchItem[] = [
  {
    id: 'launch_backup',
    label: 'Back up code',
    detail: 'Confirm the repo is mirrored and tagged.',
    category: 'backup',
    status: 'done',
  },
  {
    id: 'launch_domain',
    label: 'Connect domain',
    detail: 'DNS A/CNAME points at the host.',
    category: 'domain',
    status: 'doing',
  },
  {
    id: 'launch_deploy',
    label: 'Put app online',
    detail: 'Production deploy is green and reachable.',
    category: 'deploy',
    status: 'todo',
  },
  {
    id: 'launch_ssl',
    label: 'HTTPS certificate',
    detail: 'TLS provisioned for the custom domain.',
    category: 'domain',
    status: 'todo',
  },
  {
    id: 'launch_jobs',
    label: 'Check scheduled jobs',
    detail: 'Cron workers last ran without errors.',
    category: 'jobs',
    status: 'todo',
  },
  {
    id: 'launch_env',
    label: 'Production secrets',
    detail: 'Payment, auth, and email keys are set.',
    category: 'deploy',
    status: 'doing',
  },
];

const INITIAL_JOBS: readonly JobRow[] = [
  {
    id: 'job_digest',
    name: 'Daily digest email',
    schedule: '0 9 * * *',
    lastRun: 'Today 09:00',
    healthy: true,
  },
  {
    id: 'job_webhook',
    name: 'Webhook retry sweep',
    schedule: '*/15 * * * *',
    lastRun: '12m ago',
    healthy: true,
  },
  {
    id: 'job_backup',
    name: 'Nightly DB snapshot',
    schedule: '0 2 * * *',
    lastRun: 'Failed',
    healthy: false,
  },
];

const CATEGORY_FILTERS: readonly {
  readonly value: 'all' | ItemCategory;
  readonly label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'backup', label: 'Backup' },
  { value: 'domain', label: 'Domain' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'jobs', label: 'Jobs' },
];

/**
 * Interactive launch checklist: complete items, filter by category, watch progress, scan jobs.
 *
 * @returns The launch checklist recipe element.
 * @example
 * const element = <LaunchChecklistPage />;
 */
export const LaunchChecklistPage = () => {
  // TODO: Connect deployment status to the configured hosting provider.
  // TODO: Connect scheduled job status to the jobs feature.
  const [items, setItems] = useState<readonly LaunchItem[]>(INITIAL_ITEMS);
  const [jobs, setJobs] = useState<readonly JobRow[]>(INITIAL_JOBS);
  const [filter, setFilter] = useState<'all' | ItemCategory>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.category === filter)),
    [items, filter],
  );

  const progress = useMemo(() => {
    const done = items.filter((item) => item.status === 'done').length;
    return {
      done,
      total: items.length,
      percent: Math.round((done / items.length) * 100),
    };
  }, [items]);

  const nextItem = items.find((item) => item.status !== 'done');

  const toggleItem = (id: string) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }
        const nextStatus: ItemStatus = item.status === 'done' ? 'todo' : 'done';
        return { ...item, status: nextStatus };
      }),
    );
  };

  const markNextDone = () => {
    if (!nextItem) {
      setNotice('Launch checklist complete.');
      return;
    }
    toggleItem(nextItem.id);
    setNotice(`Marked “${nextItem.label}” done.`);
  };

  const retryJob = (id: string) => {
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, healthy: true, lastRun: 'Just now' } : job)),
    );
    setNotice('Job re-queued successfully.');
  };

  return (
    <Frame>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Badge className="w-fit" variant="secondary">
              Go live
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Launch checklist</h1>
            <p className="max-w-xl text-muted-foreground">
              Domain, backup, deploy, and jobs on one page. Progress updates as you check items off.
            </p>
          </div>
          <Rocket aria-hidden="true" className="h-10 w-10 text-blue-600" />
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <Card className="mb-4">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-sm">
                {progress.done} of {progress.total} ready ({progress.percent}%)
              </p>
              <Button onClick={markNextDone} size="sm" type="button">
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
                {nextItem ? 'Continue launch' : 'All done'}
              </Button>
            </div>
            <Progress value={progress.percent} />
            {nextItem ? (
              <p className="text-muted-foreground text-sm">
                Next: <span className="font-medium text-foreground">{nextItem.label}</span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                Ready to go live.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="mb-3 flex flex-wrap gap-1 rounded-lg border bg-muted p-1">
          {CATEGORY_FILTERS.map((option) => (
            <button
              aria-pressed={filter === option.value}
              className={cn(
                'rounded-md px-3 py-1.5 font-medium text-sm transition-colors',
                filter === option.value
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              key={option.value}
              onClick={() => setFilter(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardContent className="p-2 sm:p-3">
              {visible.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <Circle aria-hidden="true" className="h-8 w-8 text-muted-foreground" />
                  <h2 className="mt-3 font-semibold">Nothing in this category</h2>
                  <Button
                    className="mt-4"
                    onClick={() => setFilter('all')}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Show all
                  </Button>
                </div>
              ) : (
                <ul aria-label="Launch checklist" className="divide-y">
                  {visible.map((item) => {
                    const done = item.status === 'done';
                    return (
                      <li className="flex items-start gap-3 px-2 py-3" key={item.id}>
                        <Checkbox
                          aria-label={done ? `Reopen ${item.label}` : `Complete ${item.label}`}
                          checked={done}
                          className="mt-1"
                          onCheckedChange={() => toggleItem(item.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'font-medium text-sm',
                              done && 'text-muted-foreground line-through',
                            )}
                          >
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-muted-foreground text-xs">
                            {item.detail}
                            {item.status === 'doing' ? ' · In progress' : ''}
                          </p>
                        </div>
                        <Badge className="font-normal capitalize" variant="outline">
                          {item.category}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Server aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Scheduled jobs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-3">
              {jobs.map((job) => (
                <div className="rounded-lg border p-3" key={job.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{job.name}</p>
                      <p className="mt-0.5 font-mono text-muted-foreground text-xs">
                        {job.schedule}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        'font-normal',
                        job.healthy
                          ? 'border-emerald-500/30 text-emerald-600'
                          : 'border-red-500/30 text-red-600',
                      )}
                      variant="outline"
                    >
                      {job.healthy ? 'Healthy' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock aria-hidden="true" className="h-3 w-3" />
                      {job.lastRun}
                    </p>
                    {job.healthy ? null : (
                      <Button
                        onClick={() => retryJob(job.id)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — checkboxes recompute progress and job Retry flips
              health. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Map deploy/domain status from the configured hosting provider API into checklist
                rows.
              </li>
              <li>
                Run <code>vybekiit apply-preset job_runs</code> (or your jobs feature) and load
                last-run health into the sidebar.
              </li>
              <li>Persist checkbox state per workspace so the team shares one launch list.</li>
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
    <DemoTransitionStage defaultTransition="slide" title="Launch motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
