import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly id: string;
  readonly error?: string;
}

/**
 * Render a labeled input with inline validation text.
 *
 * @param props - Native input props plus label and optional error message.
 * @returns A form field with accessible error wiring.
 * @example
 * <FormField id="email" label="Email" value={email} />
 */
export const FormField = ({ label, id, error = '', className, ...props }: FormFieldProps) => {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium text-sm">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(error && 'border-destructive', className)}
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
