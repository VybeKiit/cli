'use client';

import type { ReactNode } from 'react';
import {
  DomainJourneyCard,
  type DomainJourneyCardProps,
  type DomainJourneyKind,
} from './domain-journey-card';
import { cn } from './utils';

export type JourneyRailItem = Omit<DomainJourneyCardProps, 'className'> & {
  readonly id: string;
};

export type JourneyRailProps = {
  readonly journeys: readonly JourneyRailItem[];
  readonly className?: string;
  readonly empty?: ReactNode;
  readonly header?: ReactNode;
};

/**
 * Right-rail (or stacked) list of domain journey cards for the assistant shell.
 *
 * @param props - Journeys to render.
 * @returns Rail layout.
 * @example
 * <JourneyRail journeys={[{ id: '1', domain: 'auth', title: '…', steps: [] }]} />
 */
export const JourneyRail = ({
  journeys,
  className,
  empty = null,
  header = null,
}: JourneyRailProps) => {
  if (journeys.length === 0) {
    return empty === null ? null : (
      <aside data-testid="journey-rail-empty" className={className}>
        {empty}
      </aside>
    );
  }

  return (
    <aside
      data-testid="journey-rail"
      className={cn('flex flex-col gap-3', className)}
      aria-label="Work in progress"
    >
      {header}
      {journeys.map((journey) => (
        <DomainJourneyCard
          key={journey.id}
          domain={journey.domain as DomainJourneyKind}
          title={journey.title}
          {...(journey.description === undefined ? {} : { description: journey.description })}
          {...(journey.skillIntent === undefined ? {} : { skillIntent: journey.skillIntent })}
          {...(journey.provider === undefined ? {} : { provider: journey.provider })}
          {...(journey.resource === undefined ? {} : { resource: journey.resource })}
          steps={journey.steps}
          {...(journey.footer === undefined || journey.footer === null
            ? {}
            : { footer: journey.footer })}
        />
      ))}
    </aside>
  );
};
