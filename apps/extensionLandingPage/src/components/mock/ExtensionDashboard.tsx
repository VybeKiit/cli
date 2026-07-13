'use client';

import { AnimatedCounter } from '@vybekiit/ui/animated-counter';
import { IconBox } from '@vybekiit/ui/icon-box';
import { Switch } from '@vybekiit/ui/switch';
import { ChevronDown } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import { resolveIcon } from '@/components/ui/IconRegistry';
import { DASHBOARD, DASHBOARD_ROWS, DASHBOARD_SPARKLINE } from '@/data/landingContent';
import { cn } from '@/lib/utils';

/**
 * Rebuilt extension dashboard shown inside the hero browser window — a summary
 * card with a count-up headline stat and a sparkline, then a mapped list of
 * quick-action rows (icon well + label + trailing badge or switch).
 *
 * `'use client'` because the count-up and switches are interactive leaves.
 *
 * @returns The rendered extension panel mock.
 * @example
 * <BrowserWindow variant="chrome"><ExtensionDashboard /></BrowserWindow>
 */
export const ExtensionDashboard = () => (
  <div className="flex h-full flex-col gap-3 bg-muted/20 p-4 text-foreground">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <IconBox className="bg-primary text-primary-foreground" shape="rounded" size="sm">
          <span className="font-bold text-xs">E</span>
        </IconBox>
        <span className="font-semibold text-sm">{DASHBOARD.title}</span>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </div>

    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-muted-foreground text-xs">{DASHBOARD.summaryLabel}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <div>
          <AnimatedCounter className="text-3xl text-primary" value={DASHBOARD.headlineValue} />
          <p className="text-muted-foreground text-xs">{DASHBOARD.headlineCaption}</p>
        </div>
        <div className="h-12 w-24">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={[...DASHBOARD_SPARKLINE]}>
              <Line
                dataKey="y"
                dot={false}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-1">
      {DASHBOARD_ROWS.map((row) => {
        const Icon = resolveIcon(row.icon);
        return (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-1.5',
              row.toggle === true && 'bg-primary/5',
            )}
            key={row.key}
          >
            <IconBox size="sm">
              <Icon className="h-4 w-4" />
            </IconBox>
            <span className="flex-1 truncate text-sm">{row.label}</span>
            {row.badge === undefined ? null : (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
                {row.badge}
              </span>
            )}
            {row.toggle === undefined ? null : <Switch defaultChecked={row.toggle} />}
          </div>
        );
      })}
    </div>
  </div>
);
