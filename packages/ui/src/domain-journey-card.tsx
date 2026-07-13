'use client';

import type { ReactNode } from 'react';
import { Badge } from './badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { ProviderMark } from './provider-mark';
import { StepIndicator } from './step-indicator';
import { cn } from './utils';

/** Domain tags the journey card knows how to badge. */
export type DomainJourneyKind = 'auth' | 'database' | 'payments' | 'deploy' | 'crud';

/** Step shape accepted by the card (matches assistant-chat JourneyStep status union). */
export type DomainJourneyStepView = {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly status: 'pending' | 'running' | 'done' | 'error';
};

export type DomainJourneyCardProps = {
  readonly domain: DomainJourneyKind;
  readonly title: string;
  readonly description?: string;
  readonly skillIntent?: string;
  readonly provider?: string;
  /** CRUD resource name (e.g. orders) — drives logo when no payment provider. */
  readonly resource?: string;
  readonly steps: readonly DomainJourneyStepView[];
  readonly className?: string;
  readonly footer?: ReactNode;
};

const DOMAIN_LABEL: Record<DomainJourneyKind, string> = {
  auth: 'Sign-in',
  database: 'Data',
  payments: 'Payments',
  deploy: 'Go live',
  crud: 'CRUD',
};

const DOMAIN_TONE: Record<DomainJourneyKind, string> = {
  auth: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  database: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  payments: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
  deploy: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  crud: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

/**
 * Rich MCP-UI-style card for auth / database / payments / deploy journeys.
 * Shows the dynamic provider brand (Neon, Stripe, LS, Cloudflare, …) that lights up as work completes.
 *
 * @param props - Domain, title, steps, optional provider/skill/resource.
 * @returns Journey card element.
 * @example
 * <DomainJourneyCard domain="database" provider="neon" title="Save data on neon" steps={steps} />
 */
export const DomainJourneyCard = ({
  domain,
  title,
  description,
  skillIntent,
  provider,
  resource,
  steps,
  className,
  footer = null,
}: DomainJourneyCardProps) => {
  const done = steps.filter((s) => s.status === 'done').length;
  const total = steps.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const isComplete = total > 0 && done === total;
  const isRunning = steps.some((s) => s.status === 'running');
  const indicatorSteps = steps.map((s) => ({
    id: s.id,
    label: s.label,
    status: s.status === 'pending' ? ('pending' as const) : s.status,
  }));

  return (
    <Card
      data-testid={`domain-journey-${domain}`}
      data-domain={domain}
      data-progress={progress}
      data-provider={provider ?? resource ?? ''}
      className={cn('overflow-hidden border-border/80 bg-card/80 shadow-sm', className)}
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn('border', DOMAIN_TONE[domain])}>
              {DOMAIN_LABEL[domain]}
            </Badge>
            {provider ? (
              <Badge variant="secondary" data-testid="domain-journey-provider">
                {provider}
              </Badge>
            ) : null}
            {resource && domain === 'crud' ? (
              <Badge variant="secondary" data-testid="domain-journey-resource">
                {resource}
              </Badge>
            ) : null}
            {skillIntent ? (
              <span className="text-xs text-muted-foreground">Skill: {skillIntent}</span>
            ) : null}
          </div>
          <ProviderMark
            {...(provider === undefined ? {} : { provider })}
            domain={domain}
            {...(resource === undefined ? {} : { resource })}
            active={isComplete}
            running={isRunning || (done > 0 && !isComplete)}
            size={32}
            showLabel={isComplete || isRunning || done > 0}
            className="shrink-0"
          />
        </div>
        <div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} of {total} steps
            </span>
            <span data-testid={`domain-journey-${domain}-progress`}>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <StepIndicator steps={indicatorSteps} orientation="vertical" size="sm" />
        {steps.some((s) => s.description) ? (
          <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
            {steps.map((s) => (
              <li
                key={s.id}
                data-testid={`domain-journey-step-${s.id}`}
                data-status={s.status}
                className="text-xs leading-relaxed"
              >
                <span className="font-semibold text-foreground">{s.label}</span>
                {s.description ? (
                  <span className="text-muted-foreground"> · {s.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {footer}
      </CardContent>
    </Card>
  );
};
