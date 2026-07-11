/** One label/value row on the review step. */
export const SummaryRow = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => (
  <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="break-words text-right font-medium">{value}</dd>
  </div>
);
