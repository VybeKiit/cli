'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Field, FieldDescription, FieldError, FieldLabel } from '@vybekiit/ui/field';
import { Input } from '@vybekiit/ui/input';
import { useId } from 'react';

const NormalField = () => {
  const inputId = useId();

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>Display name</FieldLabel>
      <Input id={inputId} placeholder="Acme Corp" />
      <FieldDescription>This is how your name appears across the product.</FieldDescription>
    </Field>
  );
};

const ErrorFieldDemo = () => {
  const inputId = useId();

  return (
    <Field data-invalid="true">
      <FieldLabel htmlFor={inputId}>Email address</FieldLabel>
      <Input
        aria-invalid={true}
        id={inputId}
        placeholder="you@company.com"
        type="email"
        defaultValue="not-an-email"
      />
      <FieldDescription>Enter the email linked to your account.</FieldDescription>
      <FieldError>Enter a valid email address.</FieldError>
    </Field>
  );
};

/** Two Field compositions: a normal field and an error field with FieldError + aria-invalid. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap gap-x-12 gap-y-8">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Normal
        </span>
        <div className="w-72">
          <NormalField />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Error
        </span>
        <div className="w-72">
          <ErrorFieldDemo />
        </div>
      </div>
    </div>
  ),
};

export default story;
