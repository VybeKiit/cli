import Link from 'next/link';
import { AgentSessionDemo } from '@/components/sections/AgentSessionDemo';
import { Button } from '@/components/ui/button';
import { HERO } from '@/data/pillars';
import { DEMO_VIDEO_EMBED_URL, PRICE, TRUST_BADGES } from '@/data/site';

/**
 * Hero — Terminal-to-Live layout (landing-direction #1). Headline + CTA on the
 * left; animated agent session on the right. Makes the agent-as-operator frame
 * instantly legible without looking like generic SaaS.
 */
export const Hero = () => (
  <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
    <div className="flex flex-col items-start gap-6">
      <p className="font-mono text-primary/80 text-xs uppercase tracking-widest">
        agent-as-operator
      </p>
      <h1 className="text-balance font-bold text-5xl tracking-tight">{HERO.headline}</h1>
      <p className="text-balance text-lg text-muted-foreground">{HERO.subhead}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild={true} size="lg">
          <Link href="/checkout">
            {HERO.ctaLabel} — {PRICE.display}
          </Link>
        </Button>
        <Button asChild={true} size="lg" variant="outline">
          <Link href="#compare">{HERO.secondaryCtaLabel}</Link>
        </Button>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground text-sm">
        {TRUST_BADGES.map((badge) => (
          <li key={badge} className="flex items-center gap-1.5">
            <span aria-hidden={true} className="text-foreground">
              ✓
            </span>
            {badge}
          </li>
        ))}
      </ul>
    </div>
    {DEMO_VIDEO_EMBED_URL ? (
      <div className="aspect-video w-full overflow-hidden rounded-xl border shadow-sm">
        <iframe
          title="VybeKiit demo — pay to live in one session"
          src={DEMO_VIDEO_EMBED_URL}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen={true}
        />
      </div>
    ) : (
      <AgentSessionDemo />
    )}
  </section>
);
