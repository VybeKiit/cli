/**
 * A pricing plan shown on the pricing screen. Data only — the screen renders it;
 * the real amounts and product ids live in the payment provider (see
 * `setup-payments`). Mirrors the web template's `plans.ts` verbatim so both
 * platforms list the same tiers.
 */
export interface Plan {
  /** Stable id passed to checkout. TODO(vybekiit): set to your provider's product/variant id. */
  readonly id: string;
  /** Plan name shown on the card, e.g. "Pro". */
  readonly name: string;
  /** Display price, e.g. "$9". */
  readonly price: string;
  /** Billing period shown after the price, e.g. "/mo". */
  readonly period: string;
  /** One-line description of who the plan is for. */
  readonly description: string;
  /** Bullet list of what's included. */
  readonly features: readonly string[];
  /** Visually highlight this plan as the recommended one. */
  readonly featured?: boolean;
}

/**
 * Starter pricing tiers — placeholder copy the agent rewrites to the builder's
 * product. Three tiers is the common SaaS shape; edit freely.
 */
export const PLANS: readonly Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Try it out, no card needed.',
    features: ['1 project', 'Community support'],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'For getting serious.',
    features: ['Unlimited projects', 'Email support', 'Custom domain'],
    featured: true,
  },
  {
    id: 'plan_team',
    name: 'Team',
    price: '$29',
    period: '/mo',
    description: 'For you and your teammates.',
    features: ['Everything in Pro', 'Team members', 'Priority support'],
  },
];
