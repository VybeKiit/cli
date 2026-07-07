import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { cn } from '@/lib/utils';
import type * as React from 'react';

/**
 * Props for {@link FormField}. Extends the native input attributes so callers pass
 * `type`, `value`, `onChange`, `autoComplete`, etc. straight through.
 */
export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label text. */
  label: string;
  /** Input id — also wires the label and the error's `aria-describedby`. Required. */
  id: string;
  /** Inline validation message. Empty string renders nothing (no `undefined` needed under EOPT). */
  error?: string;
}

/**
 * Label + input + inline error — the single field primitive every form uses, so
 * no screen hand-rolls its own error markup. Sets `aria-invalid`/`aria-describedby`
 * for screen readers when an error is present.
 *
 * @param props - Native input props plus visible label and optional inline error.
 * @returns A labelled input with accessible error wiring when needed.
 * @example
 * <FormField id={emailId} label="Email" type="email" />
 */
export const FormField = ({ label, id, error = '', className = '', ...props }: FormFieldProps) => {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(error && 'border-destructive focus-visible:ring-destructive', className)}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
};
