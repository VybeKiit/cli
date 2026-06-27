/**
 * The six messaging pillars and the hero copy — the agent-as-operator value
 * props, lifted verbatim from `docs/positioning/differentiation.md` (§5 pillars,
 * §8 one-liners). Data only; the Hero and Pillars sections render it.
 */

/** Hero copy: the headline, subhead, and the primary call-to-action label. */
export const HERO = {
  /** Headline — the inverted "you direct, the agent builds" frame. */
  headline: 'You direct. The agent builds.',
  /** Subhead — the live-in-session-1 keystone that kills refund-regret. */
  subhead:
    'Describe your product in plain language. The agent wires the payments, the database, and the deploy — and you are live and taking payments in your first session.',
  /** Primary CTA label, points at the checkout. */
  ctaLabel: 'Get VybeKiit',
  /** Secondary CTA label, scrolls to the comparison matrix. */
  secondaryCtaLabel: 'Compare the kits',
} as const;

/**
 * One value-prop pillar. `id` is a stable render key (never derive keys from the
 * title, which is display copy that could change).
 */
export interface Pillar {
  /** Stable key for React lists and anchors. */
  readonly id: string;
  /** Headline-ready pillar title. */
  readonly title: string;
  /** One- to two-sentence elaboration. */
  readonly body: string;
}

/** The six pillars, in narrative order (differentiation.md §5). */
export const PILLARS: readonly Pillar[] = [
  {
    id: 'direct',
    title: 'You direct. The agent builds.',
    body: 'The agent makes every technical decision and never speaks jargon. You describe the goal; it does the plumbing.',
  },
  {
    id: 'live-session-one',
    title: 'Live and taking payments in your first session.',
    body: 'The onboarding keystone — your product is real and accepting money before you understand a single line of it.',
  },
  {
    id: 'updates-install',
    title: 'Updates that just install. No merge conflicts, ever.',
    body: 'Maintained logic ships as @vybekiit/* npm packages, so updates are version bumps — not a git merge a non-coder cannot resolve.',
  },
  {
    id: 'one-purchase',
    title: 'One purchase. Web, mobile, and a browser extension.',
    body: 'Shared design tokens keep all three consistent. Competitors sell these as separate products, if at all.',
  },
  {
    id: 'taxes-handled',
    title: 'Taxes handled. Merchant of Record built in.',
    body: 'Lemon Squeezy by default — global VAT and sales tax are not your problem to file.',
  },
  {
    id: 'price-floor',
    title: 'A price floor with the regret removed.',
    body: 'A one-time price and a 14-day refund. The private-repo invite is the gate; a refund revokes access.',
  },
];
