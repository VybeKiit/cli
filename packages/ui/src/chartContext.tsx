'use client';

import * as React from 'react';

/** Theme selectors used when emitting chart CSS variables. */
export const THEMES = { light: '', dark: '.dark' } as const;

/** Theme key supported by chart color configuration. */
export type ChartTheme = keyof typeof THEMES;

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
>;

/** One series entry from a chart config map. */
export type ChartConfigItem = ChartConfig[string];

/** Recharts tooltip payload fields consumed by the shared tooltip renderer. */
export type ChartTooltipPayload = Array<{
  value?: number | string;
  name?: string;
  dataKey?: string | number;
  color?: string;
  payload?: { fill?: string };
}>;

type ChartContextProps = {
  readonly config: ChartConfig;
};

/** React context that carries chart series metadata to tooltip/style helpers. */
export const ChartContext = React.createContext<ChartContextProps | null>(null);

/**
 * Read the chart context created by `ChartContainer`.
 *
 * @returns The chart configuration for tooltip and style helpers.
 * @throws When called outside of a chart container.
 * @example
 * const { config } = useChart();
 */
export const useChart = (): ChartContextProps => {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
};
