/**
 * Legal copy for the store's Terms and Privacy pages, as data the pages render via
 * `.map`. This is the VybeKiit store's own copy (a one-time $29 kit sold through
 * Lemon Squeezy as Merchant of Record, with a 14-day refund and a private-repo
 * invite), not the buyer-template placeholders. Plain-language skeleton — a human
 * should review before any real launch; this is not legal advice.
 */

/**
 * One numbered section on a legal page: a heading (with its leading number) and a
 * paragraph of body copy. The page renders the heading verbatim.
 */
export interface LegalSection {
  /** Section heading, including its leading number. */
  readonly heading: string;
  /** Plain-language paragraph shown under the heading. */
  readonly body: string;
}

/** Terms of Service sections, in display order. */
export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    heading: '1. What you are buying',
    body: 'VybeKiit is a one-time purchase that grants access to the private template repositories and the maintained @vybekiit/* packages, plus the agent layer that operates the build. Access is granted by inviting the GitHub account you provide at checkout.',
  },
  {
    heading: '2. Payments and Merchant of Record',
    body: 'Payments are processed by Lemon Squeezy, which acts as the Merchant of Record and handles applicable sales tax and VAT. Your purchase is a single charge, not a subscription.',
  },
  {
    heading: '3. Refunds',
    body: 'Purchases are refundable within 14 days. Requesting a refund revokes the GitHub access granted by your purchase.',
  },
  {
    heading: '4. Acceptable use',
    body: 'The templates and packages are licensed for building your own products. You may not resell or redistribute the proprietary template source or the agent layer as your own kit.',
  },
  {
    heading: '5. Liability',
    body: 'The product is provided "as is" without warranties. To the extent permitted by law, VybeKiit is not liable for indirect or incidental damages arising from your use of it.',
  },
];

/** Privacy Policy sections, in display order. */
export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    heading: '1. What we collect',
    body: 'At checkout we collect your email and the GitHub username you ask us to grant access to. Payment details are handled by Lemon Squeezy; we never see your card information.',
  },
  {
    heading: '2. How we use it',
    body: 'We use your GitHub username to invite (and, on refund, remove) your account from the private repositories, and your email to send the invite and purchase receipts.',
  },
  {
    heading: '3. Sharing',
    body: 'We share data only with the providers that run the store — Lemon Squeezy for payments and GitHub for repository access — and only as needed to deliver your purchase.',
  },
  {
    heading: '4. Your choices',
    body: 'You can ask us to access or delete your information at any time by contacting us.',
  },
];
