'use client';

import { Button } from '@vybekiit/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@vybekiit/ui/select';
import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Transition effect names supported by the recipe replay control.
 * Keep in sync with `.vk-demo-transition[data-effect]` rules in `app/globals.css`.
 */
export type DemoTransition =
  | 'fade'
  | 'slide'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'zoom'
  | 'pop'
  | 'blur'
  | 'soft'
  | 'rise'
  | 'bounce'
  | 'flip'
  | 'rotate'
  | 'skew'
  | 'none';

interface DemoTransitionStageProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly defaultTransition?: DemoTransition;
  readonly title?: string;
}

const TRANSITION_LABELS: Record<DemoTransition, string> = {
  fade: 'Fade',
  slide: 'Slide up',
  'slide-down': 'Slide down',
  'slide-left': 'Slide left',
  'slide-right': 'Slide right',
  scale: 'Scale',
  zoom: 'Zoom in',
  pop: 'Pop',
  blur: 'Blur',
  soft: 'Soft',
  rise: 'Rise',
  bounce: 'Bounce',
  flip: 'Flip',
  rotate: 'Rotate in',
  skew: 'Skew',
  none: 'None',
};

/** Full ordered list shown in the motion-pass select. */
const transitionOptions: readonly DemoTransition[] = [
  'fade',
  'soft',
  'slide',
  'slide-down',
  'slide-left',
  'slide-right',
  'rise',
  'scale',
  'zoom',
  'pop',
  'bounce',
  'blur',
  'flip',
  'rotate',
  'skew',
  'none',
];

const DemoTransitionStageContext = createContext(false);

/**
 * Check whether a string is one of the supported demo transition names.
 *
 * @param value - Candidate transition value from the select control.
 * @returns True when the value is a supported transition name.
 * @example
 * const valid = isDemoTransition('fade');
 */
const isDemoTransition = (value: string): value is DemoTransition =>
  transitionOptions.some((option) => option === value);

/**
 * Render a replayable transition wrapper around one recipe preview region.
 *
 * @param props - Transition stage title, default transition, className, and children.
 * @returns A transition-controlled preview area.
 * @example
 * const element = <DemoTransitionStage><Card /></DemoTransitionStage>;
 */
export const DemoTransitionStage = ({
  children,
  className,
  defaultTransition = 'fade',
  title = 'Motion pass',
}: DemoTransitionStageProps) => {
  const nested = useContext(DemoTransitionStageContext);
  const [transition, setTransition] = useState<DemoTransition>(defaultTransition);
  const [playKey, setPlayKey] = useState(0);

  const handleTransitionChange = useCallback((value: string) => {
    if (isDemoTransition(value)) {
      setTransition(value);
      setPlayKey((current) => current + 1);
    }
  }, []);

  const replay = useCallback(() => {
    setPlayKey((current) => current + 1);
  }, []);

  if (nested) {
    return <>{children}</>;
  }

  return (
    <DemoTransitionStageContext.Provider value={true}>
      <section className={cn('min-h-screen bg-background text-foreground', className)}>
        <div className="sticky top-0 z-50 border-b bg-background px-4 py-3 text-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground text-xs">
                Replay the page region without refreshing the iframe.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select onValueChange={handleTransitionChange} value={transition}>
                <SelectTrigger className="h-8 w-[160px] bg-background">
                  <SelectValue aria-label={TRANSITION_LABELS[transition]} />
                </SelectTrigger>
                {/*
                  Solid bg-background + high z-index: the gallery tailwind config used to omit
                  `popover`, so bg-popover was a no-op and page content showed through the menu.
                */}
                <SelectContent className="z-[9999] border bg-background text-foreground shadow-lg">
                  {transitionOptions.map((option) => (
                    <SelectItem
                      className="bg-background focus:bg-accent data-[state=checked]:bg-accent"
                      key={option}
                      value={option}
                    >
                      {TRANSITION_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={replay} size="sm" type="button" variant="outline">
                <RotateCcw className="h-4 w-4" />
                Replay
              </Button>
            </div>
          </div>
        </div>
        <div className="vk-demo-transition" data-effect={transition} key={playKey}>
          {children}
        </div>
      </section>
    </DemoTransitionStageContext.Provider>
  );
};
