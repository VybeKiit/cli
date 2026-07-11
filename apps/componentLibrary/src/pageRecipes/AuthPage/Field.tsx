import { Label } from '@vybekiit/ui/label';
import type { ReactNode } from 'react';

/** A labelled form field wrapper. */
export const Field = ({
  id,
  label,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly children: ReactNode;
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);
