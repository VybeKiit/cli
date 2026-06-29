import { PRODUCT_STACK_MARKS } from '@/data/landing';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';

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
      <span
        className="tech-logo inline-flex items-center gap-3"
        style={{ ['--brand-color' as string]: hoverColor }}
      >
        <span className="relative inline-flex h-[22px] w-[22px] shrink-0">
          <LogoMarkIcon
            className="tech-logo-icon absolute inset-0 h-[22px] w-[22px] opacity-100 transition-opacity group-hover:opacity-0"
            slug={slug}
          />
          <LogoMarkIcon
            className="tech-logo-icon absolute inset-0 h-[22px] w-[22px] opacity-0 transition-opacity group-hover:opacity-100"
            slug={slug}
            variant="3d"
          />
        </span>
        <span className="tech-logo-label">{label}</span>
      </span>
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
