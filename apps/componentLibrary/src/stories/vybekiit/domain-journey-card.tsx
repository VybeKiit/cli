'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { DomainJourneyCard } from '@vybekiit/ui/domain-journey-card';

/** Every domain kind rendered as a realistic journey card. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          auth — in progress
        </p>
        <DomainJourneyCard
          domain="auth"
          title="Sign in with Google"
          description="Add OAuth 2.0 sign-in via better-auth and a Google Cloud project."
          provider="google"
          skillIntent="sign-in-with-google"
          steps={[
            { id: 'pkg', label: 'Install better-auth', status: 'done' },
            { id: 'google', label: 'Configure Google provider', status: 'done' },
            { id: 'session', label: 'Add session middleware', status: 'running' },
            { id: 'ui', label: 'Wire sign-in button', status: 'pending' },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          database — complete
        </p>
        <DomainJourneyCard
          domain="database"
          title="Save data on Neon"
          description="Provision a Neon Postgres branch and connect Drizzle ORM."
          provider="neon"
          steps={[
            { id: 'create', label: 'Create Neon project', status: 'done' },
            { id: 'drizzle', label: 'Install Drizzle ORM', status: 'done' },
            { id: 'schema', label: 'Push initial schema', status: 'done' },
            { id: 'env', label: 'Set DATABASE_URL', status: 'done' },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          payments — partial
        </p>
        <DomainJourneyCard
          domain="payments"
          title="Accept payments with Stripe"
          provider="stripe"
          steps={[
            { id: 'pkg', label: 'Install Stripe SDK', status: 'done' },
            { id: 'keys', label: 'Add API keys', status: 'done' },
            { id: 'checkout', label: 'Build checkout session', status: 'error' },
            { id: 'webhook', label: 'Register webhook endpoint', status: 'pending' },
          ]}
          footer={
            <Button size="sm" variant="outline" className="mt-3 w-full">
              Retry checkout setup
            </Button>
          }
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          deploy — pending
        </p>
        <DomainJourneyCard
          domain="deploy"
          title="Go live on Cloudflare Pages"
          provider="cloudflare"
          steps={[
            { id: 'build', label: 'Configure build command', status: 'pending' },
            { id: 'env', label: 'Set production env vars', status: 'pending' },
            { id: 'domain', label: 'Attach custom domain', status: 'pending' },
          ]}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          crud — resource-labelled
        </p>
        <DomainJourneyCard
          domain="crud"
          title="Build orders CRUD"
          resource="orders"
          steps={[
            { id: 'schema', label: 'Define orders schema', status: 'done' },
            { id: 'api', label: 'Create REST endpoints', status: 'running' },
            { id: 'ui', label: 'Build data table', status: 'pending' },
          ]}
        />
      </div>
    </div>
  ),
};

export default story;
