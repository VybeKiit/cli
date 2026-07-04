'use client';

import type { LucideIcon } from 'lucide-react';
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

import { LightPanel } from '@/components/landing/kit/LightPanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SystemRow {
  readonly name: string;
  readonly icon: LucideIcon;
}

const SYSTEMS: readonly SystemRow[] = [
  { name: 'Auth', icon: Lock },
  { name: 'Database', icon: Database },
  { name: 'Payments', icon: CreditCard },
  { name: 'Emails', icon: Mail },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Cron Jobs', icon: Clock },
];

interface FeedRow {
  readonly text: string;
  readonly time?: string;
  readonly icon: LucideIcon;
}

const FEED: readonly FeedRow[] = [
  { text: 'All systems operational', icon: Check },
  { text: 'New user registered', time: '2m ago', icon: UserPlus },
  { text: 'Payment received', time: '7m ago', icon: CreditCard },
  { text: 'Email sent', time: '12m ago', icon: Mail },
  { text: 'Report generated', time: '18m ago', icon: FileText },
];

/** Operator Console zig-zag mockup — services list + live activity feed, visual only. */
export function OperatorConsoleMock() {
  return (
    <LightPanel
      contentClassName="grid gap-4 md:grid-cols-2"
      description="Everything running. Automatically."
      title="Operator Console"
    >
      <Card className="gap-0 border-black/6 bg-white py-0 shadow-none">
        <CardContent className="space-y-2 p-4">
          {SYSTEMS.map((system) => (
            <div
              className="flex items-center gap-3 rounded-lg border border-black/5 bg-[#f8fafc] px-3 py-2.5"
              key={system.name}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2f7] text-[#4a5567]">
                <system.icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="font-medium text-[var(--light-text)] text-sm">{system.name}</span>
              <Badge className="ms-auto border-emerald-200 bg-emerald-50 text-emerald-700">
                Active
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="gap-0 border-black/6 bg-white py-0 shadow-none">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-[var(--light-text)] text-sm">Activity Feed</p>
            <span className="font-medium text-[var(--blue-strong)] text-xs">View all</span>
          </div>
          <Separator className="mb-3 bg-black/6" />
          <ul className="space-y-3">
            {FEED.map((row) => (
              <li className="flex items-center gap-2.5" key={row.text}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#eef4ff] text-[var(--blue-strong)]">
                  <row.icon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <span className="text-[var(--light-text)] text-xs">{row.text}</span>
                {row.time ? (
                  <span className="ms-auto text-[10px] text-[var(--light-muted)]">{row.time}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </LightPanel>
  );
}
