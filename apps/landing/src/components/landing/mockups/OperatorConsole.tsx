'use client';

import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';

const SYSTEMS = ['Auth', 'Database', 'Payments', 'Emails', 'Analytics', 'Cron Jobs'] as const;

const FEED = [
  'New user registered — 2m ago',
  'Payment received — 7m ago',
  'Email sent — 12m ago',
  'Report generated — 18m ago',
  'Webhook delivered — 24m ago',
  'Backup completed — 31m ago',
] as const;

/** Operator Console zig-zag mockup — visual-only light card. */
export function OperatorConsoleMock() {
  return (
    <div className="light-ui-card w-full rounded-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[var(--light-text)] text-xl">Operator Console</h3>
            <Badge
              className="border-[var(--blue)]/30 bg-[var(--blue)]/10 text-[10px] text-[var(--blue-strong)]"
              variant="outline"
            >
              Live
            </Badge>
          </div>
          <p className="text-[var(--light-muted)] text-sm">Everything running. Automatically.</p>
        </div>
        <Badge
          className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[var(--green)]"
          variant="outline"
        >
          All healthy
        </Badge>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <ul className="space-y-3">
          {SYSTEMS.map((name) => (
            <li
              className="flex items-center justify-between rounded-lg border border-black/5 bg-white/60 px-3 py-2 text-sm"
              key={name}
            >
              <span className="font-medium text-[var(--light-text)]">{name}</span>
              <Badge
                className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[10px] text-[var(--green)]"
                variant="outline"
              >
                Active
              </Badge>
            </li>
          ))}
        </ul>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-[var(--light-text)] text-sm">Activity Feed</p>
            <Badge
              className="border-[var(--green)]/30 bg-[var(--green-soft)] text-[10px] text-[var(--green)]"
              variant="outline"
            >
              Live
            </Badge>
          </div>
          <p className="mb-2 text-[var(--green)] text-xs">All systems operational</p>
          <ul className="space-y-2">
            {FEED.map((item) => (
              <li className="flex items-start gap-2 text-[var(--light-muted)] text-xs" key={item}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--blue)]" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-black/6 bg-[var(--light-card-muted)] p-3">
              <p className="text-[10px] text-[var(--light-muted)] uppercase tracking-wide">
                Uptime
              </p>
              <p className="font-bold text-2xl text-[var(--light-text)]">
                <AnimatedNumber value="99.98%" />
              </p>
            </div>
            <div className="rounded-lg border border-black/6 bg-[var(--light-card-muted)] p-3">
              <p className="text-[10px] text-[var(--light-muted)] uppercase tracking-wide">Tasks</p>
              <p className="font-bold text-2xl text-[var(--light-text)]">
                <AnimatedNumber value="24" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
