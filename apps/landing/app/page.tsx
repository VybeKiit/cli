import { MarketingShell } from '@/components/marketing-shell';
import { Comparison } from '@/components/sections/comparison';
import { Faq } from '@/components/sections/faq';
import { Hero } from '@/components/sections/hero';
import { Pillars } from '@/components/sections/pillars';
import { Pricing } from '@/components/sections/pricing';

/**
 * The VybeKiit store home page — the marketing site that dogfoods `templates/web`.
 * Composed from data-driven sections (each owns its copy in `src/data/*`): hero →
 * pillars → comparison → pricing → FAQ, inside the shared marketing shell.
 */
export default function HomePage() {
  return (
    <MarketingShell>
      <Hero />
      <Pillars />
      <Comparison />
      <Pricing />
      <Faq />
    </MarketingShell>
  );
}
