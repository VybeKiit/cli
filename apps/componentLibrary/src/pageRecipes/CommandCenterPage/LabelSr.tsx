import type { ReactNode } from 'react';

/** Visually hidden label for the search field. */
export const LabelSr = ({
  htmlFor,
  children,
}: {
  readonly htmlFor: string;
  readonly children: ReactNode;
}) => (
  <label className="sr-only" htmlFor={htmlFor}>
    {children}
  </label>
);
