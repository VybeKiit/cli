'use client';

import * as React from 'react';
import {
  type ChartConfig,
  type ChartConfigItem,
  type ChartTooltipPayload,
  useChart,
} from './chartContext';
import { cn } from './utils';

/** Props accepted by the shared Recharts tooltip renderer. */
export interface ChartTooltipContentProps extends React.ComponentProps<'div'> {
  readonly active?: boolean;
  readonly payload?: ChartTooltipPayload;
  readonly label?: string;
  readonly hideLabel?: boolean;
  readonly hideIndicator?: boolean;
  readonly indicator?: 'line' | 'dot' | 'dashed';
  readonly nameKey?: string;
  readonly labelKey?: string;
  readonly labelFormatter?: (value: unknown, payload: unknown) => React.ReactNode;
  readonly formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown,
  ) => React.ReactNode;
  readonly labelClassName?: string;
  readonly color?: string;
}

interface ChartTooltipRowsProps {
  readonly payload: ChartTooltipPayload;
  readonly config: ChartConfig;
  readonly indicator: 'line' | 'dot' | 'dashed';
  readonly hideIndicator: boolean;
  readonly nameKey: string | undefined;
  readonly color: string | undefined;
  readonly formatter: ChartTooltipContentProps['formatter'] | undefined;
}

interface ChartTooltipRowProps {
  readonly item: ChartTooltipPayload[number];
  readonly index: number;
  readonly config: ChartConfig;
  readonly indicator: 'line' | 'dot' | 'dashed';
  readonly hideIndicator: boolean;
  readonly nameKey: string | undefined;
  readonly color: string | undefined;
  readonly formatter: ChartTooltipContentProps['formatter'] | undefined;
}

/**
 * Check whether a tooltip payload has entries.
 *
 * @param payload - Optional Recharts payload.
 * @returns Whether the payload can render tooltip rows.
 * @example
 * hasPayload([{ value: 1 }]) === true;
 */
const hasPayload = (payload: ChartTooltipPayload | undefined): payload is ChartTooltipPayload =>
  payload !== undefined && payload.length > 0;

/**
 * Check whether a React node should be rendered inside the tooltip.
 *
 * @param value - Value returned by config or formatter logic.
 * @returns True when the node is not an intentionally empty value.
 * @example
 * isRenderableTooltipNode('Revenue') === true;
 */
const isRenderableTooltipNode = (value: unknown): boolean =>
  value !== null && value !== undefined && value !== false && value !== '';

/**
 * Resolve the config key for a tooltip label.
 *
 * @param labelKey - Explicit label key override.
 * @param item - First tooltip payload item.
 * @returns A string key for chart config lookup.
 * @example
 * resolveTooltipLabelKey(undefined, { name: 'revenue' }) === 'revenue';
 */
const resolveTooltipLabelKey = (
  labelKey: string | undefined,
  item: ChartTooltipPayload[number] | undefined,
): string => {
  if (labelKey !== undefined) {
    return labelKey;
  }
  if (item?.dataKey !== undefined) {
    return String(item.dataKey);
  }
  if (item?.name !== undefined) {
    return item.name;
  }
  return 'value';
};

/**
 * Resolve the visible tooltip label.
 *
 * @param labelKey - Explicit label key override.
 * @param label - Recharts label value.
 * @param config - Chart config map.
 * @param itemConfig - Config entry resolved from the payload item.
 * @returns The visible label, when one can be resolved.
 * @example
 * resolveTooltipLabel(undefined, 'revenue', config, undefined);
 */
const resolveTooltipLabel = (
  labelKey: string | undefined,
  label: string | undefined,
  config: ChartConfig,
  itemConfig: ChartConfigItem | undefined,
): React.ReactNode => {
  if (labelKey === undefined && typeof label === 'string') {
    const configuredLabel = config[label]?.label;
    if (configuredLabel !== undefined) {
      return configuredLabel;
    }
    return label;
  }
  return itemConfig?.label;
};

/**
 * Resolve the config key for one tooltip row.
 *
 * @param nameKey - Explicit row key override.
 * @param item - Tooltip payload item.
 * @returns A string key for chart config lookup.
 * @example
 * resolveTooltipItemKey(undefined, { dataKey: 'sales' }) === 'sales';
 */
const resolveTooltipItemKey = (
  nameKey: string | undefined,
  item: ChartTooltipPayload[number],
): string => {
  if (nameKey !== undefined) {
    return nameKey;
  }
  if (item.name !== undefined) {
    return item.name;
  }
  if (item.dataKey !== undefined) {
    return String(item.dataKey);
  }
  return 'value';
};

/**
 * Resolve a React key for one tooltip row.
 *
 * @param nameKey - Explicit row key override.
 * @param item - Tooltip payload item.
 * @returns Stable key derived from chart payload identity.
 * @example
 * resolveTooltipRowKey(undefined, { dataKey: 'sales', value: 42 });
 */
