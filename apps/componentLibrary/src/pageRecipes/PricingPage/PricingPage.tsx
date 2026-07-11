'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Card, CardContent, CardHeader } from '@vybekiit/ui/card';
import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { CreditCard, Lock, Minus, Plus, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdCents } from '../shared/formatUsdCents';
import { FeatureCheck } from './FeatureCheck';
import { FlowMoney } from './FlowMoney';
import { FlowSeats } from './FlowSeats';
import { PlanCta } from './PlanCta';

type BillingPeriod = 'monthly' | 'annual';
type PlanId = 'starter' | 'growth' | 'scale';

/** One pricing tier. Prices are integer cents per seat per month to avoid float drift. */
type Plan = {
  readonly id: PlanId;
  readonly name: string;
  readonly tagline: string;
  readonly monthlyPerSeat: number;
  readonly maxSeats: number;
  readonly featured: boolean;
  readonly features: readonly string[];
  /** Lemon Squeezy variant ids the checkout uses — swap these for your real ones. */
  readonly monthlyVariantId: string;
  readonly annualVariantId: string;
};

const ANNUAL_DISCOUNT = 0.2;
const MAX_SEATS = 50;

const PLANS: readonly Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For a solo builder shipping their first product.',
    monthlyPerSeat: 2900,
    maxSeats: 3,
    featured: false,
    features: [
      '1 project workspace',
      'Lemon Squeezy checkout handoff',
      'Order webhook + D1 ledger',
      'Community support',
    ],
    monthlyVariantId: 'variant_starter_monthly',
    annualVariantId: 'variant_starter_annual',
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For a small team that needs seats and analytics.',
    monthlyPerSeat: 7900,
    maxSeats: 10,
    featured: true,
    features: [
      'Everything in Starter',
      'Up to 10 teammates',
      'Analytics + funnel dashboard',
      'Custom domain',
      'Priority email support',
    ],
    monthlyVariantId: 'variant_growth_monthly',
    annualVariantId: 'variant_growth_annual',
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'For a scaling company that needs SSO and an SLA.',
    monthlyPerSeat: 14_900,
    maxSeats: MAX_SEATS,
    featured: false,
    features: [
      'Everything in Growth',
      'SSO + SAML',
      'Audit log + roles',
      '99.9% uptime SLA',
      'Dedicated launch engineer',
    ],
    monthlyVariantId: 'variant_scale_monthly',
    annualVariantId: 'variant_scale_annual',
  },
];

const BILLING_OPTIONS: readonly { readonly id: BillingPeriod; readonly label: string }[] = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'annual', label: 'Annual' },
];

const INCLUDED: readonly { readonly icon: ReactNode; readonly text: string }[] = [
  {
    icon: <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />,
    text: '14-day money-back guarantee',
  },
  {
    icon: <Zap aria-hidden="true" className="h-4 w-4 text-primary" />,
    text: 'Cancel or switch plans anytime',
  },
  {
    icon: <Lock aria-hidden="true" className="h-4 w-4 text-primary" />,
    text: 'Card data never touches your app',
  },
  {
    icon: <CreditCard aria-hidden="true" className="h-4 w-4 text-primary" />,
    text: 'Secure Lemon Squeezy checkout',
  },
];

/** Per-seat monthly-equivalent price for the given billing period (annual is discounted). */
const perSeatCents = (plan: Plan, billing: BillingPeriod): number =>
  billing === 'annual'
    ? Math.round(plan.monthlyPerSeat * (1 - ANNUAL_DISCOUNT))
    : plan.monthlyPerSeat;

/**
 * A production-shaped pricing page: three differentiated tiers with a live billing-period toggle
 * and seat count that recompute every price, a per-plan checkout handoff, and a reachable
 * "Contact sales" state once the seat count passes a tier's limit. Fully interactive with local
 * state — no backend needed to demo it; see the "Plug this into your app" panel for the real
 * `@vybekiit/payments` wiring.
 *
 * @returns The pricing recipe element.
 * @example
 * const element = <PricingPage />;
 */
