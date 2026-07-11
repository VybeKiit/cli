'use client';

import { useEffect, useRef } from 'react';
import { useWalkthrough, Walkthrough, type WalkthroughStep } from '@/components/walkthrough';

const STORAGE_KEY = 'vybekiit-ui-library-tutorial-v1';

/** DOM targets used by the library walkthrough tutorial. */
const TUTORIAL_TARGETS = {
  search: '[data-tour="search"]',
  library: '[data-tour="library-filter"]',
  categories: '[data-tour="category-sidebar"]',
  card: '[data-tour="component-card"]',
  theme: '[data-tour="theme-controls"]',
  selectionTray: '[data-tour="selection-tray"]',
} as const;

const STEPS: readonly WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the VybeKiit UI Library',
    body: 'Browse 1,900+ mirrored blocks from Magic UI, Kibo, AI Elements, 21st.dev, and more. Every component already lives in your starter template — this gallery helps you discover and ship faster.',
  },
  {
    id: 'categories',
    title: 'Filter by category',
    body: 'Use the sidebar to jump into Forms, Hero sections, AI chat UI, and other groups. On mobile, the category picker sits beside search.',
    target: TUTORIAL_TARGETS.categories,
  },
  {
    id: 'search',
    title: 'Search and narrow by library',
    body: 'Search by name, tag, or library. Use the library dropdown to focus on one source — for example `blocks-21st` for curated 21st.dev blocks.',
    target: TUTORIAL_TARGETS.search,
  },
  {
    id: 'previews',
    title: 'Live previews',
    body: 'Each card lazy-loads a live iframe. Hover a card to interact; open a component to try desktop, tablet, and mobile viewports with device mockups.',
    target: TUTORIAL_TARGETS.card,
  },
  {
    id: 'prompts',
    title: 'Copy prompts for agents',
    body: 'Use Copy prompt on any card or detail page to paste into Cursor, Claude, or Codex. Check several components, then copy one combined prompt from the tray at the bottom.',
    target: TUTORIAL_TARGETS.card,
  },
  {
    id: 'theme',
    title: 'Theme your previews',
    body: 'Toggle light/dark and tweak the primary accent color. Previews inherit your choices so you can match your brand before importing.',
    target: TUTORIAL_TARGETS.theme,
  },
  {
    id: 'ready',
    title: 'You are ready',
    body: 'Pick components, copy prompts, and let your agent wire them into your app. Re-open this tour anytime from the header.',
  },
];

interface LibraryTutorialProps {
  readonly forceOpen?: boolean;
  readonly onForceClose?: () => void;
}

/**
 * Render the library tutorial component.
 *
 * @param props - Optional force-open and close callback for "Take tour".
 * @returns A React element for the component-library UI.
 * @example
 * const element = <LibraryTutorial />;
 */
export const LibraryTutorial = ({ forceOpen = false, onForceClose }: LibraryTutorialProps) => {
  const state = useWalkthrough({ storageKey: STORAGE_KEY, totalSteps: STEPS.length });
  const wasActive = useRef(false);

  // "Take tour" replays; when the replayed tour closes, notify the parent so its toggle resets.
  useEffect(() => {
    if (forceOpen) {
      state.replay();
    }
  }, [forceOpen, state.replay]);

  useEffect(() => {
    if (state.active) {
      wasActive.current = true;
      return;
    }
    if (wasActive.current && forceOpen) {
      wasActive.current = false;
      onForceClose?.();
    }
  }, [state.active, forceOpen, onForceClose]);

  return <Walkthrough state={state} steps={STEPS} variant="dialog" />;
};
