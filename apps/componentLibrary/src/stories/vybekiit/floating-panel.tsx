'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { FloatingPanel } from '@vybekiit/ui/floating-panel';
import { useState } from 'react';

/** FloatingPanel: titled, untitled, and closeable variants shown inside bounded containers. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => {
    const [closedA, setClosedA] = useState(false);

    return (
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            with title — draggable inside container
          </p>
          <div className="relative h-72 w-full transform-gpu overflow-hidden rounded-md border bg-muted/30">
            <FloatingPanel title="Inspector" defaultPosition={{ x: 16, y: 16 }}>
              <div className="space-y-1.5 text-xs text-zinc-300">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Component</span>
                  <span>Button</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Variant</span>
                  <span>primary</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Size</span>
                  <span>sm</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Disabled</span>
                  <span>false</span>
                </div>
              </div>
            </FloatingPanel>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            no title (default "Panel") — content only
          </p>
          <div className="relative h-48 w-full transform-gpu overflow-hidden rounded-md border bg-muted/30">
            <FloatingPanel defaultPosition={{ x: 16, y: 16 }}>
              <p className="text-xs text-zinc-400">Drag me from the header bar.</p>
            </FloatingPanel>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            with onClose handler
          </p>
          <div className="relative h-56 w-full transform-gpu overflow-hidden rounded-md border bg-muted/30">
            {closedA ? (
              <div className="flex h-full items-center justify-center">
                <Button size="sm" variant="outline" onClick={() => setClosedA(false)}>
                  Re-open panel
                </Button>
              </div>
            ) : (
              <FloatingPanel
                title="Logs"
                defaultPosition={{ x: 16, y: 16 }}
                onClose={() => setClosedA(true)}
              >
                <div className="space-y-1 text-xs font-mono text-zinc-400">
                  <p>
                    <span className="text-emerald-400">✓</span> Build complete
                  </p>
                  <p>
                    <span className="text-blue-400">ℹ</span> Deploying to edge…
                  </p>
                  <p>
                    <span className="text-emerald-400">✓</span> Live at example.com
                  </p>
                </div>
              </FloatingPanel>
            )}
          </div>
        </div>
      </div>
    );
  },
};

export default story;
