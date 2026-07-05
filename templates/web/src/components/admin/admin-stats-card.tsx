interface AdminStatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export function AdminStatsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
}: AdminStatsCardProps) {
  const trendColor =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${trendColor}`}>
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {change}
        </p>
      )}
    </div>
  );
}
