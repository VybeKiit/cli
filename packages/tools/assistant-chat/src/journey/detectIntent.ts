import { seedJourney } from './seedJourney';
import type { Journey, JourneyDomain } from './types';

type DomainRule = {
  readonly domain: JourneyDomain;
  readonly keywords: readonly string[];
  readonly providerHints?: ReadonlyArray<{ readonly key: string; readonly value: string }>;
  readonly extraParams?: (lower: string) => Readonly<Record<string, string>>;
};

const RULES: readonly DomainRule[] = [
  {
    domain: 'auth',
    keywords: [
      'auth',
      'login',
      'sign in',
      'sign-in',
      'signin',
      'sign up',
      'signup',
      'oauth',
      'password',
      'google sign',
      'continue with google',
    ],
    providerHints: [
      { key: 'google', value: 'google' },
      { key: 'phone', value: 'phone' },
      { key: 'sms', value: 'phone' },
      { key: 'magic link', value: 'email-link' },
    ],
  },
  {
    domain: 'database',
    keywords: [
      'database',
      ' db',
      'db ',
      'postgres',
      'neon',
      'supabase',
      'schema',
      'migration',
      'save data',
      'remember',
      'd1',
    ],
    providerHints: [
      { key: 'neon', value: 'neon' },
      { key: 'supabase', value: 'supabase' },
      { key: 'd1', value: 'cloudflare d1' },
      { key: 'planetscale', value: 'planetscale' },
    ],
  },
  {
    domain: 'crud',
    keywords: [
      'crud',
      'create read update delete',
      'create, read, update',
      'add-crud',
      'resource routes',
      'rest resource',
    ],
    extraParams: (lower) => {
      // crud for orders / posts
      const forMatch = lower.match(/\bfor\s+([a-z][a-z0-9_-]{1,32})\b/);
      if (forMatch?.[1]) {
        return { resource: forMatch[1] };
      }
      return {};
    },
  },
  {
    domain: 'payments',
    keywords: [
      'payment',
      'payments',
      'stripe',
      'checkout',
      'lemon squeezy',
      'lemonsqueezy',
      'paypal',
      'take money',
      'charge',
      'billing',
    ],
    providerHints: [
      { key: 'stripe', value: 'stripe' },
      { key: 'lemon', value: 'lemon squeezy' },
      { key: 'paypal', value: 'paypal' },
    ],
  },
  {
    domain: 'deploy',
    keywords: [
      'deploy',
      'go live',
      'put online',
      'ship it',
      'production',
      'cloudflare',
      'vercel',
      'render',
      'railway',
      'aws deploy',
      'index.html',
      'pages deploy',
    ],
    providerHints: [
      { key: 'cloudflare', value: 'cloudflare' },
      { key: 'workers', value: 'cloudflare' },
      { key: 'pages', value: 'cloudflare' },
      { key: 'vercel', value: 'vercel' },
      { key: 'render', value: 'render' },
      { key: 'railway', value: 'railway' },
      { key: 'aws', value: 'aws' },
    ],
    extraParams: (lower) => {
      if (
        lower.includes('index.html') ||
        lower.includes('basic html') ||
        lower.includes('static')
      ) {
        return { artifact: 'index.html' };
      }
      return {};
    },
  },
];

/** Kit v1 default provider when the domain hits but no brand was named. */
const DOMAIN_DEFAULT_PROVIDER: Partial<Record<JourneyDomain, string>> = {
  payments: 'lemon squeezy',
  database: 'neon',
  deploy: 'cloudflare',
  auth: 'google',
};

const extractParams = (lower: string, rule: DomainRule): Readonly<Record<string, string>> => {
  const fromHints: Record<string, string> = {};
  if (rule.providerHints) {
    for (const hint of rule.providerHints) {
      if (lower.includes(hint.key)) {
        fromHints.provider = hint.value;
        break;
      }
    }
  }
  const extra = rule.extraParams?.(lower) ?? {};
  const merged = { ...fromHints, ...extra };
  // Commerce resource → Lemon Squeezy brand on the journey card.
  if (rule.domain === 'crud' && merged.resource === 'orders' && merged.provider === undefined) {
    merged.provider = 'lemon squeezy';
  }
  if (merged.provider === undefined) {
    const fallback = DOMAIN_DEFAULT_PROVIDER[rule.domain];
    if (fallback !== undefined) {
      merged.provider = fallback;
    }
  }
  return merged;
};

/**
 * Detect domain journeys from a plain-language user message.
 * Parameterizes provider names (Google, Neon, Stripe, Cloudflare, Railway, …).
 *
 * @param userMessage - Raw chat text.
 * @returns Zero or more seeded journeys (stable domain order).
 * @example
 * seedJourneysFromMessage('deploy index.html to cloudflare and wire neon');
 */
export const seedJourneysFromMessage = (userMessage: string): readonly Journey[] => {
  const lower = ` ${userMessage.toLowerCase()} `;
  const journeys: Journey[] = [];
  const seen = new Set<JourneyDomain>();

  for (const rule of RULES) {
    if (seen.has(rule.domain)) {
      continue;
    }
    const hit = rule.keywords.some((kw) => lower.includes(kw));
    if (!hit) {
      continue;
    }
    seen.add(rule.domain);
    journeys.push(seedJourney(rule.domain, extractParams(lower, rule)));
  }

  return journeys;
};
