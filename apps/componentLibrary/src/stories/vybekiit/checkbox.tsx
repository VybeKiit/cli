'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Checkbox } from '@vybekiit/ui/checkbox';
import { Label } from '@vybekiit/ui/label';
import { useId } from 'react';

/** One real Checkbox with a bound label. */
const CheckboxRow = ({
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
      <Checkbox defaultChecked={defaultChecked} disabled={disabled} id={id} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
};

/** Every Checkbox state, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="grid gap-4">
      <CheckboxRow label="Unchecked" />
      <CheckboxRow defaultChecked={true} label="Checked" />
      <CheckboxRow disabled={true} label="Disabled" />
      <CheckboxRow defaultChecked={true} disabled={true} label="Disabled checked" />
    </div>
  ),
};

export default story;
