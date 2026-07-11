import type { ReactNode } from 'react';

/** Contact field row with an icon. */
export const InfoRow = ({
  icon,
  label,
  children,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-lg border p-3">
    <span className="mt-0.5 text-muted-foreground">{icon}</span>
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{children}</p>
    </div>
  </div>
);
