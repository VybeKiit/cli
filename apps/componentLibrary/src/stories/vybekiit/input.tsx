'use client';

import type { ComponentStateId } from '@library/lib/componentStates';
import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { useId, useState } from 'react';

const STATE_CAPTION: Readonly<Record<string, string>> = {
  default: 'Default',
  disabled: 'Disabled',
  readonly: 'Read-only',
  error: 'Error (aria-invalid)',
};

/** One real, operable Input wired to a canonical state. */
const InputField = ({ state }: { readonly state: ComponentStateId }) => {
  const fieldId = useId();
  const errorId = useId();
  const [value, setValue] = useState(state === 'readonly' ? 'ada@vybekiit.com' : '');
  const isError = state === 'error';

  return (
    <div className="w-full max-w-sm space-y-2">
      <Label htmlFor={fieldId}>Work email</Label>
      <Input
        aria-describedby={isError ? errorId : undefined}
        aria-invalid={isError}
        disabled={state === 'disabled'}
        id={fieldId}
        onChange={(event) => setValue(event.target.value)}
        placeholder="you@company.com"
        readOnly={state === 'readonly'}
        type="email"
        value={value}
      />
      {isError ? (
        <p className="text-destructive text-sm" id={errorId} role="alert">
          Enter a valid work email address.
        </p>
      ) : null}
    </div>
  );
};

const ORDER: readonly ComponentStateId[] = ['default', 'disabled', 'readonly', 'error'];

/** Every canonical Input state, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="grid w-full max-w-sm gap-5">
      {ORDER.map((state) => (
        <div className="space-y-2" key={state}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {STATE_CAPTION[state]}
          </p>
          <InputField state={state} />
        </div>
      ))}
    </div>
  ),
};

export default story;
