'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { AutoScrollRow } from '@vybekiit/ui/AutoScrollRow';

const BADGES = [
  { key: 'neon', label: 'Neon' },
  { key: 'stripe', label: 'Stripe' },
  { key: 'cloudflare', label: 'Cloudflare' },
  { key: 'supabase', label: 'Supabase' },
  { key: 'vercel', label: 'Vercel' },
  { key: 'resend', label: 'Resend' },
];

/** AutoScrollRow with 6 brand badges scrolling in an overflow-clipped container. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-4 w-full">
      <span className="font-medium text-muted-foreground text-xs">
        Auto-scrolling row (pause on hover)
      </span>
      <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-border/40 bg-zinc-950 py-4">
        <AutoScrollRow
          ariaLabel="Partner integrations"
          durationDesktop="18s"
          durationMobile="12s"
          pauseOnHover={true}
        >
          {BADGES.map(({ key, label }) => (
            <span
              key={key}
              className="mx-4 inline-flex shrink-0 items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-300"
            >
              {label}
            </span>
          ))}
        </AutoScrollRow>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs">No pause on hover</span>
        <div className="relative w-full max-w-xl overflow-hidden rounded-lg border border-border/40 bg-zinc-950 py-4">
          <AutoScrollRow
            ariaLabel="Partner integrations (continuous)"
            durationDesktop="22s"
            durationMobile="14s"
            pauseOnHover={false}
          >
            {BADGES.map(({ key, label }) => (
              <span
                key={key}
                className="mx-4 inline-flex shrink-0 items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-xs text-zinc-300"
              >
                {label}
              </span>
            ))}
          </AutoScrollRow>
        </div>
      </div>
    </div>
  ),
};

export default story;
