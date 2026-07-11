import type { ReactNode } from 'react';

/** Inline field error text (announced to assistive tech). */
export const FieldError = ({
  id,
  children,
}: {
  readonly id: string;
  readonly children: ReactNode;
}) => (
  <p className="text-destructive text-sm" id={id} role="alert">
    {children}
  </p>
);
