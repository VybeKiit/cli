/**
 * A pricing plan shown on the pricing page. Translatable fields are message keys;
 * the page resolves them with `t()`.
 */
export interface Plan {
  /** Stable id passed to checkout. TODO(vybekiit): set to your provider's product/variant id. */
  readonly id: string;
  /** Message key for the plan name, e.g. "pricing.plans.pro.name". */
  readonly nameKey: string;
  readonly priceKey: string;
  readonly periodKey: string;
  readonly descriptionKey: string;
  /** Message keys for feature bullets. */
  readonly featureKeys: readonly string[];
  /** Visually highlight this plan as the recommended one. */
  readonly featured?: boolean;
}

/** Slug derived from plan id — e.g. plan_pro → pro. */
function _planSlug(id: string): string {
  return id.replace(/^plan_/, '');
}

/** Build message-key paths for a plan tier. */
function planKeys(slug: string) {
  const base = `pricing.plans.${slug}`;
  return {
    nameKey: `${base}.name`,
    priceKey: `${base}.price`,
    periodKey: `${base}.period`,
    descriptionKey: `${base}.description`,
    featureKeys: [`${base}.features.0`, `${base}.features.1`, `${base}.features.2`] as const,
  };
}

const free = planKeys('free');
const pro = planKeys('pro');
const team = planKeys('team');

/**
 * Starter pricing tiers — placeholder copy the agent rewrites via the message catalog.
 */
export const PLANS: readonly Plan[] = [
  {
    id: 'plan_free',
    nameKey: free.nameKey,
    priceKey: free.priceKey,
    periodKey: free.periodKey,
    descriptionKey: free.descriptionKey,
    featureKeys: [free.featureKeys[0], free.featureKeys[1]],
  },
  {
    id: 'plan_pro',
    nameKey: pro.nameKey,
    priceKey: pro.priceKey,
    periodKey: pro.periodKey,
    descriptionKey: pro.descriptionKey,
    featureKeys: [pro.featureKeys[0], pro.featureKeys[1], pro.featureKeys[2]],
    featured: true,
  },
  {
    id: 'plan_team',
    nameKey: team.nameKey,
    priceKey: team.priceKey,
    periodKey: team.periodKey,
    descriptionKey: team.descriptionKey,
    featureKeys: [team.featureKeys[0], team.featureKeys[1], team.featureKeys[2]],
  },
];

/** Resolve feature keys for a plan (team omits unused index slots). */
export function planFeatureKeys(plan: Plan): readonly string[] {
  return plan.featureKeys;
}
