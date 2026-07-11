import type { ReactNode } from 'react';

/** Compact header KPI chip. */
export const PipelineStat = ({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) => (
  <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
    <span className="text-muted-foreground">{icon}</span>
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold text-sm tabular-nums">{value}</p>
    </div>
  </div>
);
