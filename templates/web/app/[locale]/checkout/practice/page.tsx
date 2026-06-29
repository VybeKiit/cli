'use client';

import { MarketingShell } from '@/components/marketing-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from '@/i18n/navigation';
import { PLANS } from '@/lib/plans';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * Practice checkout — simulates a hosted payment page when no provider keys are
 * set. Completes fulfillment locally and returns to pricing with a success toast.
 */
export default function PracticeCheckoutPage() {
  const [productId, setProductId] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setProductId(new URLSearchParams(window.location.search).get('productId') ?? '');
  }, []);

  async function handleComplete() {
    setPending(true);
    setError('');
    const response = await fetch('/api/checkout/practice/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? t('common.error.checkoutFailed'));
      return;
    }
    toast(t('pricing.checkout.successToast'));
    router.push('/pricing?checkout=success');
  }

  const plan = PLANS.find((entry) => entry.id === productId);

  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-24">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary">{t('pricing.checkout.badge')}</Badge>
          <h1 className="font-bold text-3xl tracking-tight">{t('pricing.checkout.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('pricing.checkout.description')}</p>
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>{plan ? t(plan.nameKey) : t('pricing.checkout.fallbackPlanName')}</CardTitle>
            <CardDescription>{plan ? t(plan.descriptionKey) : productId}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {plan ? (
              <p>
                <span className="font-bold text-2xl">{t(plan.priceKey)}</span>
                <span className="text-muted-foreground text-sm">{t(plan.periodKey)}</span>
              </p>
            ) : null}
            <Button disabled={pending || !productId} onClick={handleComplete}>
              {pending ? t('pricing.checkout.completing') : t('pricing.checkout.complete')}
            </Button>
          </CardContent>
        </Card>
      </section>
    </MarketingShell>
  );
}
