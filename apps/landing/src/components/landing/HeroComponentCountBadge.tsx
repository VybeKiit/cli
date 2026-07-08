import { COMPONENT_CATALOG_COUNT } from '@/data/componentShowcase';

/**
 * Dynamic badge showing total mirrored UI building blocks.
 *
 * @returns The rendered HeroComponentCountBadge element.
 * @example
 * ```tsx
 * <HeroComponentCountBadge />
 * ```
 */

export const HeroComponentCountBadge = () => (
  <p className="landing-label mt-6 text-[var(--text-muted)]">
    <span className="text-white">{COMPONENT_CATALOG_COUNT}+</span> building blocks mirrored for
    agents
  </p>
);
