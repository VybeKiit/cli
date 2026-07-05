'use client';

import { MarketingShell } from '@/components/marketing-shell';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { startCheckout } from '@/lib/billingClient';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/** Show a catalog key or pass through a server error message. */
function displayError(t: ReturnType<typeof useTranslations>, error: string): string {
  try {
    return t(error as 'pricing.errors.pickPlanFirst');
  } catch {
    return error;
  }
}

/**
 * Pricing page — three starter tiers wired to checkout. Practice mode runs a local
 * checkout simulation when no provider keys are set; real hosted checkout replaces
 * it once the `setup-payments` skill wires keys.
 */
export default function PricingPage() {
  const [pendingId, setPendingId] = useState('');
  const { error, run: checkout } = useAsync(startCheckout);
  const { toast } = useToast();
  const t = useTranslations();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      toast(t('pricing.successToast'));
    }
  }, [toast, t]);

  async function handleSelect(planId: string) {
    setPendingId(planId);
    const result = await checkout(planId);
    if (!result.ok) {
      setPendingId('');
      return;
    }
    window.location.href = result.value.url;
  }

  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-24">
        <div className="flex flex-col items-center gap-2 text-center">
          <Badge variant="outline">{t('pricing.badge')}</Badge>
          <h1 className="font-bold text-4xl tracking-tight">{t('pricing.title')}</h1>
          <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{displayError(t, error)}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-6 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={cn(plan.featured && 'border-primary')}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{t(plan.nameKey)}</CardTitle>
                  {plan.featured ? <Badge>{t('pricing.popularBadge')}</Badge> : null}
                </div>
                <CardDescription>{t(plan.descriptionKey)}</CardDescription>
                <p className="pt-2">
                  <span className="font-bold text-3xl">{t(plan.priceKey)}</span>
                  <span className="text-muted-foreground text-sm">{t(plan.periodKey)}</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.featureKeys.map((featureKey) => (
                    <li key={featureKey}>{t(featureKey)}</li>
                  ))}
                </ul>
                <Button
                  variant={plan.featured ? 'default' : 'outline'}
                  disabled={pendingId === plan.id}
                  onClick={() => handleSelect(plan.id)}
                >
                  {pendingId === plan.id ? t('pricing.starting') : t('pricing.choosePlan')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
