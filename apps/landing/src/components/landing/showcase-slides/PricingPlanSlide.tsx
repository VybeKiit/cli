'use client';

import { useCallback } from 'react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PRICE } from '@/data/site';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    price: '$19',
    features: ['Web app', 'Auth', 'Email'],
    highlighted: false,
  },
  {
    name: 'VybeKiit',
    price: PRICE.display,
    features: ['Operator', 'Web + Mobile', 'Extension', 'Lifetime'],
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$79',
    features: ['Everything', 'Priority support', 'Custom domain'],
    highlighted: false,
  },
] as const;

/** Pricing plan showcase slide — demo tiers with confetti on mock CTA. */
export function PricingPlanSlide() {
  const handleConfetti = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const originX = (rect.left + rect.width / 2) / window.innerWidth;
    const originY = (rect.top + rect.height / 2) / window.innerHeight;

    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 28,
        origin: { x: originX, y: originY },
        colors: ['#60a5fa', '#3b82f6', '#34d399', '#fbbf24', '#f8fafc'],
        ticks: 120,
        gravity: 0.9,
        scalar: 0.85,
        zIndex: 9999,
      });
    } catch {
      // Demo-only — ignore load failures
    }
  }, []);

  return (
    <div className="flex h-full flex-col bg-[var(--light-card)] p-3">
      <div className="mb-2 text-center">
        <Badge className="text-[9px]" variant="secondary">
          Demo pricing
        </Badge>
        <p className="mt-1 font-bold text-[var(--light-text)] text-sm">Pick your plan</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5">
        {PLANS.map((plan) => (
          <Card
            className={cn(
              'flex flex-col border-black/8 shadow-sm',
              plan.highlighted && 'border-[var(--blue)]/40 ring-1 ring-[var(--blue)]/20',
            )}
            key={plan.name}
          >
            <CardHeader className="p-2 pb-0">
              <CardTitle className="text-[10px] text-[var(--light-text)]">{plan.name}</CardTitle>
              <p className="font-bold text-[var(--light-text)] text-base">
                <AnimatedNumber value={plan.price} />
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col p-2 pt-1">
              <Separator className="mb-2 bg-black/8" />
              <ul className="flex-1 space-y-1">
                {plan.features.map((feature) => (
                  <li className="text-[8px] text-[var(--light-muted)]" key={feature}>
                    • {feature}
                  </li>
                ))}
              </ul>
              <Button
                className={cn(
                  'mt-2 h-6 w-full text-[8px]',
                  plan.highlighted && 'bg-[var(--blue)] hover:bg-[var(--blue-strong)]',
                )}
                onClick={handleConfetti}
                size="sm"
                tabIndex={-1}
                type="button"
                variant={plan.highlighted ? 'default' : 'outline'}
              >
                {plan.highlighted ? 'Get VybeKiit' : 'Choose plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
