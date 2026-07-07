'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

const THEMES = { light: '', dark: '.dark' } as const;

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

interface ChartContextProps {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null);

const useChart = () => {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
};

const ChartContainer = ({
  id,
  className,
  children,
  config,
  ref,
  ...props
}: (React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
}) & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const uniqueId = React.useId();
  const chartSourceId = id === undefined ? uniqueId.replace(/:/g, '') : id;
  const chartId = `chart-${chartSourceId}`;

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
        <ChartStyle config={config} id={chartId} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
};
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme || itemConfig.color,
  );

  if (colorConfig.length === 0) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const themeColor =
      itemConfig.theme === undefined
        ? undefined
        : itemConfig.theme[theme as keyof typeof itemConfig.theme];
    const color = themeColor === undefined ? itemConfig.color : themeColor;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`,
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * Resolve the best available chart payload key.
 *
 * @param item - Tooltip payload item.
 * @returns Data key, name, or a generic value key.
 * @example
 * const key = dataKeyOrName(item);
 */
const dataKeyOrName = (item: { dataKey?: string | number; name?: string }): string | number => {
  if (item.dataKey !== undefined) {
    return item.dataKey;
  }

  return item.name === undefined ? 'value' : item.name;
};

const ChartTooltipContent = ({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
  ref,
}: (React.ComponentProps<'div'> & {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    name?: string;
    dataKey?: string | number;
    color?: string;
    payload?: { fill?: string };
  }>;
  label?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: 'line' | 'dot' | 'dashed';
  nameKey?: string;
  labelKey?: string;
  labelFormatter?: (value: unknown, payload: unknown) => React.ReactNode;
  formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown,
  ) => React.ReactNode;
  labelClassName?: string;
  color?: string;
}) & { ref?: React.RefObject<HTMLDivElement | null> }) => {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    const hasPayload = payload !== undefined && payload.length > 0;
    if (hideLabel || !hasPayload) {
      return null;
    }

    const [item] = payload;
    if (item === undefined) {
      return null;
    }
    const labelSource = labelKey === undefined ? dataKeyOrName(item) : labelKey;
    const key = `${labelSource}`;
    const itemConfig = config[key as keyof typeof config];
    const labelConfig =
      typeof label === 'string' ? config[label as keyof typeof config] : undefined;
    let value = itemConfig?.label;
    if (!labelKey && typeof label === 'string') {
      value = labelConfig?.label === undefined ? label : labelConfig.label;
    }

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!(active && payload !== undefined && payload.length > 0)) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
        className,
      )}
      ref={ref}
    >
      {hideLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const itemKey = dataKeyOrName(item);
          const key = `${nameKey === undefined ? itemKey : nameKey}`;
          const itemConfig = config[key as keyof typeof config];
          const payloadFill = item.payload === undefined ? undefined : item.payload.fill;
          let indicatorColor = color;
          if (indicatorColor === undefined) {
            indicatorColor = payloadFill === undefined ? item.color : payloadFill;
          }
          const dataKey = item.dataKey === undefined ? index : item.dataKey;
          const itemLabel = itemConfig?.label === undefined ? item.name : itemConfig.label;

          return (
            <div
              className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
              key={dataKey}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {hideIndicator ? null : (
                    <div
                      className={cn(
                        'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                        {
                          'h-2.5 w-2.5': indicator === 'dot',
                          'w-1': indicator === 'line',
                          'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                        },
                      )}
                      style={
                        {
                          '--color-bg': indicatorColor,
                          '--color-border': indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )}
                  <div className="flex flex-1 justify-between leading-none">
                    <span className="text-muted-foreground">{itemLabel}</span>
                    {item.value ? (
                      <span className="font-medium font-mono text-foreground tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
ChartTooltipContent.displayName = 'ChartTooltipContent';

export { ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent };
