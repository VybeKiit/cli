import { Button } from '@/components/ui/button';
import { HERO } from '@/data/pillars';
import { PRICE, TRUST_BADGES } from '@/data/site';
import Link from 'next/link';

/**
 * Hero — headline, subhead, primary CTA, and the risk-reversal trust badges. The
 * through-line (landing-direction.md): make it instantly legible that you describe
 * the product in plain language and the agent ships and maintains it. Logical
 * spacing mirrors under RTL.
 */
export function Hero() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-balance font-bold text-5xl tracking-tight">{HERO.headline}</h1>
      <p className="text-balance text-lg text-muted-foreground">{HERO.subhead}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/checkout">
            {HERO.ctaLabel} — {PRICE.display}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="#compare">{HERO.secondaryCtaLabel}</Link>
        </Button>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground text-sm">
        {TRUST_BADGES.map((badge) => (
          <li key={badge} className="flex items-center gap-1.5">
            <span aria-hidden className="text-foreground">
              ✓
            </span>
            {badge}
          </li>
        ))}
      </ul>
    </section>
  );
}
