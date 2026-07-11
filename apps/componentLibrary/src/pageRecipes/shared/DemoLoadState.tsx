'use client';

import { Loader2 } from 'lucide-react';

interface DemoLoadStateProps {
  readonly title: string;
  readonly detail?: string;
}

/**
 * Full-page loading placeholder used by interactive recipes.
 *
 * @param props - Heading and optional detail line.
 * @returns Centered spinner + copy.
 * @example
 * <DemoLoadState title="Loading orders…" detail="Fetching history." />
 */
export const DemoLoadState = ({ title, detail }: DemoLoadStateProps) => (
  <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
    <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-muted-foreground" />
    <h1 className="mt-6 font-bold text-2xl tracking-tight">{title}</h1>
    {detail === undefined ? null : <p className="mt-2 text-muted-foreground text-sm">{detail}</p>}
  </section>
);
