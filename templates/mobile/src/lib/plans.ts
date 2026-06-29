/** Pricing plan with message-catalog keys (mirrors web `plans.ts`). */
export interface Plan {
  readonly id: string;
  readonly nameKey: string;
  readonly priceKey: string;
  readonly periodKey: string;
  readonly descriptionKey: string;
  readonly featureKeys: readonly string[];
  readonly featured?: boolean;
}

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
