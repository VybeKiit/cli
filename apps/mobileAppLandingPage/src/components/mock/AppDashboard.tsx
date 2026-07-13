'use client';

import { IconBox } from '@vybekiit/ui/icon-box';
import { Kpi } from '@vybekiit/ui/kpi';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

import { StarRating } from '@/components/ui/StarRating';
import {
  APP_NAME,
  DASHBOARD_CATEGORIES,
  DASHBOARD_KPIS,
  DASHBOARD_TREND,
} from '@/data/landingContent';

/**
 * Rebuilt in-phone app screen used as the children of the hero `IPhoneMockup`.
 *
 * Approximates the reference mock: a greeting header, an "Explore" category list
 * (data-driven `IconBox` rows), and an "Insights" card with a small trend line
 * plus two `Kpi` tiles. Kept lightweight but recognizably the design.
 *
 * @returns The rendered app dashboard screen.
 * @example
 * <IPhoneMockup>{(<AppDashboard />)}</IPhoneMockup>
 */
export const AppDashboard = () => (
  <div className="flex h-full w-full flex-col overflow-hidden bg-background px-4 pt-3 pb-4 text-foreground">
    <header className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">Good morning</p>
        <p className="text-sm font-semibold">{APP_NAME}</p>
      </div>
      <IconBox shape="circle" size="sm" className="bg-primary/10 text-primary">
        <span className="text-xs font-semibold">JL</span>
      </IconBox>
    </header>

    <section className="mb-4 rounded-2xl bg-primary p-4 text-primary-foreground">
      <p className="text-xs opacity-80">Today&apos;s focus</p>
      <p className="mt-1 text-lg font-semibold leading-tight">Build a better routine</p>
      <StarRating className="mt-2" filled={4} />
    </section>

    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Explore
    </p>
    <ul className="mb-4 space-y-2">
      {DASHBOARD_CATEGORIES.map(({ key, label, icon: Icon }) => (
        <li
          key={key}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
        >
          <IconBox size="sm" className="bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </IconBox>
          <span className="text-sm font-medium">{label}</span>
        </li>
      ))}
    </ul>

    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Insights
        </p>
        <span className="text-xs font-medium text-primary">This week</span>
      </div>
      <div className="h-16 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={[...DASHBOARD_TREND]}>
            <Line
              dataKey="value"
              dot={false}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {DASHBOARD_KPIS.map(({ key, ...tile }) => (
          <Kpi key={key} className="shadow-none" {...tile} />
        ))}
      </div>
    </div>
  </div>
);
