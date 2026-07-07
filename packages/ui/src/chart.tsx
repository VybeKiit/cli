'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { type ChartConfig, ChartContext } from './chartContext';
import { ChartStyle as ChartContainerStyle } from './chartStyle';
import { ChartTooltipContent as ChartTooltipContentRoot } from './chartTooltip';
import { cn } from './utils';

interface ChartContainerProps extends React.ComponentProps<'div'> {
  readonly config: ChartConfig;
  readonly children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}

/**
 * Resolve the DOM id used to scope chart CSS variables.
 *
 * @param id - Optional caller-provided DOM id.
 * @param uniqueId - React-generated unique id.
 * @returns The chart id with the `chart-` prefix.
 * @example
 * resolveChartId('sales', ':r0:') === 'chart-sales';
 */
const resolveChartId = (id: string | undefined, uniqueId: string): string => {
  if (id !== undefined) {
    return `chart-${id}`;
  }
  return `chart-${uniqueId.replaceAll(':', '')}`;
};

/**
 * Render a responsive Recharts container with VybeKiit chart metadata.
 *
 * @param props - Chart config, children, DOM id, classes, and native div props.
 * @returns A responsive chart wrapper with scoped series color variables.
 * @example
 * <ChartContainer config={config}><LineChart data={data} /></ChartContainer>;
 */
const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = resolveChartId(id, uniqueId);

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          className={cn(
            'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke="#ccc"]]:stroke-border [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
            className,
          )}
          data-chart={chartId}
          ref={ref}
          {...props}
        >
          <ChartContainerStyle config={config} id={chartId} />
          <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = 'Chart';

/** Recharts tooltip primitive paired with `ChartTooltipContent`. */
const ChartTooltip = RechartsPrimitive.Tooltip;

/** Style emitter for chart color CSS variables. */
const ChartStyle = ChartContainerStyle;

/** Default tooltip content renderer for `ChartTooltip`. */
const ChartTooltipContent = ChartTooltipContentRoot;

export { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent };
