/**
 * Platform partner / referral programs - the infra a VybeKiit buyer deploys ON
 * (Supabase, Vercel, Railway, Stripe, GoDaddy). This is a DIFFERENT slot from the
 * agent-upgrade links in `./affiliate` (Cursor/Claude/Codex): those upgrade the tool
 * the vibe coder chats with; these are the vendor programs the product itself rides on.
 *
 * SSOT for the referral codes/links so the deploy skills and marketing surfaces embed
 * one canonical value. `status: 'pending-application'` means we have not been accepted
 * yet, so there is no live referral link to embed - never fabricate one.
 */

/** Partner program ids used by marketing and deploy guidance surfaces. */
export type PartnerId = 'railway' | 'vercel' | 'supabase' | 'stripe' | 'godaddy';

/** Commercial relationship type for a partner program. */
export type PartnerKind = 'referral' | 'affiliate' | 'partner';

/** Whether a partner program has a live shareable code yet. */
export type PartnerStatus = 'active' | 'pending-application';

/** One commercial partner program that VybeKiit can reference. */
export type PartnerProgram = {
  readonly id: PartnerId;
  readonly name: string;
  /** referral = share-a-code cash; affiliate = commission; partner = listing/co-marketing. */
  readonly kind: PartnerKind;
  readonly status: PartnerStatus;
  /** Live referral code, when `status: 'active'`. Absent while an application is pending. */
  readonly code?: string;
  /** What we earn, in plain words. */
  readonly payout?: string;
  /** What the referred buyer gets. */
  readonly perk?: string;
  /** Where we apply / manage the program. */
  readonly programUrl?: string;
};

/**
 * The programs, keyed by id. Only Railway is live today (a personal referral code);
 * the rest are applications we submit - kept here so the moment one is accepted we
 * fill `code` + flip `status` in one place and every surface picks it up.
 */
export const PARTNER_PROGRAMS: Record<PartnerId, PartnerProgram> = {
  railway: {
    id: 'railway',
    name: 'Railway',
    kind: 'referral',
    status: 'active',
    code: 'M6jqdU',
    payout: '15% cash on every paid signup',
    perk: '$20 in credits on signup',
    programUrl: 'https://railway.com/account/referrals',
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel v0',
    kind: 'affiliate',
    status: 'pending-application',
    payout: 'commission per referral',
    programUrl: 'https://v0.dev/affiliate',
  },
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    kind: 'partner',
    status: 'pending-application',
    payout: 'partner directory listing (co-marketing)',
    programUrl: 'https://supabase.com/partners',
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    kind: 'partner',
    status: 'pending-application',
    payout: 'partner program (co-marketing / referrals)',
    programUrl: 'https://stripe.com/partners',
  },
  godaddy: {
    id: 'godaddy',
    name: 'GoDaddy',
    kind: 'affiliate',
    status: 'pending-application',
    payout: 'affiliate commission on referred purchases',
    programUrl: 'https://www.godaddy.com/affiliate-programs',
  },
};

const partnerReferralUrlResolvers: Partial<Record<PartnerId, (code: string) => string>> = {
  railway: (code: string): string => {
    const url = new URL('https://railway.com');
    url.searchParams.set('referralCode', code);
    return url.toString();
  },
};

/**
 * The live referral URL for a partner, or `null` when the program is still pending
 * (no code to embed yet). Railway is the only live one today.
 *
 * @param id - Partner program id to resolve.
 * @returns A live referral URL, or null when the program has no active code.
 * @example
 * const url = resolvePartnerReferralUrl('railway');
 */
export const resolvePartnerReferralUrl = (id: PartnerId): string | null => {
  const program = PARTNER_PROGRAMS[id];
  if (program.status !== 'active' || !program.code) {
    return null;
  }
  const resolveUrl = partnerReferralUrlResolvers[id];
  return resolveUrl === undefined ? null : resolveUrl(program.code);
};

/**
 * List the partner programs that currently have shareable codes.
 *
 * @returns Active partner programs in their display order.
 * @example
 * const programs = activePartnerPrograms();
 */
export const activePartnerPrograms = (): readonly PartnerProgram[] =>
  Object.values(PARTNER_PROGRAMS).filter((p) => p.status === 'active');
