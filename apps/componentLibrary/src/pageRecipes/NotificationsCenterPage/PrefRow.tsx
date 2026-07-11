import { Switch } from '@vybekiit/ui/switch';

/** One channel preference row. */
export const PrefRow = ({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div>
      <label className="font-medium text-sm" htmlFor={id}>
        {label}
      </label>
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
    <Switch checked={checked} id={id} onCheckedChange={onChange} />
  </div>
);
