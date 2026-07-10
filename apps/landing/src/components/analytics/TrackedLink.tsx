'use client';

import Link from 'next/link';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { trackClient } from '@/lib/analyticsClient';
import { AnalyticsEvent, type AnalyticsEventName, type CtaLocation } from '@/lib/analyticsEvents';

type LinkProps = ComponentProps<typeof Link>;

interface TrackedLinkProps extends Omit<LinkProps, 'onClick' | 'children'> {
  readonly children: ReactNode;
  /** Funnel placement for `cta_clicked` / `nav_clicked` / support. */
  readonly location: CtaLocation | 'nav' | 'support_email' | 'support_discord' | 'success_home';
  /** Override default event (`cta_clicked` for CTAs, `nav_clicked` for nav). */
  readonly event?: AnalyticsEventName;
  /** Extra properties merged into the capture payload. */
  readonly trackProperties?: Readonly<Record<string, string | number | boolean | null>>;
  /** Optional click handler composed after the analytics capture. */
  readonly onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const resolveEventForLocation = (
  location: TrackedLinkProps['location'],
  event: AnalyticsEventName | undefined,
): AnalyticsEventName => {
  if (event !== undefined) {
    return event;
  }
  if (location === 'nav') {
    return AnalyticsEvent.navClicked;
  }
  if (location === 'support_email' || location === 'support_discord') {
    return AnalyticsEvent.supportClicked;
  }
  return AnalyticsEvent.ctaClicked;
};

/**
 * Next.js `Link` that captures a store funnel event on click.
 *
 * @param props - Link props plus tracking metadata.
 * @returns Tracked navigation link.
 * @example
 * <TrackedLink href="/checkout" location="hero_primary">Get VybeKiit</TrackedLink>
 */
export const TrackedLink = ({
  children,
  location,
  event,
  trackProperties,
  href,
  onClick,
  ...linkProps
}: TrackedLinkProps) => {
  const resolvedEvent = resolveEventForLocation(location, event);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    const hrefString = typeof href === 'string' ? href : String(href);
    trackClient(resolvedEvent, {
      location,
      href: hrefString,
      ...(trackProperties === undefined ? {} : trackProperties),
    });

    // Same-page anchors (`/#pricing`, `#faq`) should smooth-scroll without a reload.
    if (hrefString.startsWith('/#') || hrefString.startsWith('#')) {
      const id = hrefString.startsWith('/#') ? hrefString.slice(2) : hrefString.slice(1);
      const onHome =
        window.location.pathname === '/' ||
        window.location.pathname === '' ||
        window.location.pathname === '/index';
      if (onHome && id !== '') {
        const target = document.getElementById(id);
        if (target !== null) {
          event.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.replaceState(null, '', `/#${id}`);
        }
      }
    }

    onClick?.(event);
  };

  return (
    <Link href={href} onClick={handleClick} {...linkProps}>
      {children}
    </Link>
  );
};
