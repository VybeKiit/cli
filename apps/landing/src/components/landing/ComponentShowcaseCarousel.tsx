'use client';

import { ComponentPreviewCard } from '@/components/landing/ComponentPreviewCard';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { SHOWCASE_WEB } from '@/data/componentShowcase';

/**
 * Auto-scrolling row of curated SaaS UI mirror previews for the hero.
 *
 * @returns The rendered ComponentShowcaseCarousel element.
 * @example
 * ```tsx
 * <ComponentShowcaseCarousel />
 * ```
 */

export const ComponentShowcaseCarousel = () => (
  <AutoScrollRow
    ariaLabel="UI component showcase"
    className="component-showcase-carousel mt-10"
    durationDesktop="70s"
    durationMobile="50s"
  >
    <ul className="flex gap-4">
      {SHOWCASE_WEB.map((entry) => (
        <li key={`${entry.source}-${entry.name}`}>
          <ComponentPreviewCard entry={entry} />
        </li>
      ))}
    </ul>
  </AutoScrollRow>
);
