'use client';

import type { ReactNode } from 'react';

interface DemoPlugInPanelProps {
  /** Body under the summary (intro paragraph + ordered steps). */
  readonly children: ReactNode;
}

/**
 * Shared “Plug this into your app” collapsible shell for page recipes.
 *
 * Pass the intro + `<ol>` as children so each recipe keeps its own install steps.
 *
 * @param props - Panel body.
 * @returns Details panel with a fixed summary label.
 * @example
 * <DemoPlugInPanel>
 *   <p>To make it real:</p>
 *   <ol className="list-decimal space-y-1 pl-5"><li>…</li></ol>
 * </DemoPlugInPanel>
 */
export const DemoPlugInPanel = ({ children }: DemoPlugInPanelProps) => (
  <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
    <summary className="cursor-pointer font-medium">Plug this into your app</summary>
    <div className="mt-3 space-y-2 text-muted-foreground">{children}</div>
  </details>
);
