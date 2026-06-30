'use client';

import { BrandMarkVibeHint, BrandMarkVibeHintMobile } from '@/components/landing/BrandMarkVibeHint';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { PRODUCT_STACK_MARKS } from '@/data/landing';

function TechLogoItem({
  label,
  slug,
  hoverColor,
}: {
  label: string;
  slug: string;
  hoverColor: string;
}) {
  return (
    <li className="tech-logo-item group shrink-0">
      <BrandMarkVibeHint mode="tooltip-and-mobile-subtitle" slug={slug}>
        <span
          className="tech-logo inline-flex items-center gap-3"
          style={{ ['--brand-color' as string]: hoverColor }}
        >
          <LogoMarkIcon className="tech-logo-icon h-[22px] w-[22px] shrink-0" slug={slug} />
          <span className="flex flex-col gap-0.5">
            <span className="tech-logo-label">{label}</span>
            <BrandMarkVibeHintMobile slug={slug} />
          </span>
        </span>
      </BrandMarkVibeHint>
    </li>
  );
}

/** Infinite product-stack wordmark row with per-logo hover glow. */
export function TechLogos() {
  return (
    <AutoScrollRow
      ariaLabel="Built with"
      className="testimonials-logos-marquee"
      durationDesktop="58s"
      durationMobile="58s"
    >
      <ul aria-label="Built with" className="testimonials-logos-row">
        {PRODUCT_STACK_MARKS.map((mark) => (
          <TechLogoItem
            hoverColor={mark.hoverColor}
            key={mark.slug}
            label={mark.label}
            slug={mark.slug}
          />
        ))}
      </ul>
    </AutoScrollRow>
  );
}
