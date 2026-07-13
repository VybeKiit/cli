'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  ProviderMark,
  ProviderMarkStack,
  resolveProviderBrand,
  resolveProviderBrands,
} from '@vybekiit/ui/provider-mark';

const PROVIDERS = ['neon', 'stripe', 'cloudflare', 'supabase', 'resend', 'github'] as const;
const STACK_TOKENS = ['neon', 'stripe', 'cloudflare', 'resend'] as const;

/** ProviderMark for individual providers and a ProviderMarkStack, in all states. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-8 w-full max-w-2xl">
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          Individual marks — inactive (grayscale)
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {PROVIDERS.map((provider) => (
            <ProviderMark key={provider} provider={provider} showLabel={true} size={22} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          Running state (pulse + color)
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {PROVIDERS.map((provider) => (
            <ProviderMark
              key={provider}
              provider={provider}
              running={true}
              showLabel={true}
              size={22}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          Active state (glow + full color)
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {PROVIDERS.map((provider) => (
            <ProviderMark
              key={provider}
              provider={provider}
              active={true}
              showLabel={true}
              size={22}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          ProviderMarkStack — active
        </span>
        <ProviderMarkStack tokens={[...STACK_TOKENS]} active={true} size={22} />
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          ProviderMarkStack — inactive
        </span>
        <ProviderMarkStack
          tokens={['neon', 'stripe', 'cloudflare', 'supabase', 'resend', 'github']}
          size={22}
        />
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          Domain aliases (auth → google, database → neon, payments → lemon squeezy, deploy →
          cloudflare)
        </span>
        <ProviderMarkStack
          tokens={['auth', 'database', 'payments', 'deploy']}
          running={true}
          size={22}
        />
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">
          resolveProviderBrand / resolveProviderBrands utility output
        </span>
        <div className="rounded-lg border border-border/40 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">
          <p>
            resolveProviderBrand('neon')?.label →{' '}
            <strong>{resolveProviderBrand('neon')?.label}</strong>
          </p>
          <p>
            resolveProviderBrand('stripe')?.color →{' '}
            <strong>{resolveProviderBrand('stripe')?.color}</strong>
          </p>
          <p>
            resolveProviderBrands(['neon','cloudflare']).length →{' '}
            <strong>{resolveProviderBrands(['neon', 'cloudflare']).length}</strong>
          </p>
        </div>
      </div>
    </div>
  ),
};

export default story;
