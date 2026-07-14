'use client';

import { cn } from './utils';

/**
 * Brand mark for a provider / platform used in journey cards and scenario lists.
 * Keys are lowercase aliases (e.g. "lemon squeezy", "neon", "cloudflare").
 */
export type ProviderBrand = {
  readonly id: string;
  readonly label: string;
  readonly color: string;
  /** Inline SVG markup using currentColor for the icon fill where possible. */
  readonly svg: string;
};

const BRANDS: Record<string, ProviderBrand> = {
  neon: {
    id: 'neon',
    label: 'Neon',
    color: '#00E599',
    svg: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v6.379a1.5 1.5 0 0 1-.44 1.06l-6 6A1.5 1.5 0 0 1 7.5 18.5H4.5A1.5 1.5 0 0 1 3 17V4.5z" fill="currentColor"/><path d="M15.5 9.5 21 15v5.5A1.5 1.5 0 0 1 19.5 22H14l-4.5-4.5V12l6-2.5z" fill="currentColor" opacity=".55"/></svg>`,
  },
  supabase: {
    id: 'supabase',
    label: 'Supabase',
    color: '#3ECF8E',
    svg: `<svg viewBox="0 0 109 113" fill="none"><path d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97l-1.007-67.251h45.22c8.19 0 12.758 9.46 7.665 15.874l-43.151 54.347z" fill="currentColor" opacity=".55"/><path d="M45.317 2.071c2.86-3.601 8.657-1.628 8.726 2.97l.442 67.251H9.83c-8.19 0-12.759-9.46-7.665-15.875L45.317 2.071z" fill="currentColor"/></svg>`,
  },
  postgres: {
    id: 'postgres',
    label: 'PostgreSQL',
    color: '#336791',
    svg: `<svg viewBox="0 0 25.6 25.6"><path fill="currentColor" d="M18.983 18.636c.163-1.357.114-1.555 1.124-1.336l.257.023c.777.035 1.793-.125 2.4-.404 1.285-.588 2.046-1.564.796-1.307-2.856.588-3.07-.351-3.07-.351 3.036-4.5 4.303-10.21 3.208-11.612-2.978-3.81-8.14-2.007-8.23-1.96l-.03.002c-.568-.116-1.203-.19-1.912-.2-1.293-.02-2.274.34-3.03.863 0 0-9.215-3.81-8.786 4.79.09 1.83 2.614 13.853 5.625 10.218 1.1-1.328 2.163-2.45 2.163-2.45.528.348 1.162.52 1.822.463l.05-.044c-.016.157-.008.31.02.49-1.067 1.183-1.747 1.62-3.055 2.2-2.376 1.048-.952 2.022-.071 2.367 1.078.422 3.568.745 5.105-.979l-.05.218c.336.27.575 1.745.534 3.085-.04 1.34-.07 2.263.313 2.983.385.72.716 2.355 3.82 1.87 2.593-.405 3.94-1.453 4.12-3.195.128-1.244.395-1.063.413-2.18l.22-.75c.252-2.102.04-2.78-.957-3.633l-.023-.002z"/></svg>`,
  },
  mongodb: {
    id: 'mongodb',
    label: 'MongoDB',
    color: '#47A248',
    svg: `<svg viewBox="0 0 32 32"><path fill="currentColor" d="M15.821 23.185s0-10.361.347-10.396c.208-.021 6.516-8.74 1.246-12.503-1.076 1.263-3.006 2.725-3.375 4.47-.37 1.746-.065 3.665-.765 5.54C12.534 12.098 10.9 14.68 11.093 18.3c.128 2.408 1.315 4.98 2.956 6.478l.046.04c.169-1.213.375-1.633.375-1.633z"/></svg>`,
  },
  stripe: {
    id: 'stripe',
    label: 'Stripe',
    color: '#635BFF',
    svg: `<svg viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M13.3 11.3c0-.77.63-1.07 1.68-1.07 1.5 0 3.39.46 4.89 1.27V7.6c-1.64-.65-3.26-.91-4.89-.91-4 0-6.66 2.09-6.66 5.58 0 5.44 7.5 4.57 7.5 6.92 0 .92-.8 1.21-1.91 1.21-1.65 0-3.76-.68-5.43-1.59v3.96c1.85.8 3.71 1.13 5.43 1.13 4.1 0 6.91-2.03 6.91-5.57-.01-5.87-7.52-4.83-7.52-6.93z" fill="white"/></svg>`,
  },
  'lemon squeezy': {
    id: 'lemon-squeezy',
    label: 'Lemon Squeezy',
    color: '#FFC233',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.4916 10.835 2.3748-6.5114a3.1497 3.1497 0 0 0-.065-2.3418C9.0315.183 6.9427-.398 5.2928.265 3.643.929 2.71 2.4348 3.512 4.3046l2.8197 6.5615c.219.509.97.489 1.16-.03m1.6798 1.0969 6.5334-2.7758c2.1699-.9219 2.7218-3.6907 1.022-5.2905l-.068-.063c-1.6669-1.5469-4.4217-1.002-5.3706 1.0359L8.3566 11.135c-.234.503.295 1.0199.8159.7979m.373.87 6.6454-2.5119c2.2078-.8349 4.6206.745 4.5886 3.0398l-.002.09c-.048 2.2358-2.3938 3.7376-4.5536 2.9467l-6.6724-2.4418a.595.595 0 0 1-.006-1.1229m-.386 1.9269 6.4375 2.9767a3.2997 3.2997 0 0 1 1.6658 1.6989c.769 1.7998-.283 3.6396-1.9328 4.3016-1.6499.662-3.4097.235-4.2097-1.6359l-2.8027-6.5694c-.217-.509.328-1.009.8419-.772"/></svg>`,
  },
  paypal: {
    id: 'paypal',
    label: 'PayPal',
    color: '#003087',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.65a.768.768 0 0 1 .757-.65h6.15c2.04 0 3.653.57 4.734 1.616.977.948 1.483 2.318 1.396 3.96-.21 3.995-2.79 6.19-6.76 6.19H9.06a.768.768 0 0 0-.757.65l-1.227 7.521z"/><path d="M19.188 7.232c-.485 3.49-2.94 5.508-6.452 5.508h-1.6a.545.545 0 0 0-.538.462l-.87 5.507-.265 1.682a.36.36 0 0 0 .357.416h2.82a.545.545 0 0 0 .538-.462l.698-4.426a.545.545 0 0 1 .538-.462h1.278c2.885 0 5.146-1.748 5.72-4.55.274-1.339.088-2.448-.674-3.24-.453-.47-1.068-.794-1.81-.99" opacity=".7"/></svg>`,
  },
  google: {
    id: 'google',
    label: 'Google',
    color: '#4285F4',
    svg: `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
  },
  cloudflare: {
    id: 'cloudflare',
    label: 'Cloudflare',
    color: '#F6821F',
    svg: `<svg viewBox="0 0 65 32" fill="currentColor"><path d="M45.375 25.634l.87-3.013c.247-.855.169-1.642-.218-2.217-.36-.536-.95-.854-1.66-.897l-19.89-.26c-.11-.01-.2-.065-.24-.148-.045-.09-.04-.195.02-.277.077-.109.2-.18.332-.19l20.07-.26c1.633-.098 3.404-1.415 4.047-3.03l.816-2.044c.05-.127.07-.264.04-.397C48.094 7.11 42.75 2.5 36.37 2.5c-5.623 0-10.4 3.558-12.22 8.544-.992-.735-2.264-1.132-3.632-.99-2.354.245-4.25 2.13-4.508 4.48-.06.55-.035 1.082.06 1.586C11.37 16.228 7.5 20.177 7.5 25.005c0 .346.02.687.055 1.024.03.257.25.45.51.45h36.75c.218 0 .41-.14.475-.348l.085-.297z"/></svg>`,
  },
  vercel: {
    id: 'vercel',
    label: 'Vercel',
    color: '#000000',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L24 22H0L12 1z"/></svg>`,
  },
  render: {
    id: 'render',
    label: 'Render',
    color: '#46E3B7',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.3 7.2 3.95v1.7L12 14.1 4.8 10v-1.75L12 4.3zm-7.2 8.05 6.2 3.4v5.45l-6.2-3.4v-5.45zm8.2 8.85v-5.45l6.2-3.4v5.45l-6.2 3.4z"/></svg>`,
  },
  railway: {
    id: 'railway',
    label: 'Railway',
    color: '#A855F7',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 .277.01.552.03.824a.174.174 0 0 0 .234.15l7.04-2.664c.067-.025.118-.082.137-.152.317-1.146 1.023-2.14 1.973-2.792a4.873 4.873 0 0 1 5.172 0c.95.652 1.656 1.646 1.973 2.792.019.07.07.127.137.152l7.04 2.664a.174.174 0 0 0 .234-.15c.02-.272.03-.547.03-.824C24 5.373 18.627 0 12 0z"/><path d="M.113 14.725c.013.058.054.104.11.12l7.155 2.32c.122.04.253-.008.317-.115l.166-.282a7.4 7.4 0 0 0 .893-3.2l.003-.096c.008-.322.012-.505-.248-.505H.395c-.123 0-.221.098-.236.22l-.055.426a8.14 8.14 0 0 0 .009 1.112z"/></svg>`,
  },
  aws: {
    id: 'aws',
    label: 'AWS',
    color: '#FF9900',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.374 6.18 6.18 0 0 1-.248-.467c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.384-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.032-.863.104-.296.072-.583.16-.863.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.023c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.279-.144.614-.264 1.005-.36A4.84 4.84 0 0 1 5.07 5.6c.862 0 1.493.196 1.9.588.4.391.606.984.606 1.78v2.348l-.813-.28zm9.6 2.1h1.2c.2 0 .32-.08.32-.24 0-.08-.04-.16-.12-.24l-3.4-3.92 3.2-3.68c.08-.08.12-.16.12-.24 0-.16-.12-.24-.32-.24h-1.24c-.16 0-.28.04-.36.16L12.6 8.2 9.76 4.96c-.08-.12-.2-.16-.36-.16H8.16c-.2 0-.32.08-.32.24 0 .08.04.16.12.24l3.2 3.68-3.4 3.92c-.08.08-.12.16-.12.24 0 .16.12.24.32.24h1.24c.16 0 .28-.04.36-.16L12.6 9.76l2.84 3.22c.08.12.2.16.36.16z"/></svg>`,
  },
  /** Commerce resource (orders) uses Lemon Squeezy — kit v1 payments default. */
  orders: {
    id: 'lemon-squeezy',
    label: 'Lemon Squeezy',
    color: '#FFC233',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.4916 10.835 2.3748-6.5114a3.1497 3.1497 0 0 0-.065-2.3418C9.0315.183 6.9427-.398 5.2928.265 3.643.929 2.71 2.4348 3.512 4.3046l2.8197 6.5615c.219.509.97.489 1.16-.03m1.6798 1.0969 6.5334-2.7758c2.1699-.9219 2.7218-3.6907 1.022-5.2905l-.068-.063c-1.6669-1.5469-4.4217-1.002-5.3706 1.0359L8.3566 11.135c-.234.503.295 1.0199.8159.7979m.373.87 6.6454-2.5119c2.2078-.8349 4.6206.745 4.5886 3.0398l-.002.09c-.048 2.2358-2.3938 3.7376-4.5536 2.9467l-6.6724-2.4418a.595.595 0 0 1-.006-1.1229m-.386 1.9269 6.4375 2.9767a3.2997 3.2997 0 0 1 1.6658 1.6989c.769 1.7998-.283 3.6396-1.9328 4.3016-1.6499.662-3.4097.235-4.2097-1.6359l-2.8027-6.5694c-.217-.509.328-1.009.8419-.772"/></svg>`,
  },
  d1: {
    id: 'd1',
    label: 'Cloudflare D1',
    color: '#F6821F',
    svg: `<svg viewBox="0 0 65 32" fill="currentColor"><path d="M45.375 25.634l.87-3.013c.247-.855.169-1.642-.218-2.217-.36-.536-.95-.854-1.66-.897l-19.89-.26c-.11-.01-.2-.065-.24-.148-.045-.09-.04-.195.02-.277.077-.109.2-.18.332-.19l20.07-.26c1.633-.098 3.404-1.415 4.047-3.03l.816-2.044c.05-.127.07-.264.04-.397C48.094 7.11 42.75 2.5 36.37 2.5c-5.623 0-10.4 3.558-12.22 8.544-.992-.735-2.264-1.132-3.632-.99-2.354.245-4.25 2.13-4.508 4.48-.06.55-.035 1.082.06 1.586C11.37 16.228 7.5 20.177 7.5 25.005c0 .346.02.687.055 1.024.03.257.25.45.51.45h36.75c.218 0 .41-.14.475-.348l.085-.297z"/></svg>`,
  },
  resend: {
    id: 'resend',
    label: 'Resend',
    color: '#000000',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16a1 1 0 0 1 1 1v2.2l-9 5.4-9-5.4V5a1 1 0 0 1 1-1zm0 6.4 8 4.8 8-4.8V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10.4z"/></svg>`,
  },
  github: {
    id: 'github',
    label: 'GitHub',
    color: '#181717',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>`,
  },
};

/** Aliases → canonical brand key in BRANDS. */
const ALIASES: Record<string, string> = {
  neon: 'neon',
  supabase: 'supabase',
  postgres: 'postgres',
  postgresql: 'postgres',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  stripe: 'stripe',
  lemon: 'lemon squeezy',
  'lemon squeezy': 'lemon squeezy',
  'lemon-squeezy': 'lemon squeezy',
  lemonsqueezy: 'lemon squeezy',
  ls: 'lemon squeezy',
  /** Commerce resource → kit payments default (Lemon Squeezy). */
  orders: 'orders',
  order: 'orders',
  paypal: 'paypal',
  google: 'google',
  cloudflare: 'cloudflare',
  workers: 'cloudflare',
  pages: 'cloudflare',
  d1: 'd1',
  'cloudflare d1': 'd1',
  vercel: 'vercel',
  render: 'render',
  railway: 'railway',
  aws: 'aws',
  amazon: 'aws',
  resend: 'resend',
  email: 'resend',
  github: 'github',
  gh: 'github',
};

export type ProviderMarkDomain = 'auth' | 'database' | 'payments' | 'deploy' | 'crud';

/** Domain → default brand when no provider was named (kit v1 defaults). */
const DOMAIN_DEFAULT_BRAND: Record<ProviderMarkDomain, string> = {
  auth: 'google',
  database: 'neon',
  payments: 'lemon squeezy',
  deploy: 'cloudflare',
  crud: 'orders',
};

/**
 * Normalize free-text provider / domain / resource into a catalog brand.
 *
 * @param provider - e.g. "neon", "lemon squeezy", "cloudflare".
 * @param domain - Journey domain when provider is missing.
 * @param resource - CRUD resource (orders → Lemon Squeezy mark).
 * @returns Brand or undefined when unknown.
 * @example
 * resolveProviderBrand('neon')?.label // 'Neon'
 */
export const resolveProviderBrand = (
  provider?: string,
  domain?: ProviderMarkDomain,
  resource?: string,
): ProviderBrand | undefined => {
  if (provider) {
    const key = ALIASES[provider.trim().toLowerCase()];
    if (key !== undefined) {
      return BRANDS[key];
    }
  }
  if (resource) {
    const key = ALIASES[resource.trim().toLowerCase()];
    if (key !== undefined) {
      return BRANDS[key];
    }
  }
  if (domain !== undefined) {
    const brandKey = DOMAIN_DEFAULT_BRAND[domain];
    return BRANDS[brandKey];
  }
  return undefined;
};

/**
 * Resolve several brand tokens (providers or domain defaults) for multi-action UIs.
 *
 * @param tokens - Provider names and/or domain ids (`neon`, `payments`, …).
 * @returns Deduped brands in input order.
 * @example
 * resolveProviderBrands(['neon', 'stripe', 'cloudflare'])
 */
export const resolveProviderBrands = (tokens: readonly string[]): readonly ProviderBrand[] => {
  const seen = new Set<string>();
  const out: ProviderBrand[] = [];
  for (const token of tokens) {
    const lower = token.trim().toLowerCase();
    if (lower === '') {
      continue;
    }
    const asDomain = (['auth', 'database', 'payments', 'deploy', 'crud'] as const).includes(
      lower as ProviderMarkDomain,
    )
      ? resolveProviderBrand(undefined, lower as ProviderMarkDomain)
      : resolveProviderBrand(lower);
    if (asDomain === undefined || seen.has(asDomain.id)) {
      continue;
    }
    seen.add(asDomain.id);
    out.push(asDomain);
  }
  return out;
};

export type ProviderMarkProps = {
  readonly provider?: string;
  readonly domain?: ProviderMarkDomain;
  readonly resource?: string;
  /** When true, brand color + glow (active / done). */
  readonly active?: boolean;
  /** When true, subtle pulse (running). */
  readonly running?: boolean;
  readonly size?: number;
  readonly showLabel?: boolean;
  readonly className?: string;
};

/** Border + opacity classes for the mark's active / running / idle state. */
const markStateClass = (active: boolean, running: boolean): string => {
  if (active) {
    return 'border-transparent opacity-100';
  }
  if (running) {
    return 'border-border/80 opacity-90';
  }
  return 'border-border/60 opacity-70 grayscale';
};

/**
 * Dynamic brand logo for the action in progress (Neon, Stripe, LS, Cloudflare, …).
 *
 * @param props - Provider/domain/resource identity and display flags.
 * @returns Logo mark or null when no brand resolves.
 * @example
 * <ProviderMark provider="neon" active size={28} showLabel />
 */
export const ProviderMark = ({
  provider,
  domain,
  resource,
  active = false,
  running = false,
  size = 28,
  showLabel = false,
  className,
}: ProviderMarkProps) => {
  const brand = resolveProviderBrand(provider, domain, resource);
  if (brand === undefined) {
    return null;
  }

  return (
    <div
      data-testid="provider-mark"
      data-provider={brand.id}
      data-active={active ? 'true' : 'false'}
      data-running={running ? 'true' : 'false'}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all duration-500',
        markStateClass(active, running),
        className,
      )}
      style={
        active || running
          ? {
              boxShadow: `0 0 ${active ? 18 : 10}px ${brand.color}${active ? '66' : '40'}`,
              backgroundColor: `${brand.color}14`,
            }
          : undefined
      }
      title={brand.label}
    >
      <div
        className={cn(
          'shrink-0 transition-all duration-500',
          running && !active ? 'animate-pulse' : '',
        )}
        style={{
          width: size,
          height: size,
          color: active || running ? brand.color : '#71717a',
        }}
        // Brand SVGs are static catalog strings (not user input).
        dangerouslySetInnerHTML={{ __html: brand.svg }}
      />
      {showLabel ? (
        <span
          className={cn(
            'text-xs font-semibold transition-colors duration-500',
            active || running ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {brand.label}
        </span>
      ) : null}
    </div>
  );
};

export type ProviderMarkStackProps = {
  /** Provider names and/or domain ids (`neon`, `payments`, `stripe`). */
  readonly tokens: readonly string[];
  readonly active?: boolean;
  readonly running?: boolean;
  readonly size?: number;
  readonly className?: string;
};

/**
 * Stack of brand logos for multi-domain actions (Neon + Stripe + Cloudflare).
 *
 * @param props - Tokens to resolve and display flags.
 * @returns Row of provider marks (null when none resolve).
 * @example
 * <ProviderMarkStack tokens={['neon', 'stripe', 'cloudflare']} active />
 */
export const ProviderMarkStack = ({
  tokens,
  active = false,
  running = false,
  size = 24,
  className,
}: ProviderMarkStackProps) => {
  const brands = resolveProviderBrands(tokens);
  if (brands.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="provider-mark-stack"
      data-count={brands.length}
      className={cn('inline-flex flex-wrap items-center gap-1.5', className)}
    >
      {brands.map((brand) => (
        <ProviderMark
          key={brand.id}
          provider={brand.id}
          active={active}
          running={running}
          size={size}
          showLabel={false}
        />
      ))}
    </div>
  );
};
