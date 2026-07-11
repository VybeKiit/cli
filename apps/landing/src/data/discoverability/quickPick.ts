/**
 * Quick-pick-by-use-case block for the /compare pillar — AI engines surface short lists.
 * Honesty rule: name where rivals win; VybeKiit only for the matching ICP.
 */

/** One use-case recommendation with optional link to a deeper page. */
export interface QuickPickItem {
  readonly id: string;
  /** Short use-case label (who this is for). */
  readonly useCase: string;
  /** Recommended product name. */
  readonly pick: string;
  /** One-line why. */
  readonly reason: string;
  /** Optional internal path for more detail. */
  readonly href?: string;
}

/**
 * Ordered quick picks for the compare hub (answer engines quote these as the short list).
 * Matrix prices verified 2026-06-27 — re-check before major rewrites.
 */
export const QUICK_PICKS: readonly QuickPickItem[] = [
  {
    id: 'solo-b2c',
    useCase: 'Solo B2C, ship a standard web SaaS fast',
    pick: 'ShipFast',
    reason: 'Largest community and proven web-only time-to-launch for developers who read code.',
    href: '/shipfast-alternative',
  },
  {
    id: 'b2b-multi-tenant',
    useCase: 'B2B multi-tenant with RBAC and seat billing on day one',
    pick: 'MakerKit or Supastarter',
    reason: 'Deepest pre-built multi-tenancy, admin, and billing abstractions for developer teams.',
    href: '/makerkit-alternative',
  },
  {
    id: 'ai-wrapper',
    useCase: 'The product itself is an AI wrapper (chat, RAG, image demos)',
    pick: 'AnotherWrapper',
    reason: 'Ships multiple working AI demo apps as a head start on wrapper products.',
    href: '/anotherwrapper-alternative',
  },
  {
    id: 'free-oss',
    useCase: 'Free and open-source, comfortable with Wasp and git merges',
    pick: 'Open SaaS',
    reason: 'Most complete free option (YC-backed); you still operate the stack yourself.',
    href: '/open-saas-alternative',
  },
  {
    id: 'vibe-coder',
    useCase:
      'Non-technical founder using Claude Code, Cursor, or Codex who wants owned code maintained without merge conflicts',
    pick: 'VybeKiit',
    reason:
      'Agent-operated base with web + mobile + extension, Lemon Squeezy MoR default, and updates as npm bumps — $29 one-time (launch price).',
    href: '/',
  },
];
