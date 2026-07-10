'use client';

import { Sparkline } from '@/components/landing/kit/Sparkline';
import { LoopingPaymentToast } from '@/components/sections/LoopingPaymentToast';
import { ProblemRowIcon, type ProblemRowId } from '@/components/sections/ProblemRowIcons';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PROBLEM_OVERVIEW, SOLUTION_PAYMENTS } from '@/data/visitorLanding';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

const RECENT_TX = [
  { id: 'tx1', name: 'Ava Chen', plan: 'Pro plan', amount: '$49.00', time: '2m' },
  { id: 'tx2', name: 'Noah Patel', plan: 'Lifetime', amount: '$19.00', time: '14m' },
  { id: 'tx3', name: 'Mia Ortiz', plan: 'Pro plan', amount: '$49.00', time: '41m' },
] as const;

/**
 * Problem + overview table, then a realistic payments dashboard mock + solution copy.
 *
 * @returns The rendered problem/solution blocks.
 * @example
 * <ProblemSolution />
 */
export const ProblemSolution = () => {
  const { messages } = useLandingLocale();
  const problem = messages.problem;
  const solution = messages.solution;

  return (
    <section id="how-it-works" className="mx-auto max-w-5xl space-y-16 px-6 py-8">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
            {problem.problemLabel}
          </p>
          <h2 className="mt-3 font-bold text-3xl tracking-tight">{problem.problemHeading}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{problem.problemBody}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
          <div className="flex items-center justify-between border-border/70 border-b bg-muted/30 px-5 py-3">
            <p className="font-semibold text-sm">{problem.overviewTitle}</p>
            <span className="rounded-full bg-amber-500/12 px-2 py-0.5 font-medium text-[10px] text-amber-700 tracking-wide dark:text-amber-400">
              {problem.withoutBadge}
            </span>
          </div>
          <ul className="divide-y divide-border/70">
            {PROBLEM_OVERVIEW.rows.map((row, index) => {
              const copy = problem.rows[index];
              const label = copy?.label ?? row.label;
              const value = copy?.value ?? row.value;
              return (
                <li key={row.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <span className="inline-flex items-center gap-2.5 font-medium text-foreground text-sm">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-lg',
                        row.tone === 'danger'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <ProblemRowIcon id={row.id as ProblemRowId} />
                    </span>
                    {label}
                  </span>
                  <span
                    className={cn(
                      'font-medium text-sm',
                      row.tone === 'danger' ? 'text-red-500' : 'text-muted-foreground',
                    )}
                  >
                    {value}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Realistic revenue dashboard mock */}
        <div className="order-2 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:order-1">
          <div className="relative border-border/70 border-b bg-gradient-to-b from-muted/40 to-card px-4 pt-4 pb-3">
            <div className="mb-3 flex items-center justify-between gap-2 pe-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <svg aria-hidden={true} className="size-4" fill="none" viewBox="0 0 16 16">
                    <path
                      d="M2 4.5h12v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-7z"
                      stroke="currentColor"
                      strokeWidth="1.3"
                    />
                    <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-sm leading-none">Payments</p>
                  <p className="mt-1 text-[11px] text-muted-foreground leading-none">
                    Live · last 7 days
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 font-medium text-[11px] text-emerald-700 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            </div>
            <LoopingPaymentToast />
          </div>

          <div className="grid gap-0 sm:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3 border-border/70 p-4 sm:border-e">
              <div>
                <p className="text-muted-foreground text-xs">{solution.revenueLabel}</p>
                <p className="mt-0.5 font-bold text-3xl tracking-tight tabular-nums">
                  <AnimatedNumber value={SOLUTION_PAYMENTS.revenueValue} />
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 text-xs dark:text-emerald-400">
                  <svg aria-hidden={true} className="size-3" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M2 8l3-3 2 2 3-4"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span>{solution.revenueDelta}</span>
                </p>
              </div>
              <Sparkline className="h-24 w-full" id="visitor-revenue-spark" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
                <span>Sun</span>
              </div>
            </div>

            <div className="p-4">
              <p className="mb-3 font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                Recent
              </p>
              <ul className="space-y-3">
                {RECENT_TX.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-[11px] text-muted-foreground">
                      {tx.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm leading-tight">{tx.name}</p>
                      <p className="truncate text-[11px] text-muted-foreground leading-tight">
                        {tx.plan} · {tx.time}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-sm tabular-nums">{tx.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
            {solution.solutionLabel}
          </p>
          <h2 className="mt-3 font-bold text-3xl tracking-tight">{solution.solutionHeading}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{solution.solutionBody}</p>
        </div>
      </div>
    </section>
  );
};
