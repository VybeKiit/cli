/**
 * Legal copy for the Terms and Privacy pages, as data the page renders via `.map`.
 *
 * Why it lives here: the agent (and the builder) edit one array of sections instead
 * of hand-editing JSX on each page. The copy is a plain-language *skeleton* with
 * placeholders ([Your Product], [Your Company], [your-email@example.com]) the agent
 * fills from the builder's details — a human should review before launch (this is
 * not legal advice). The page keeps the date + intro markers; only the sections move
 * here.
 */

/**
 * One numbered section on a legal page: a heading and a paragraph of body copy.
 * `heading` already includes its number (e.g. "1. Agreement to terms") so the page
 * renders it verbatim.
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
    heading: '1. Agreement to terms',
    body: 'By using [Your Product], you agree to these terms. If you do not agree, please do not use the service.',
  },
  {
    heading: '2. Using the service',
    body: 'You may use [Your Product] only as permitted by law and these terms. You are responsible for the activity in your account and for keeping your sign-in details secure.',
  },
  {
    heading: '3. Payments',
    body: 'Paid plans are billed in advance and are non-refundable except where required by law or stated otherwise. Prices may change with notice.',
  },
  {
    heading: '4. Liability',
    body: 'The service is provided "as is" without warranties. To the extent permitted by law, [Your Company] is not liable for indirect or incidental damages arising from your use.',
  },
  {
    heading: '5. Contact',
    body: 'Questions about these terms? Email [your-email@example.com].',
  },
];

/** Privacy Policy sections, in display order. */
export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    heading: '1. What we collect',
    body: 'We collect the information you give us (such as your email when you sign up) and basic usage data needed to run [Your Product].',
  },
  {
    heading: '2. How we use it',
    body: 'We use your information to provide the service, process payments, and keep your account secure. We do not sell your personal data.',
  },
  {
    heading: '3. Sharing',
    body: 'We share data only with the providers that run the service (for example, hosting, database, and payments) and only as needed to operate [Your Product].',
  },
  {
    heading: '4. Your choices',
    body: 'You can ask us to access or delete your information at any time by contacting us.',
  },
  {
    heading: '5. Contact',
    body: 'Questions about your privacy? Email [your-email@example.com].',
  },
];
