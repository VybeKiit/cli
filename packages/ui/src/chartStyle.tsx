'use client';

import { type ChartConfig, type ChartConfigItem, type ChartTheme, THEMES } from './chartContext';

const chartThemes = ['light', 'dark'] as const satisfies readonly ChartTheme[];

/** Props for the chart CSS variable style emitter. */
export interface ChartStyleProps {
  readonly id: string;
  readonly config: ChartConfig;
}

/**
 * Resolve a configured color for one chart theme.
 *
 * @param itemConfig - Chart series config.
 * @param theme - Theme currently emitted into CSS.
 * @returns The theme-specific color, or the plain color when no theme map exists.
 * @example
 * resolveThemeColor({ color: 'red' }, 'light') === 'red';
 */
const resolveThemeColor = (itemConfig: ChartConfigItem, theme: ChartTheme): string | undefined => {
  if (itemConfig.theme !== undefined) {
    return itemConfig.theme[theme];
  }
  return itemConfig.color;
};

/**
 * Render CSS variables for one chart theme selector.
 *
 * @param id - Scoped chart DOM id.
 * @param theme - Theme currently rendered.
 * @param colorConfig - Chart config entries with color data.
 * @returns CSS text for the theme block.
 * @example
 * renderThemeCss('chart-sales', 'light', [['sales', { color: 'red' }]]);
 */
const renderThemeCss = (
  id: string,
  theme: ChartTheme,
  colorConfig: ReadonlyArray<readonly [string, ChartConfigItem]>,
): string => `
${THEMES[theme]} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = resolveThemeColor(itemConfig, theme);
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`;

/**
 * Emit scoped CSS variables for chart series colors.
 *
 * @param props - Scoped chart id and series config map.
 * @returns A style tag, or `null` when no colors are configured.
 * @example
 * <ChartStyle id="chart-sales" config={config} />;
 */
export const ChartStyle = ({ id, config }: ChartStyleProps) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme || itemConfig.color,
  );

  if (colorConfig.length === 0) {
    return null;
  }

  return (
    <style
      // biome-ignore lint/security/noDangerouslySetInnerHtml: CSS is generated from typed chart color config.
      dangerouslySetInnerHTML={{
        __html: chartThemes.map((theme) => renderThemeCss(id, theme, colorConfig)).join('\n'),
      }}
    />
  );
};
