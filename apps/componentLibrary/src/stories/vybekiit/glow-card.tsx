'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { GlowCard } from '@vybekiit/ui/glow-card';

/** GlowCard in default (inactive) and active glowing states. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <GlowCard color="#7c3aed" className="w-64">
          <h3 className="mb-1 font-semibold text-sm text-white">Deploy in seconds</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Push your project and Vybekiit handles the rest — builds, previews, and production.
          </p>
        </GlowCard>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs">Active (glowing)</span>
        <GlowCard color="#22c55e" active={true} className="w-64">
          <h3 className="mb-1 font-semibold text-sm text-white">All systems go</h3>
          <p className="mb-3 text-muted-foreground text-xs leading-relaxed">
            Your deployment is live and passing all health checks.
          </p>
          <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300">
            View logs
          </Button>
        </GlowCard>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs">Clickable</span>
        <GlowCard color="#3b82f6" onClick={() => undefined} className="w-64">
          <h3 className="mb-1 font-semibold text-sm text-white">Starter Kit</h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Click this card to navigate to the full kit documentation.
          </p>
        </GlowCard>
      </div>
    </div>
  ),
};

export default story;