const resolveTooltipRowKey = (
  nameKey: string | undefined,
  item: ChartTooltipPayload[number],
): string => {
  const configKey = resolveTooltipItemKey(nameKey, item);
  const valueKey = item.value === undefined ? 'empty' : String(item.value);
  return `${configKey}:${valueKey}`;
};

/**
 * Resolve the indicator color for one tooltip row.
 *
 * @param color - Explicit tooltip color override.
 * @param item - Tooltip payload item.
 * @returns The first configured color source.
 * @example
 * resolveIndicatorColor('red', item) === 'red';
 */
const resolveIndicatorColor = (
  color: string | undefined,
  item: ChartTooltipPayload[number],
): string | undefined => {
  if (color !== undefined) {
    return color;
  }
  if (item.payload?.fill !== undefined) {
    return item.payload.fill;
  }
  return item.color;
};

/**
 * Resolve the row label for one tooltip item.
 *
 * @param itemConfig - Optional chart config entry.
 * @param item - Tooltip payload item.
 * @returns The configured label, item name, or an empty label.
 * @example
 * resolveTooltipItemLabel(undefined, { name: 'Sales' }) === 'Sales';
 */
const resolveTooltipItemLabel = (
  itemConfig: ChartConfigItem | undefined,
  item: ChartTooltipPayload[number],
): React.ReactNode => {
  if (itemConfig?.label !== undefined) {
    return itemConfig.label;
  }
  if (item.name !== undefined) {
    return item.name;
  }
  return '';
};

/**
 * Render one tooltip payload row.
 *
 * @param props - Payload row, chart config, indicator settings, and formatter.
 * @returns A tooltip row for one chart series.
 * @example
 * <ChartTooltipRow item={item} index={0} payload={[item]} config={config} indicator="dot" hideIndicator={false} />;
 */
const ChartTooltipRow = ({
  item,
  index,
  config,
  indicator,
  hideIndicator,
  nameKey,
  color,
  formatter,
}: ChartTooltipRowProps) => {
  const key = resolveTooltipItemKey(nameKey, item);
  const itemConfig = config[key];
  const indicatorColor = resolveIndicatorColor(color, item);

  return (
    <div className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground">
      {formatter && item.value !== undefined && item.name !== undefined ? (
        formatter(item.value, item.name, item, index, item.payload)
      ) : (
        <>
          {hideIndicator ? null : (
            <div
              className={cn('shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]', {
                'h-2.5 w-2.5': indicator === 'dot',
                'w-1': indicator === 'line',
                'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
              })}
              style={
                {
                  '--color-bg': indicatorColor,
                  '--color-border': indicatorColor,
                } as React.CSSProperties
              }
            />
          )}
          <div className="flex flex-1 justify-between leading-none">
            <span className="text-muted-foreground">
              {resolveTooltipItemLabel(itemConfig, item)}
            </span>
            {item.value !== undefined && item.value !== '' ? (
              <span className="font-medium font-mono text-foreground tabular-nums">
                {item.value.toLocaleString()}
              </span>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Render all tooltip payload rows.
 *
 * @param props - Tooltip payload and formatting options.
 * @returns Row list for the tooltip body.
 * @example
 * <ChartTooltipRows payload={payload} config={config} indicator="dot" hideIndicator={false} />;
 */
const ChartTooltipRows = ({
  payload,
  config,
  indicator,
  hideIndicator,
  nameKey,
  color,
  formatter,
}: ChartTooltipRowsProps) => (
  <div className="grid gap-1.5">
    {payload.map((item, index) => (
      <ChartTooltipRow
        key={resolveTooltipRowKey(nameKey, item)}
        item={item}
        index={index}
        config={config}
        indicator={indicator}
        hideIndicator={hideIndicator}
        nameKey={nameKey}
        color={color}
        formatter={formatter}
      />
    ))}
  </div>
);

/**
 * Render the shared Recharts tooltip content.
 *
 * @param props - Recharts tooltip state plus VybeKiit label, indicator, and formatter options.
 * @returns Tooltip content when active payload exists, otherwise `null`.
 * @example
 * <ChartTooltipContent indicator="line" />;
 */
export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
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
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !hasPayload(payload)) {
        return null;
      }

      const [item] = payload;
      const key = resolveTooltipLabelKey(labelKey, item);
      const itemConfig = config[key];
      const value = resolveTooltipLabel(labelKey, label, config, itemConfig);

      if (labelFormatter) {
        return (
          <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
        );
      }

      if (!isRenderableTooltipNode(value)) {
        return null;
      }

      return <div className={cn('font-medium', labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!(active && hasPayload(payload))) {
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
        {tooltipLabel}
        <ChartTooltipRows
          payload={payload}
          config={config}
          indicator={indicator}
          hideIndicator={hideIndicator}
          nameKey={nameKey}
          color={color}
          formatter={formatter}
        />
      </div>
    );
  },
);
ChartTooltipContent.displayName = 'ChartTooltipContent';
