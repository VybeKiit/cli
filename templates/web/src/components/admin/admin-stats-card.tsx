interface AdminStatsCardProps {
  /** Label shown above the metric value. */
  readonly title: string;
  /** Metric value shown in the card. */
  readonly value: string;
  /** Optional trend copy shown below the value. */
  readonly change?: string;
  /** Visual trend tone for the change row. */
  readonly trend?: 'up' | 'down' | 'neutral';
  /** Optional decorative metric icon. */
  readonly icon?: string;
}

const TREND_COLOR_CLASS: Record<NonNullable<AdminStatsCardProps['trend']>, string> = {
  down: 'text-red-600',
  neutral: 'text-muted-foreground',
  up: 'text-green-600',
};

/**
 * Render one compact admin metric card.
 *
 * @param props - Metric label, value, optional trend, and optional icon.
 * @returns A dashboard card sized for the admin overview grid.
 * @example
 * <AdminStatsCard title="Revenue" value="$1,240" change="+12%" trend="up" />
 */
export const AdminStatsCard = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
}: AdminStatsCardProps) => {
  const trendColor = TREND_COLOR_CLASS[trend];

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-muted-foreground text-sm">{title}</p>
        {icon ? <span className="text-2xl">{icon}</span> : null}
      </div>
      <p className="mt-2 font-bold text-3xl tracking-tight">{value}</p>
      {change ? (
        <p className={`mt-1 text-sm ${trendColor}`}>
          {trend === 'up' ? '↑ ' : null}
          {trend === 'down' ? '↓ ' : null}
          {change}
        </p>
      ) : null}
    </div>
  );
};
