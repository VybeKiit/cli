'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { Toaster } from '@vybekiit/ui/sonner';
import { toast } from 'sonner';

/** Sonner toast system: Toaster host + trigger buttons for every built-in toast type. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full max-w-md space-y-6">
      {/* Toaster must be mounted once — the gallery renderer may already include one,
          but rendering it here keeps the story self-contained. */}
      <Toaster />

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          default toast
        </p>
        <Button variant="outline" size="sm" onClick={() => toast('Project settings saved.')}>
          Show default toast
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">success</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success('Deployment complete — live at example.com')}
        >
          Show success toast
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">error</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.error('Build failed. Check your logs for details.')}
        >
          Show error toast
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">info</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info('A new CLI version (v2.4.0) is available.')}
        >
          Show info toast
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">warning</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.warning("You're approaching your monthly usage limit (90%).")}
        >
          Show warning toast
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          with action button
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast('Unsaved changes will be lost.', {
              action: {
                label: 'Undo',
                onClick: () => toast.success('Action undone.'),
              },
            })
          }
        >
          Show toast with action
        </Button>
      </div>
    </div>
  ),
};

export default story;
