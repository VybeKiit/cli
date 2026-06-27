import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAsync } from '@/hooks/use-async';
import { startCheckout } from '@/lib/billing-client';
import { PLANS } from '@/lib/plans';
import { useTheme } from '@/theme/use-theme';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

/**
 * Pricing screen — the RN parallel of the web pricing page. Three starter tiers
 * wired to the kit's checkout; the loading and error states are fully built, while
 * buying is a marked stub until the `setup-payments` skill connects a provider.
 */
export default function PricingScreen() {
  const { colors, spacing, fontSizes, fontWeights } = useTheme();
  // `pendingId` drives the per-card spinner (which plan is loading); useAsync owns
  // the shared error so a failed checkout reuses the same Alert as the form screens.
  const [pendingId, setPendingId] = useState('');
  const { error, run: checkout } = useAsync(startCheckout);

  async function handleSelect(planId: string) {
    setPendingId(planId);
    const result = await checkout(planId);
    if (!result.ok) {
      setPendingId('');
      return;
    }
    // TODO(vybekiit): the wired skill sends the buyer to checkout — skill: setup-payments
    await Linking.openURL(result.value.url);
    setPendingId('');
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { padding: spacing.lg, gap: spacing.lg }]}
    >
      <View style={{ gap: spacing.xs, alignItems: 'center' }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: fontSizes.xxl,
            fontWeight: fontWeights.bold,
          }}
        >
          Simple pricing
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.base }}>
          Start free. Upgrade when you grow.
        </Text>
      </View>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription destructive>{error}</AlertDescription>
        </Alert>
      ) : null}

      <View style={{ gap: spacing.md }}>
        {PLANS.map((plan) => (
          <Card key={plan.id} style={plan.featured ? { borderColor: colors.primary } : undefined}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <View style={[styles.priceRow, { marginTop: spacing.xs }]}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: fontSizes.xxxl,
                    fontWeight: fontWeights.bold,
                  }}
                >
                  {plan.price}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: fontSizes.sm }}>
                  {plan.period}
                </Text>
              </View>
            </CardHeader>
            <CardContent style={{ gap: spacing.md }}>
              <View style={{ gap: spacing.sm }}>
                {plan.features.map((feature) => (
                  <Text key={feature} style={{ color: colors.foreground, fontSize: fontSizes.sm }}>
                    {feature}
                  </Text>
                ))}
              </View>
              <Button
                title={pendingId === plan.id ? 'Starting...' : 'Choose plan'}
                variant={plan.featured ? 'default' : 'outline'}
                loading={pendingId === plan.id}
                onPress={() => handleSelect(plan.id)}
              />
            </CardContent>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

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
