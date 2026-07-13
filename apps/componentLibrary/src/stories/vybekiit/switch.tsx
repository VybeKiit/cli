'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Label } from '@vybekiit/ui/label';
import { Switch } from '@vybekiit/ui/switch';
import { useId } from 'react';

/** One real Switch with a bound label. */
const SwitchRow = ({
  label,
  defaultChecked,
  disabled,
}: {
  readonly label: string;
  readonly defaultChecked?: boolean;
  readonly disabled?: boolean;
}) => {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <Switch defaultChecked={defaultChecked} disabled={disabled} id={id} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

/** Every Switch state, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="grid gap-4">
      <SwitchRow label="Off" />
      <SwitchRow defaultChecked={true} label="On" />
      <SwitchRow disabled={true} label="Disabled" />
      <SwitchRow defaultChecked={true} disabled={true} label="Disabled on" />
    </div>
  ),
};

export default story;
