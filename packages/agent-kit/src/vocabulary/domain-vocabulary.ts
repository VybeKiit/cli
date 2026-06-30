/**
 * Shared domain vocabulary for payments/tax and service-name bans.
 *
 * Templates paste {@link renderPaymentsVocabularyTable} and
 * {@link renderServiceNameBanList} into `language.md` so web/mobile/extension stay in sync.
 */

export interface DomainVocabularyEntry {
  readonly jargon: string;
  readonly say: string;
  readonly why?: string;
}

/** Payment and tax terms the builder must never hear raw. */
export const PAYMENTS_VOCABULARY: readonly DomainVocabularyEntry[] = [
  {
    jargon: 'Merchant of Record / MoR',
    say: 'the service that handles tax for you',
    why: 'LS is default because it removes VAT/sales-tax fear',
  },
  {
    jargon: 'VAT / sales tax',
    say: 'tax on sales (handled for you when MoR is on)',
  },
  {
    jargon: 'variant / product id',
    say: "the product's ID in the payment dashboard (agent handles)",
  },
  {
    jargon: 'subscription',
    say: 'recurring charge',
  },
  {
    jargon: 'refund / chargeback',
    say: 'money returned / disputed charge',
  },
];

/** Extra service names to never speak (extends the core ban list in each template). */
export const EXTENDED_SERVICE_NAME_BANS: readonly string[] = [
  'Vercel',
  'Wrangler',
  'Lemon Squeezy',
  'Stripe',
  'PayPal',
  'Better Auth',
  'Resend',
  'GitHub',
];

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/** Render {@link PAYMENTS_VOCABULARY} as a markdown table for `language.md`. */
export function renderPaymentsVocabularyTable(): string {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = PAYMENTS_VOCABULARY.map(
    (entry) =>
      `| ${escapeCell(entry.jargon)} | ${escapeCell(entry.say)} | ${escapeCell(entry.why ?? '')} |`,
  );
  return [header, divider, ...rows].join('\n');
}

/** Bullet list of extra banned service names for the "Service names" section. */
export function renderServiceNameBanList(existingBans: readonly string[]): string {
  const combined = [...new Set([...existingBans, ...EXTENDED_SERVICE_NAME_BANS])];
  return combined.map((name) => `- Never say **${name}**`).join('\n');
}
