'use client';

import { ComponentPreviewCard } from '@/components/landing/ComponentPreviewCard';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { SHOWCASE_WEB } from '@/data/component-showcase';

/** Auto-scrolling row of curated SaaS UI mirror previews for the hero. */
export function ComponentShowcaseCarousel() {
  return (
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
}
