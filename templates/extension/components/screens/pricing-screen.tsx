import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAsync } from '@/hooks/use-async';
import { startCheckout } from '@/lib/billing-client';
import { t } from '@/lib/i18n';
import { PLANS } from '@/lib/plans';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function PricingScreen() {
  const [pendingId, setPendingId] = useState('');
  const { error, run: checkout } = useAsync(startCheckout);

  async function handleSelect(planId: string) {
    setPendingId(planId);
    const result = await checkout(planId);
    if (!result.ok) {
      setPendingId('');
      return;
    }
    window.open(result.value.url, '_blank', 'noopener,noreferrer');
    setPendingId('');
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <Badge variant="outline" className="self-center">
          {t('pricing_badge')}
        </Badge>
        <h1 className="font-bold text-xl tracking-tight sm:text-2xl">{t('pricing_title')}</h1>
        <p className="text-muted-foreground text-sm">{t('pricing_subtitle')}</p>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 min-[640px]:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={cn(plan.featured && 'border-primary')}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{t(plan.nameKey)}</CardTitle>
                {plan.featured ? <Badge>{t('pricing_popularBadge')}</Badge> : null}
              </div>
              <CardDescription className="text-xs">{t(plan.descriptionKey)}</CardDescription>
              <p className="pt-1">
                <span className="font-bold text-2xl">{t(plan.priceKey)}</span>
                <span className="text-muted-foreground text-xs">{t(plan.periodKey)}</span>
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <ul className="flex flex-col gap-1 text-xs">
                {plan.featureKeys.map((featureKey) => (
                  <li key={featureKey}>{t(featureKey)}</li>
                ))}
              </ul>
              <Button
                type="button"
                variant={plan.featured ? 'default' : 'outline'}
                disabled={pendingId === plan.id}
                onClick={() => handleSelect(plan.id)}
              >
                {pendingId === plan.id ? t('pricing_starting') : t('pricing_choosePlan')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
