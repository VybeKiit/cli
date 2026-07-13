'use client';

import type { Journey } from '@vybekiit/assistant-chat';
import { JourneyRail } from '@vybekiit/ui';
import { useJourneyStore } from '@/stores';

const toRailItem = (journey: Journey) => {
  const provider = journey.params.provider;
  const resource = journey.params.resource;
  return {
    id: journey.id,
    domain: journey.domain,
    title: journey.title,
    description: 'Your coding helper is working these steps. Status updates as tools run.',
    skillIntent: journey.skillIntent,
    ...(provider === undefined ? {} : { provider }),
    ...(resource === undefined ? {} : { resource }),
    steps: journey.steps.map((s) => ({
      id: s.id,
      label: s.label,
      description: s.description,
      status: s.status,
    })),
  };
};

/**
 * Domain journey rail for auth / database / payments / deploy cards.
 *
 * @returns Journey rail or null when empty.
 * @example
 * <DomainJourneyPanel />
 */
export const DomainJourneyPanel = () => {
  const journeys = useJourneyStore((s) => s.journeys);
  const isSimulating = useJourneyStore((s) => s.isSimulating);

  if (journeys.length === 0) {
    return null;
  }

  return (
    <JourneyRail
      className="w-full"
      header={
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live work
          </p>
          {isSimulating ? (
            <span
              data-testid="journey-simulating"
              className="text-xs text-violet-600 dark:text-violet-300"
            >
              Updating…
            </span>
          ) : null}
        </div>
      }
      journeys={journeys.map(toRailItem)}
    />
  );
};
