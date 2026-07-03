/**
 * Platform partner / referral programs — the infra a VybeKiit buyer deploys ON
 * (Supabase, Vercel, Railway, Stripe, GoDaddy). This is a DIFFERENT slot from the
 * agent-upgrade links in `./affiliate` (Cursor/Claude/Codex): those upgrade the tool
 * the vibe coder chats with; these are the vendor programs the product itself rides on.
 *
 * SSOT for the referral codes/links so the deploy skills and marketing surfaces embed
 * one canonical value. `status: 'pending-application'` means we have not been accepted
 * yet, so there is no live referral link to embed — never fabricate one.
 */

export type PartnerId = 'railway' | 'vercel' | 'supabase' | 'stripe' | 'godaddy';

export type PartnerKind = 'referral' | 'affiliate' | 'partner';

export type PartnerStatus = 'active' | 'pending-application';

export interface PartnerProgram {
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
}

/**
 * The programs, keyed by id. Only Railway is live today (a personal referral code);
 * the rest are applications we submit — kept here so the moment one is accepted we
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

/**
 * The live referral URL for a partner, or `null` when the program is still pending
 * (no code to embed yet). Railway is the only live one today.
 */
export function resolvePartnerReferralUrl(id: PartnerId): string | null {
  const program = PARTNER_PROGRAMS[id];
  if (program.status !== 'active' || !program.code) {
    return null;
  }
  switch (id) {
    case 'railway': {
      const url = new URL('https://railway.com');
      url.searchParams.set('referralCode', program.code);
      return url.toString();
    }
    default:
      return null;
  }
}

/** Programs that are live (have a code we can share right now). */
export function activePartnerPrograms(): readonly PartnerProgram[] {
  return Object.values(PARTNER_PROGRAMS).filter((p) => p.status === 'active');
}
