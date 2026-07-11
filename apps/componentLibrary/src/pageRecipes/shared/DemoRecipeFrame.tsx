'use client';

import type { ReactNode } from 'react';
import { DemoThemeRandomizer } from './DemoThemeRandomizer';
import { type DemoTransition, DemoTransitionStage } from './DemoTransitionStage';

interface DemoRecipeFrameProps {
  readonly children: ReactNode;
  /** Motion-pass control title (e.g. `"Orders motion pass"`). */
  readonly title: string;
  readonly defaultTransition?: DemoTransition;
}

/**
 * Gallery chrome for every page recipe: theme randomizer + motion replay stage.
 *
 * Prefer this over a local `Frame` wrapper so chrome stays one place.
 *
 * @param props - Motion title, optional transition, and page body.
 * @returns Theme + motion shell around the recipe body.
 * @example
 * <DemoRecipeFrame title="Orders motion pass"><OrdersBody /></DemoRecipeFrame>
 */
export const DemoRecipeFrame = ({
  children,
  title,
  defaultTransition = 'fade',
}: DemoRecipeFrameProps) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition={defaultTransition} title={title}>
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);
