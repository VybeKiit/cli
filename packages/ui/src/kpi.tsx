import * as React from 'react';

import { Card, CardContent } from './card';
import { IconBox } from './icon-box';
import { cn } from './utils';

export interface KpiProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Short metric label (e.g. `"Open"`). */
  readonly label: string;
  /** Numeric or formatted value. */
  readonly value: React.ReactNode;
  /** Optional leading icon (forces row layout unless `layout` is set). */
  readonly icon?: React.ReactNode;
  /** Extra classes on the value text (e.g. warning color). */
  readonly valueClassName?: string;
  /** Optional secondary line under the value (e.g. `"vs last month"`). */
  readonly hint?: string;
  /**
   * `stack` — centered big number (dashboard strip).
   * `row` — icon + label/value (compact cards).
   * Defaults to `row` when `icon` is set and `hint` is absent, otherwise `stack`.
   */
  readonly layout?: 'stack' | 'row';
}

/**
 * Small KPI / stat tile — big tabular number + label, optional icon and hint.
 *
 * Prefer this over a local `const Kpi = …` Card wrapper in page recipes and SaaS screens.
 * Dashboard strips of 2+ tiles should map a data array — do not paste sibling `<Kpi />` rows.
 *
 * @param props - Label, value, optional icon/hint/layout, and Card className.
 * @returns A card-styled metric tile.
 * @example
 * <Kpi label="Open" value={12} />
 * <Kpi icon={<Users className="h-4 w-4" />} label="Customers" value="1.2k" />
 * <Kpi icon={<DollarSign className="h-4 w-4" />} label="MRR" value="$12k" hint="vs last month" />
 * @example
 * {[
 *   { key: 'open', label: 'Open', value: 12 },
 *   { key: 'done', label: 'Done', value: 4 },
 * ].map(({ key, ...tile }) => (
 *   <Kpi key={key} {...tile} />
 * ))}
 */
const Kpi = React.forwardRef<HTMLDivElement, KpiProps>(
  ({ className, label, value, icon, valueClassName, hint, layout, ...props }, ref) => {
    const resolvedLayout = layout ?? (icon !== undefined && hint === undefined ? 'row' : 'stack');

    if (resolvedLayout === 'row') {
      return (
        <Card ref={ref} className={className} data-slot="kpi" data-layout="row" {...props}>
          <CardContent className="flex items-center gap-3 p-4">
            {icon === undefined ? null : <IconBox>{icon}</IconBox>}
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className={cn('font-semibold text-lg tabular-nums', valueClassName)}>{value}</p>
              {hint === undefined ? null : <p className="text-muted-foreground text-xs">{hint}</p>}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Stacked with hint (billing-style: icon+label row, then big value, then hint)
    if (hint !== undefined) {
      return (
        <Card ref={ref} className={className} data-slot="kpi" data-layout="stack" {...props}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {icon}
              <span>{label}</span>
            </div>
            <p className={cn('mt-2 font-bold text-2xl tabular-nums', valueClassName)}>{value}</p>
            <p className="text-muted-foreground text-xs">{hint}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card ref={ref} className={className} data-slot="kpi" data-layout="stack" {...props}>
        <CardContent className="p-3 text-center">
          {icon === undefined ? null : (
            <div className="mb-2 flex justify-center">
              <IconBox size="sm">{icon}</IconBox>
            </div>
          )}
          <p className={cn('font-semibold text-2xl tabular-nums', valueClassName)}>{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </CardContent>
      </Card>
    );
  },
);
Kpi.displayName = 'Kpi';

export { Kpi };
