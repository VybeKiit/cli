'use client';

import Link from 'next/link';
import { PRICE } from '@/data/site';
import { useLandingLocale } from '@/i18n/LocaleProvider';

/**
 * Product definition for crawlers / screen readers only — not shown in the UI
 * (no strip, no border, no layout gap under the nav).
 *
 * @returns Visually hidden lead block with crawlable compare links.
 * @example
 * <HomeGeoLead />
 */
export const HomeGeoLead = () => {
  const { messages } = useLandingLocale();
  const lead = messages.geoLead;

  return (
    <section aria-label={lead.ariaLabel} className="sr-only">
      <p>
        <strong>{lead.brandStrong}</strong>
        {lead.beforePrice}
        <span>{PRICE.display}</span>
        {lead.afterPrice} <Link href="/compare">{lead.compareLink}</Link>
        {lead.midLinks}
        <Link href="/saas-boilerplate-for-non-technical-founders">{lead.foundersLink}</Link>
        {lead.andWord}
        <Link href="/vibe-coding-saas">{lead.vibeLink}</Link>
        {lead.end}
      </p>
    </section>
  );
};
