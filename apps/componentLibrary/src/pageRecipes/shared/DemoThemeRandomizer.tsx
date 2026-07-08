'use client';

import { foregroundTripletFor, hexToHslTriplet } from '@library/lib/theme';
import { Button } from '@vybekiit/ui/button';
import { Shuffle } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface DemoPalette {
  readonly id: string;
  readonly label: string;
  readonly primary: string;
  readonly accent: string;
  readonly muted: string;
}

interface DemoThemeRandomizerProps {
  readonly children: ReactNode;
}

const palettes: readonly DemoPalette[] = [
  {
    id: 'neutral',
    label: 'Neutral',
    primary: '#171717',
    accent: '#f4f4f5',
    muted: '#f4f4f5',
  },
  {
    id: 'violet',
    label: 'Violet',
    primary: '#7c3aed',
    accent: '#ede9fe',
    muted: '#f5f3ff',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    primary: '#059669',
    accent: '#d1fae5',
    muted: '#ecfdf5',
  },
  {
    id: 'rose',
    label: 'Rose',
    primary: '#e11d48',
    accent: '#ffe4e6',
    muted: '#fff1f2',
  },
  {
    id: 'amber',
    label: 'Amber',
    primary: '#d97706',
    accent: '#fef3c7',
    muted: '#fffbeb',
  },
  {
    id: 'sky',
    label: 'Sky',
    primary: '#0284c7',
    accent: '#e0f2fe',
    muted: '#f0f9ff',
  },
];

const DemoThemeRandomizerContext = createContext(false);

/**
 * Resolve the next palette index in the demo palette cycle.
 *
 * @param current - Current palette index.
 * @returns The next palette index, wrapping at the end of the palette list.
 * @example
 * const next = nextPaletteIndex(0);
 */
const nextPaletteIndex = (current: number): number => (current + 1) % palettes.length;

/**
 * Resolve a demo palette by index.
 *
 * @param index - Palette index from component state.
 * @returns The palette at the requested index.
 * @example
 * const palette = paletteAt(0);
 */
const paletteAt = (index: number): DemoPalette => {
  const palette = palettes[index];
  if (palette === undefined) {
    throw new Error(`Unknown demo palette index: ${index}`);
  }
  return palette;
};

/**
 * Convert a demo palette into shadcn semantic color variables.
 *
 * @param palette - Palette colors in hex form.
 * @returns CSS custom properties that override semantic theme variables.
 * @example
 * const style = paletteStyle(paletteAt(0));
 */
const paletteStyle = (palette: DemoPalette): CSSProperties =>
  ({
    '--accent': hexToHslTriplet(palette.accent),
    '--muted': hexToHslTriplet(palette.muted),
    '--primary': hexToHslTriplet(palette.primary),
    '--primary-foreground': foregroundTripletFor(palette.primary),
    '--ring': hexToHslTriplet(palette.primary),
  }) as CSSProperties;

/**
 * Render preview children inside a randomizable semantic color palette.
 *
 * @param props - Children that inherit the generated semantic color variables.
 * @returns A color-randomized preview wrapper.
 * @example
 * const element = <DemoThemeRandomizer><Dashboard /></DemoThemeRandomizer>;
 */
export const DemoThemeRandomizer = ({ children }: DemoThemeRandomizerProps) => {
  const nested = useContext(DemoThemeRandomizerContext);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const palette = paletteAt(paletteIndex);
  const style = useMemo(() => paletteStyle(palette), [palette]);

  const randomizePalette = useCallback(() => {
    setPaletteIndex(nextPaletteIndex);
  }, []);

  if (nested) {
    return <>{children}</>;
  }

  return (
    <DemoThemeRandomizerContext.Provider value={true}>
      <div className="min-h-screen bg-background text-foreground" style={style}>
        <div className="border-b bg-background/95 px-4 py-2 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-xs">
              Palette stress test:{' '}
              <span className="font-medium text-foreground">{palette.label}</span>
            </p>
            <Button onClick={randomizePalette} size="sm" type="button" variant="outline">
              <Shuffle className="h-4 w-4" />
              Randomize colors
            </Button>
          </div>
        </div>
        {children}
      </div>
    </DemoThemeRandomizerContext.Provider>
  );
};
