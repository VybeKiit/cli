'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { geistMono } from '@/lib/fonts';

const TASKS = [
  { label: 'Provision database', time: '09:41:02', status: 'done' },
  { label: 'Wire Lemon Squeezy checkout', time: '09:41:18', status: 'done' },
  { label: 'Deploy web template', time: '09:42:05', status: 'active' },
  { label: 'Verify first payment', time: '09:42:31', status: 'pending' },
  { label: 'Sync mobile bundle', time: '—', status: 'pending' },
  { label: 'Configure email templates', time: '—', status: 'pending' },
] as const;

const LOG_LINES = [
  '> Connecting to Supabase...',
  '> Auth schema applied',
  '> Running health check...',
] as const;

function taskStatusDotClass(status: (typeof TASKS)[number]['status']): string {
  if (status === 'done') return 'bg-[var(--green)]';
  if (status === 'active') return 'animate-pulse bg-[var(--blue)]';
  return 'bg-[var(--text-faint)]';
}

/** AI Operator carousel slide — dark task list with sidebar and log panel. */
export function AIOperatorSlide() {
  return (
    <div className="flex h-full bg-[var(--bg-panel)] text-[var(--text-soft)]">
      <aside className="hidden w-[38%] shrink-0 flex-col border-white/10 border-e p-3 sm:flex">
        <p className="mb-2 font-semibold text-[11px] text-[var(--text-faint)] uppercase tracking-wide">
          Queue
        </p>
        <ul className="flex flex-1 flex-col gap-1.5 overflow-hidden">
          {TASKS.slice(0, 4).map((task) => (
            <li
              className="rounded-md border border-white/6 bg-black/25 px-2 py-1.5 text-[11px] text-white"
              key={task.label}
            >
              {task.label}
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-md border border-white/8 bg-black/30 p-2">
          <p className="text-[10px] text-[var(--text-faint)]">Progress</p>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[62%] rounded-full bg-[var(--blue)]" />
          </div>
          <p className="text-[10px] text-[var(--blue-soft)]">
            <AnimatedNumber value="62%" /> complete
          </p>
        </div>
        <Separator className="mt-2 bg-white/10" />
        <Skeleton className="mt-2 h-8 w-full bg-white/10" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <div className="mb-3 flex items-center justify-between border-white/10 border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-white">Operator</span>
            <Badge className="text-[10px]" variant="outline">
              v2.4
            </Badge>
          </div>
          <Badge
            className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[var(--green)]"
            variant="outline"
          >
            Active
          </Badge>
        </div>

        <ul className="flex flex-1 flex-col gap-1.5 overflow-hidden">
          {TASKS.map((task) => (
            <li key={task.label}>
              <Card className="border-white/8 bg-black/20 shadow-none">
                <CardContent className="flex items-center justify-between p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${taskStatusDotClass(task.status)}`}
                    />
                    <span className="truncate text-white text-xs">{task.label}</span>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] text-[var(--text-faint)] ${geistMono.className}`}
                  >
                    {task.time}
                  </span>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <div
          className={`mt-2 rounded-md border border-white/8 bg-black/40 p-2 ${geistMono.className}`}
        >
          {LOG_LINES.map((line) => (
            <p className="text-[10px] text-[var(--green)] leading-relaxed" key={line}>
              {line}
            </p>
          ))}
          <p className="text-[9px] text-[var(--text-faint)]">
            <span className="vybe-cursor">▋</span>
          </p>
        </div>
      </div>
    </div>
  );
}
