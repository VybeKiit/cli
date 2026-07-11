import { cn } from '@/lib/utils';

export const Row = ({
  label,
  value,
  emphasis,
}: {
  readonly label: string;
  readonly value: string;
  readonly emphasis?: 'discount';
}) => (
  <div className="flex items-center justify-between">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={cn('tabular-nums', emphasis === 'discount' && 'font-medium text-emerald-600')}>
      {value}
    </dd>
  </div>
);
