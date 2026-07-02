'use client';

import {
  BarChart3,
  Check,
  Clock,
  CreditCard,
  Database,
  FileText,
  Lock,
  Mail,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SystemRow {
  readonly name: string;
  readonly icon: LucideIcon;
  readonly tone: 'slate' | 'green';
}

const SYSTEMS: readonly SystemRow[] = [
  { name: 'Auth', icon: Lock, tone: 'slate' },
  { name: 'Database', icon: Database, tone: 'green' },
  { name: 'Payments', icon: CreditCard, tone: 'green' },
  { name: 'Emails', icon: Mail, tone: 'green' },
  { name: 'Analytics', icon: BarChart3, tone: 'green' },
  { name: 'Cron Jobs', icon: Clock, tone: 'green' },
];

interface FeedRow {
  readonly text: string;
  readonly time?: string;
  readonly icon: LucideIcon;
  readonly tone: 'slate' | 'blue' | 'green';
}

const FEED: readonly FeedRow[] = [
  { text: 'All systems operational', icon: Check, tone: 'slate' },
  { text: 'New user registered', time: '2m ago', icon: UserPlus, tone: 'blue' },
  { text: 'Payment received', time: '7m ago', icon: CreditCard, tone: 'green' },
  { text: 'Email sent', time: '12m ago', icon: Mail, tone: 'blue' },
  { text: 'Report generated', time: '18m ago', icon: FileText, tone: 'blue' },
];

const ICON_TONE = {
  slate: 'bg-[#e2e6ec] text-[#4a5567]',
  green: 'bg-[var(--green-soft)] text-[var(--green)]',
  blue: 'bg-[var(--blue)]/12 text-[var(--blue-strong)]',
} as const;

/** Operator Console zig-zag mockup — services list + live activity feed, visual only. */
export function OperatorConsoleMock() {
  return (
    <div className="light-ui-card w-full rounded-2xl">
      <div className="mb-6">
        <h3 className="font-bold text-[var(--light-text)] text-xl">Operator Console</h3>
        <p className="mt-1 text-[var(--light-muted)] text-sm">Everything running. Automatically.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ul className="space-y-2.5">
          {SYSTEMS.map((system) => (
            <li
              className="flex items-center gap-3 rounded-xl border border-black/5 bg-white/70 px-3 py-2.5"
              key={system.name}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ICON_TONE[system.tone]}`}
              >
                <system.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="font-medium text-[var(--light-text)] text-sm">{system.name}</span>
              <span className="ms-auto flex items-center gap-1.5 text-[var(--green)] text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
                Active
              </span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-black/6 bg-white/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-[var(--light-text)] text-sm">Activity Feed</p>
            <span className="font-medium text-[var(--blue-strong)] text-xs">View all</span>
          </div>
          <ul className="space-y-2.5">
            {FEED.map((row) => (
              <li className="flex items-center gap-2.5" key={row.text}>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${ICON_TONE[row.tone]}`}
                >
                  <row.icon className="h-3 w-3" strokeWidth={2.2} />
                </span>
                <span className="text-[var(--light-text)] text-xs">{row.text}</span>
                {row.time ? (
                  <span className="ms-auto text-[10px] text-[var(--light-muted)]">{row.time}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
