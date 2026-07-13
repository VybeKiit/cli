'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { JourneyRail } from '@vybekiit/ui/journey-rail';

const JOURNEYS = [
  {
    id: 'auth-journey',
    domain: 'auth' as const,
    title: 'Sign in with Google',
    description: 'OAuth 2.0 via better-auth.',
    provider: 'google',
    steps: [
      { id: 'pkg', label: 'Install better-auth', status: 'done' as const },
      { id: 'google', label: 'Configure Google provider', status: 'done' as const },
      { id: 'session', label: 'Add session middleware', status: 'running' as const },
      { id: 'ui', label: 'Wire sign-in button', status: 'pending' as const },
    ],
  },
  {
    id: 'db-journey',
    domain: 'database' as const,
    title: 'Save data on Neon',
    description: 'Neon Postgres + Drizzle ORM.',
    provider: 'neon',
    steps: [
      { id: 'create', label: 'Create Neon project', status: 'done' as const },
      { id: 'drizzle', label: 'Install Drizzle ORM', status: 'done' as const },
      { id: 'schema', label: 'Push initial schema', status: 'done' as const },
      { id: 'env', label: 'Set DATABASE_URL', status: 'done' as const },
    ],
  },
  {
    id: 'deploy-journey',
    domain: 'deploy' as const,
    title: 'Go live on Cloudflare Pages',
    provider: 'cloudflare',
    steps: [
      { id: 'build', label: 'Configure build command', status: 'pending' as const },
      { id: 'env', label: 'Set production env vars', status: 'pending' as const },
      { id: 'domain', label: 'Attach custom domain', status: 'pending' as const },
    ],
  },
] as const;

/** JourneyRail with a populated list, and the empty-state variant. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          populated rail — 3 journeys
        </p>
        <div className="overflow-x-auto">
          <JourneyRail
            journeys={JOURNEYS}
            header={<p className="text-sm font-semibold text-foreground">Work in progress</p>}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          empty state — custom fallback
        </p>
        <JourneyRail
          journeys={[]}
          empty={
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No active journeys yet. Ask the assistant to set something up.
            </p>
          }
        />
      </div>
    </div>
  ),
};

export default story;
