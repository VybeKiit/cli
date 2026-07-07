/**
 * Landing-page inspiration variants — art direction from
 * `docs/positioning/landing-direction.md`. Each entry is a full-page layout
 * preview at `/inspirations/[slug]`, not the production home.
 */

export interface InspirationDirection {
  readonly slug: string;
  readonly name: string;
  readonly vibe: string;
  readonly headline: string;
  readonly subhead: string;
  readonly cta: string;
  readonly palette: {
    readonly bg: string;
    readonly fg: string;
    readonly accent: string;
    readonly muted: string;
  };
  readonly recommended?: boolean;
}

/** All ten vibe directions, keyed by URL slug. */
export const INSPIRATION_DIRECTIONS: readonly InspirationDirection[] = [
  {
    slug: 'terminal-to-live',
    name: 'Terminal-to-Live',
    vibe: 'Dark IDE aesthetic — plain-English instructions, not code',
    headline: 'You direct. The agent builds.',
    subhead: 'Describe your product. It ships — live and taking payments — in your first session.',
    cta: 'Get VybeKiit — $29',
    palette: { bg: '#0B0E14', fg: '#E8EAED', accent: '#3DDC84', muted: '#6B7280' },
  },
  {
    slug: 'split-screen',
    name: 'Them vs Us',
    vibe: 'Two-column — merge conflict chaos vs calm agent chat',
    headline: 'Boilerplates give developers a head start.',
    subhead: 'VybeKiit gives everyone else a finished product.',
    cta: 'Skip the conflicts — $29',
    palette: { bg: '#FAFAFA', fg: '#111827', accent: '#6366F1', muted: '#9CA3AF' },
  },
  {
    slug: 'three-platform',
    name: 'Three-Platform Bundle',
    vibe: 'Apple-keynote calm — laptop, phone, extension unified',
    headline: 'One purchase. Web, mobile, and a browser extension.',
    subhead: 'One agent. Zero plumbing.',
    cta: 'One price — $29',
    palette: { bg: '#F5F3FF', fg: '#1E1B4B', accent: '#7C3AED', muted: '#64748B' },
  },
  {
    slug: 'receipt-mor',
    name: 'Receipt / Taxes Handled',
    vibe: 'Playful finance — receipt + passport stamp VAT handled',
    headline: 'Taxes handled. Merchant of Record built in.',
    subhead: 'Sell worldwide. Never file a VAT form.',
    cta: 'Sell globally — $29',
    palette: { bg: '#F0FDF4', fg: '#14532D', accent: '#16A34A', muted: '#4ADE80' },
  },
  {
    slug: 'directors-chair',
    name: "Director's Chair",
    vibe: 'Cinematic studio — you direct, the agent is the crew',
    headline: "You're the director. The agent is the whole crew.",
    subhead: 'Describe the scene. It ships the product.',
    cta: 'Action — $29',
    palette: { bg: '#0A0A0A', fg: '#FAFAFA', accent: '#D4AF37', muted: '#737373' },
    recommended: true,
  },
  {
    slug: 'checklist',
    name: 'Verify Before Advance',
    vibe: 'Linear-minimal vertical checklist — trust through rigor',
    headline: 'It checks every step worked — so you never get silently stuck.',
    subhead: 'Account → payments → deploy → live. Each step verified.',
    cta: 'Start verified — $29',
    palette: { bg: '#FFFFFF', fg: '#0A0A0A', accent: '#22C55E', muted: '#71717A' },
    recommended: true,
  },
  {
    slug: 'vibe-coder',
    name: 'Vibe-Coder Native',
    vibe: 'Warm creator desk — friendly, not enterprise',
    headline: "You can describe it. That's enough.",
    subhead: 'Built for vibe coders with a Claude or Codex subscription.',
    cta: 'Describe your app — $29',
    palette: { bg: '#FFF7ED', fg: '#431407', accent: '#9333EA', muted: '#FB923C' },
  },
  {
    slug: 'before-after',
    name: 'Before / After',
    vibe: 'Draggable time-to-live — idea to paying app',
    headline: 'Live and taking payments in your first session.',
    subhead: 'Day 1: an idea. Session 1: a live, paying app.',
    cta: 'See the after — $29',
    palette: { bg: '#F8FAFC', fg: '#0F172A', accent: '#F97316', muted: '#94A3B8' },
    recommended: true,
  },
  {
    slug: 'quiet-stack',
    name: 'The Quiet Stack',
    vibe: 'Blueprint adapters — complexity hidden behind one toggle',
    headline: 'All the plumbing. None of the plumbing.',
    subhead: 'Payments, auth, data, hosting — the agent picks. You never see it.',
    cta: 'Hide the stack — $29',
    palette: { bg: '#EFF6FF', fg: '#1E3A5F', accent: '#2563EB', muted: '#64748B' },
  },
  {
    slug: 'bold-statement',
    name: 'Bold Anti-Boilerplate',
    vibe: 'Huge typographic poster — scroll-stopping, GEO-quotable',
    headline: 'The SaaS kit that ships itself.',
    subhead: '$29. Refundable for 14 days. Cancel the regret.',
    cta: 'Get VybeKiit — $29',
    palette: { bg: '#000000', fg: '#FFFFFF', accent: '#39FF14', muted: '#525252' },
  },
];

export const getInspirationBySlug = (slug: string): InspirationDirection | undefined =>
  INSPIRATION_DIRECTIONS.find((d) => d.slug === slug);
