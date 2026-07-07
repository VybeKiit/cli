'use client';

import { Button } from '@vybekiit/ui/button';
import { useState } from 'react';
import {
  useWalkthrough,
  Walkthrough,
  type WalkthroughStep,
  type WalkthroughVariant,
} from '@/components/walkthrough';

const DEMO_STEPS: readonly WalkthroughStep[] = [
  {
    id: 'search',
    title: 'Start with search',
    body: 'Every walkthrough step can spotlight a real element on the page — here it points at the search box.',
    target: '[data-walkthrough-demo="search"]',
  },
  {
    id: 'filters',
    title: 'Then the filters',
    body: 'The spotlight tracks each target through scroll and resize, so it always frames the right control.',
    target: '[data-walkthrough-demo="filters"]',
  },
  {
    id: 'done',
    title: 'That is the whole flow',
    body: 'One shared engine drives this — swap the variant toggle above to see the same steps as a centered dialog.',
  },
];

const BOXES = [
  { key: 'search', label: 'Search box' },
  { key: 'filters', label: 'Filters' },
  { key: 'results', label: 'Results grid' },
] as const;

/**
 * Renders the shared walkthrough component preview.
 *
 * @returns The interactive walkthrough demo.
 * @example
 * <WalkthroughDemo />
 */
const WalkthroughDemo = () => {
  const [variant, setVariant] = useState<WalkthroughVariant>('spotlight');
  const state = useWalkthrough({
    storageKey: 'vybekiit-walkthrough-demo',
    totalSteps: DEMO_STEPS.length,
  });

  return (
    <div className="relative flex min-h-[360px] flex-col gap-4 bg-muted/20 p-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {(['spotlight', 'dialog'] as const).map((option) => (
            <button
              className={
                variant === option
                  ? 'rounded bg-primary px-3 py-1 text-primary-foreground text-xs'
                  : 'rounded px-3 py-1 text-muted-foreground text-xs'
              }
              key={option}
              onClick={() => setVariant(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <Button onClick={state.replay} size="sm" type="button" variant="outline">
          Replay walkthrough
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {BOXES.map((box) => (
          <div
            className="flex h-24 items-center justify-center rounded-lg border border-border border-dashed bg-background text-muted-foreground text-sm"
            data-walkthrough-demo={box.key}
            key={box.key}
          >
            {box.label}
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">
        Not shipped to end users — this is dev/builder guidance only.
      </p>

      <Walkthrough state={state} steps={DEMO_STEPS} variant={variant} />
    </div>
  );
};

export default WalkthroughDemo;
