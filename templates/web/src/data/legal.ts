/**
 * Legal section keys for Terms and Privacy pages.
 *
 * Copy lives in `messages/en.json`; pages resolve headings and bodies with `t()`.
 */

/** One numbered section on a legal page. */
export interface LegalSection {
  readonly headingKey: string;
  readonly bodyKey: string;
}

/** Terms of Service sections, in display order. */
export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    headingKey: 'legal.terms.sections.agreement.heading',
    bodyKey: 'legal.terms.sections.agreement.body',
  },
  {
    headingKey: 'legal.terms.sections.using.heading',
    bodyKey: 'legal.terms.sections.using.body',
  },
  {
    headingKey: 'legal.terms.sections.payments.heading',
    bodyKey: 'legal.terms.sections.payments.body',
  },
  {
    headingKey: 'legal.terms.sections.liability.heading',
    bodyKey: 'legal.terms.sections.liability.body',
  },
  {
    headingKey: 'legal.terms.sections.contact.heading',
    bodyKey: 'legal.terms.sections.contact.body',
  },
];

/** Privacy Policy sections, in display order. */
export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    headingKey: 'legal.privacy.sections.collect.heading',
    bodyKey: 'legal.privacy.sections.collect.body',
  },
  {
    headingKey: 'legal.privacy.sections.use.heading',
    bodyKey: 'legal.privacy.sections.use.body',
  },
  {
    headingKey: 'legal.privacy.sections.sharing.heading',
    bodyKey: 'legal.privacy.sections.sharing.body',
  },
  {
    headingKey: 'legal.privacy.sections.choices.heading',
    bodyKey: 'legal.privacy.sections.choices.body',
  },
  {
    headingKey: 'legal.privacy.sections.contact.heading',
    bodyKey: 'legal.privacy.sections.contact.body',
  },
];