export const PricingPage = () => {
  const _billingId = useId();
  const seatsLabelId = useId();
  const gridId = useId();
  const summaryId = useId();

  const [billing, setBilling] = useState<BillingPeriod>('monthly');
  const [seats, setSeats] = useState(3);
  const [checkingOut, setCheckingOut] = useState<PlanId | null>(null);

  const startCheckout = (id: PlanId) => {
    setCheckingOut(id);
    // Real app: POST /api/checkout { variantId, quantity: seats } → redirect to the returned url.
    globalThis.setTimeout(() => setCheckingOut(null), 1400);
  };

  const liveSummary = `${billing === 'annual' ? 'Billed annually' : 'Billed monthly'}, ${seats} seat${
    seats === 1 ? '' : 's'
  }. ${PLANS.map((plan) =>
    seats <= plan.maxSeats
      ? `${plan.name} ${formatUsdCents(perSeatCents(plan, billing) * seats)} per month`
      : `${plan.name} contact sales`,
  ).join(', ')}.`;

  return (
    <DemoRecipeFrame defaultTransition="scale" title="Pricing motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-2xl space-y-4">
          <Badge className="w-fit" variant="secondary">
            <Sparkles aria-hidden="true" className="h-3 w-3" /> Pricing
          </Badge>
          <h1 className="font-bold text-4xl tracking-tight md:text-5xl">
            Pick the plan that fits your launch
          </h1>
          <p className="text-muted-foreground">
            Switch to <span className="font-medium text-foreground">Annual</span> or change the seat
            count and every price updates live. Push seats past a plan's limit to see it flip to
            Contact sales.
          </p>
        </div>

        {/* controls: billing period + seats */}
        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl
            aria-label="Billing period"
            onValueChange={(value) => setBilling(value as BillingPeriod)}
            value={billing}
          >
            {BILLING_OPTIONS.map((option) => (
              <SegmentedControlItem
                className="inline-flex items-center gap-2"
                key={option.id}
                value={option.id}
              >
                {option.label}
                {option.id === 'annual' ? (
                  <Badge className="text-xs" variant="secondary">
                    Save 20%
                  </Badge>
                ) : null}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>

          <div className="flex items-center gap-3">
            <span className="font-medium text-sm" id={seatsLabelId}>
              Seats
            </span>
            <span
              aria-labelledby={seatsLabelId}
              className="flex items-center rounded-md border"
              role="group"
            >
              <button
                aria-label="Decrease seats"
                className="flex h-9 w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                disabled={seats <= 1}
                onClick={() => setSeats((current) => Math.max(1, current - 1))}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="inline-flex w-10 justify-center text-sm">
                <FlowSeats value={seats} />
              </span>
              <button
                aria-label="Increase seats"
                className="flex h-9 w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                disabled={seats >= MAX_SEATS}
                onClick={() => setSeats((current) => Math.min(MAX_SEATS, current + 1))}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </span>
          </div>
        </div>

        {/* one screen-reader announcement covers every price change */}
        <p aria-live="polite" className="sr-only" id={summaryId}>
          {liveSummary}
        </p>

        {/* plan grid */}
        <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const available = seats <= plan.maxSeats;
            const perSeat = perSeatCents(plan, billing);
            const total = perSeat * seats;
            const nameId = `${gridId}-${plan.id}`;
            return (
              <Card
                aria-labelledby={nameId}
                className={cn(
                  'relative flex flex-col',
                  plan.featured && 'border-primary shadow-lg lg:scale-[1.02]',
                )}
                key={plan.id}
              >
                {plan.featured ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
                ) : null}
                <CardHeader>
                  <h2 className="font-semibold text-lg" id={nameId}>
                    {plan.name}
                  </h2>
                  <p className="text-muted-foreground text-sm">{plan.tagline}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="flex items-baseline gap-1">
                    <FlowMoney cents={perSeat} className="font-bold text-4xl tracking-tight" />
                    <span className="text-muted-foreground text-sm">/seat/mo</span>
                  </p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    <FlowMoney cents={total} />
                    /mo for <FlowSeats className="inline-block" value={seats} /> seat
                    {seats === 1 ? '' : 's'}
                    {billing === 'annual' ? (
                      <>
                        {' · billed '}
                        <FlowMoney cents={total * 12} />
                        /yr
                      </>
                    ) : null}
                  </p>

                  <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                    {plan.features.map((feature, featureIndex) => (
                      <li className="flex items-start gap-2" key={feature}>
                        <FeatureCheck index={featureIndex} popKey={`${plan.id}-${billing}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <PlanCta
                      available={available}
                      featured={plan.featured}
                      loading={checkingOut === plan.id}
                      maxSeats={plan.maxSeats}
                      onStart={() => startCheckout(plan.id)}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* shared guarantees */}
        <div className="mt-10 rounded-xl border bg-muted/20 p-5">
          <p className="font-medium text-sm">Every plan includes</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map((item) => (
              <p className="flex items-start gap-2 text-muted-foreground text-sm" key={item.text}>
                <span className="mt-0.5">{item.icon}</span>
                <span>{item.text}</span>
              </p>
            ))}
          </div>
        </div>

        {/* real integration contract */}
        <DemoPlugInPanel>
          <p>
            Fully interactive with local state — the billing toggle and seat count recompute every
            price live. To take real subscriptions in your VybeKiit app:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Replace <code>PLANS</code> with your tiers — each needs a monthly and an annual Lemon
              Squeezy <code>variantId</code> from <code>@vybekiit/payments</code>.
            </li>
            <li>
              On <b>Start checkout</b>, <code>POST /api/checkout</code> with{' '}
              <code>{'{ variantId, quantity: seats }'}</code> (pick the monthly or annual variant
              from the toggle) → it returns <code>{'{ url }'}</code>; redirect the buyer there.
            </li>
            <li>
              The shipped webhook at <code>app/api/webhook/route.ts</code> records the order in D1
              and runs the GitHub gate — the same pipeline as the checkout recipe.
            </li>
            <li>
              Gate seat-based access with the order <code>quantity</code>; a tier shows{' '}
              <b>Contact sales</b> once the seat count passes its <code>maxSeats</code>.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
