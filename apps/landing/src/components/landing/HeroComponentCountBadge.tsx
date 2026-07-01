import { COMPONENT_CATALOG_COUNT } from '@/data/componentShowcase';

/** Dynamic badge showing total mirrored UI building blocks. */
export function HeroComponentCountBadge() {
  return (
    <p className="landing-label mt-6 text-[var(--text-muted)]">
      <span className="text-white">{COMPONENT_CATALOG_COUNT}+</span> building blocks mirrored for
      agents
    </p>
  );
}
