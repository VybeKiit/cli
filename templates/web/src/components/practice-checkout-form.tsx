'use client';

import { MarketingShell } from '@/components/marketing-shell';
import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { useToast } from '@/hooks/useToast';
import { Link, useRouter } from '@/i18n/navigation';
import { PLANS } from '@/lib/plans';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

interface PracticeCheckoutFormProps {
  readonly productId: string | undefined;
}

/**
 * Render the local practice checkout form.
 *
 * @param props - Product id read from the URL query string on the server page.
 * @returns A practice checkout confirmation screen.
 * @example
 * <PracticeCheckoutForm productId="plan_pro" />
 */
export const PracticeCheckoutForm = ({ productId }: PracticeCheckoutFormProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const trimmedProductId = productId === undefined ? '' : productId.trim();
  const plan = trimmedProductId ? PLANS.find((entry) => entry.id === trimmedProductId) : undefined;
  const missingProduct = trimmedProductId.length === 0;
  const unknownProduct = trimmedProductId.length > 0 && !plan;

  const handleComplete = useCallback(async () => {
    if (!plan) {
      return;
    }
    setPending(true);
    setError('');
    const response = await fetch('/api/checkout/practice/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: plan.id }),
    });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error === undefined ? t('common.error.checkoutFailed') : body.error);
      return;
    }
    toast(t('pricing.checkout.successToast'));
    router.push('/pricing?checkout=success');
  }, [plan, router, t, toast]);

  return (
    <MarketingShell>
      <section className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-24">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary">{t('pricing.checkout.badge')}</Badge>
          <h1 className="font-bold text-3xl tracking-tight">{t('pricing.checkout.title')}</h1>
          <p className="text-muted-foreground text-sm">{t('pricing.checkout.description')}</p>
        </div>
        {missingProduct ? (
          <Alert variant="destructive">
            <AlertDescription>{t('pricing.checkout.missingProductId')}</AlertDescription>
          </Alert>
        ) : null}
        {unknownProduct ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t('pricing.checkout.unknownProductId', { planId: trimmedProductId })}
            </AlertDescription>
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {plan ? (
          <Card>
            <CardHeader>
              <CardTitle>{t(plan.nameKey)}</CardTitle>
              <CardDescription>{t(plan.descriptionKey)}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>
                <span className="font-bold text-2xl">{t(plan.priceKey)}</span>
                <span className="text-muted-foreground text-sm">{t(plan.periodKey)}</span>
              </p>
              <Button
                data-testid="practice-checkout-complete"
                data-ready={mounted ? 'true' : 'false'}
                disabled={!mounted || pending}
                onClick={handleComplete}
              >
                {pending ? t('pricing.checkout.completing') : t('pricing.checkout.complete')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button asChild={true} variant="outline">
            <Link href="/pricing">{t('pricing.checkout.backToPricing')}</Link>
          </Button>
        )}
      </section>
    </MarketingShell>
  );
};
