'use client';

import { MarketingShell } from '@/components/marketing-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startCheckout } from '@/lib/billing-client';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * Pricing page — three starter tiers wired to the kit's checkout. The loading and
 * error states are fully built; buying is a marked stub until the `setup-payments`
 * skill connects a provider.
 */
export default function PricingPage() {
  const [pendingId, setPendingId] = useState('');
  const [error, setError] = useState('');

  async function handleSelect(planId: string) {
    setError('');
    setPendingId(planId);
    const result = await startCheckout(planId);
    if (!result.ok) {
      setError(result.error.message);
      setPendingId('');
      return;
    }
    // TODO(vybekiit): the wired skill sends the buyer to checkout — skill: setup-payments
    window.location.href = result.value.url;
  }

  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-24">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-bold text-4xl tracking-tight">Simple pricing</h1>
          <p className="text-muted-foreground">Start free. Upgrade when you grow.</p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={cn(plan.featured && 'border-primary')}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2">
                  <span className="font-bold text-3xl">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? 'default' : 'outline'}
                  disabled={pendingId === plan.id}
                  onClick={() => handleSelect(plan.id)}
                >
                  {pendingId === plan.id ? 'Starting...' : 'Choose plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
