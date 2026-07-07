import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAsync } from '@/hooks/useAsync';
import { displayError, useTranslations } from '@/hooks/useTranslations';
import { startCheckout } from '@/lib/billingClient';
import { PLANS, type Plan } from '@/lib/plans';
import { useTheme } from '@/theme/useTheme';
import { Either } from 'effect';
import { openURL } from 'expo-linking';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface PricingPlanCardProps {
  readonly plan: Plan;
  readonly pendingId: string;
  readonly onSelect: (planId: string) => Promise<void>;
}

/**
 * Render one selectable mobile pricing plan card.
 *
 * @param props - Plan data, pending checkout id, and select handler.
 * @returns A themed pricing card with checkout action.
 * @example
 * <PricingPlanCard plan={plan} pendingId="" onSelect={selectPlan} />
 */
const PricingPlanCard = ({ plan, pendingId, onSelect }: PricingPlanCardProps) => {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { t } = useTranslations();
  const selectPlan = useCallback(() => {
    void onSelect(plan.id);
  }, [onSelect, plan.id]);

  return (
    <Card style={plan.featured ? { borderColor: colors.primary } : undefined}>
      <CardHeader>
        <CardTitle>{t(plan.nameKey)}</CardTitle>
        <CardDescription>{t(plan.descriptionKey)}</CardDescription>
        <View style={[styles.priceRow, { marginTop: spacing.xs }]}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: fontSizes.xxxl,
              fontWeight: fontWeights.bold,
            }}
          >
            {t(plan.priceKey)}
          </Text>
          <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
            {t(plan.periodKey)}
          </Text>
        </View>
      </CardHeader>
      <CardContent style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.sm }}>
          {plan.featureKeys.map((featureKey) => (
            <Text key={featureKey} style={{ color: colors.foreground, fontSize: fontSizes.sm }}>
              {t(featureKey)}
            </Text>
          ))}
        </View>
        <Button
          title={pendingId === plan.id ? t('pricing.starting') : t('pricing.choosePlan')}
          variant={plan.featured ? 'default' : 'outline'}
          loading={pendingId === plan.id}
          onPress={selectPlan}
        />
      </CardContent>
    </Card>
  );
};

/**
 * Render the mobile pricing screen.
 *
 * @returns React Native pricing screen.
 * @example
 * <PricingScreen />
 */
const PricingScreen = () => {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  const { t } = useTranslations();
  const [pendingId, setPendingId] = useState('');
  const { error, run: checkout } = useAsync(startCheckout);

  const handleSelect = useCallback(
    async (planId: string): Promise<void> => {
      setPendingId(planId);
      const result = await checkout(planId);
      if (Either.isLeft(result)) {
        setPendingId('');
        return;
      }
      await openURL(result.right.url);
      setPendingId('');
    },
    [checkout],
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}
    >
      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Badge variant="outline">{t('pricing.badge')}</Badge>
        <Text
          style={{
            color: colors.foreground,
            fontSize: fontSizes.xxl,
            fontWeight: fontWeights.bold,
          }}
        >
          {t('pricing.title')}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.base }}>
          {t('pricing.subtitle')}
        </Text>
      </View>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription destructive={true}>{displayError(t, error)}</AlertDescription>
        </Alert>
      ) : null}

      <View style={{ gap: spacing.md }}>
        {PLANS.map((plan) => (
          <PricingPlanCard
            key={plan.id}
            plan={plan}
            pendingId={pendingId}
            onSelect={handleSelect}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
});

export default PricingScreen;
