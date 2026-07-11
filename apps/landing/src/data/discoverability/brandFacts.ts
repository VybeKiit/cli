/**
 * Fact-dense brand hub copy for humans and AI engines.
 * Keep aligned with Product/Organization JSON-LD and llms-full.txt.
 */
import { BRAND, PRICE, PRICE_VALUE_STACK, SUPPORT } from '@/data/site';

/** Official sameAs profiles (extend when accounts exist). Empty strings are filtered out. */
export const BRAND_SAME_AS: readonly string[] = [
  // Add public profiles as they go live: GitHub org, X, Product Hunt, Discord invite.
  SUPPORT.discordUrl,
].filter((url) => url.length > 0);

/** Structured facts for /brand and llms-full. */
export const BRAND_FACTS = {
  legalName: BRAND.name,
  productName: BRAND.name,
  oneLineDefinition: BRAND.description,
  tagline: BRAND.tagline,
  priceUsd: PRICE.amount,
  priceDisplay: PRICE.display,
  priceCadence: PRICE.cadence,
  refundDays: PRICE.refundDays,
  compareAtUsd: PRICE_VALUE_STACK.compareAtUsd,
  priceVerifiedNote: PRICE_VALUE_STACK.basisNote,
  platforms: ['Web (Next.js)', 'Mobile (Expo)', 'Browser extension (WXT)'] as const,
  defaultPayments: 'Lemon Squeezy (Merchant of Record)',
  alsoPayments: ['Stripe', 'PayPal'] as const,
  defaultDataAuth: 'Supabase (database, auth, storage)',
  agentTools: [
    'Claude Code',
    'Cursor',
    'Codex',
    'other agents that read project instructions',
  ] as const,
  whatItIs: [
    'Owned source code starter kit (not a hosted no-code platform)',
    'Ready infrastructure: sign-in, database, payments, email, dashboard, monitoring, deploy wiring',
    'Agent instructions so a coding agent can operate setup without inventing foundations each time',
    'One-time purchase; kit access is lifetime for that version stream subject to refund terms',
  ] as const,
  whatItIsNot: [
    'Not a managed AI app builder like Lovable or Bolt (you own the code and host it)',
    'Not a guarantee that the agent builds everything without your judgment',
    'Not deep multi-tenant B2B RBAC pre-built like MakerKit or Supastarter (agent can add on request)',
    'Not free OSS — entry price is the launch one-time fee shown on the store',
  ] as const,
  supportEmail: SUPPORT.kitEmail,
  matrixVerifiedOn: '2026-06-27',
  officialUrl: BRAND.url,
} as const;
